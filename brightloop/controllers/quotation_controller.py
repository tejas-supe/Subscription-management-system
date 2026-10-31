from datetime import timedelta

from pymongo import ReturnDocument
from pymongo.errors import PyMongoError

from controllers.discount_controller import (
    _discount_validation,
    _find_discount,
)
from database.db import discounts, plans, quotations, subscriptions
from services.pricing_service import quotation_totals
from utils.api_helpers import (
    api_error,
    api_response,
    object_id,
    parse_date,
    public_document,
    utc_now,
)
from utils.number_generator import generate_number


def _quote_values(data, existing=None):
    if not isinstance(data, dict):
        return None, "A JSON object is required"
    values = dict(existing or {})
    for field in ("customer_id", "plan_id", "quantity", "duration", "discount_code", "expiry_date"):
        if field in data:
            values[field] = data[field]
    if not values.get("customer_id") or not isinstance(values["customer_id"], str):
        return None, "customer_id is required"
    plan_id = object_id(values.get("plan_id"))
    if plan_id is None:
        return None, "A valid plan_id is required"
    plan = plans.find_one({"_id": plan_id, "status": "active"})
    if plan is None:
        return None, "Active plan not found"
    quantity = values.get("quantity", 1)
    duration = values.get("duration", 1)
    if isinstance(quantity, bool) or not isinstance(quantity, int) or quantity < 1:
        return None, "quantity must be a positive integer"
    if isinstance(duration, bool) or not isinstance(duration, int) or duration < 1:
        return None, "duration must be a positive integer"
    discount = None
    code = values.get("discount_code")
    if code:
        discount = _find_discount(code)
        err, _ = _discount_validation(
            discount, float(plan["price"]) * quantity * duration
        )
        if err:
            return None, err
    totals = quotation_totals(
        float(plan["price"]), quantity, duration, discount
    )
    now = utc_now()
    expiry_date = values.get("expiry_date")
    if expiry_date is not None:
        expiry_date = parse_date(expiry_date)
        if expiry_date is None or expiry_date <= now:
            return None, "expiry_date must be a future ISO 8601 date"
    else:
        expiry_date = now + timedelta(days=30)
    return {
        "customer_id": values["customer_id"].strip(),
        "plan_id": plan_id,
        "product_id": plan["product_id"],
        "quantity": quantity,
        "duration": duration,
        "billing_cycle": plan["billing_cycle"],
        "unit_price": float(plan["price"]),
        **totals,
        "discount_code": discount["code"] if discount else None,
        "discount_id": discount["_id"] if discount else None,
        "status": "draft",
        "quotation_date": now,
        "expiry_date": expiry_date,
    }, None


def create_quotation(data):
    values, error = _quote_values(data)
    if error:
        return api_error(error, 404 if error == "Active plan not found" else 400)
    now = utc_now()
    values.update({
        "quotation_number": generate_number("QUO"),
        "created_at": now,
        "updated_at": now,
    })
    result = quotations.insert_one(values)
    return api_response(
        {"message": "Quotation created", "quotation": public_document(quotations.find_one({"_id": result.inserted_id}))},
        201,
    )


def get_quotations(filters):
    query = {}
    if filters.get("customer_id"):
        query["customer_id"] = filters["customer_id"]
    if filters.get("status"):
        query["status"] = filters["status"]
    return api_response([public_document(item) for item in quotations.find(query)])


def get_customer_quotations(customer_id):
    return api_response([
        public_document(item)
        for item in quotations.find({"customer_id": customer_id})
    ])


def get_quotation(quotation_id):
    identifier = object_id(quotation_id)
    if identifier is None:
        return api_error("Invalid quotation ID", 400)
    quotation = quotations.find_one({"_id": identifier})
    if quotation is None:
        return api_error("Quotation not found", 404)
    return api_response(public_document(quotation))


def update_quotation(quotation_id, data):
    identifier = object_id(quotation_id)
    if identifier is None:
        return api_error("Invalid quotation ID", 400)
    quotation = quotations.find_one({"_id": identifier})
    if quotation is None:
        return api_error("Quotation not found", 404)
    if quotation.get("status") != "draft":
        return api_error("Only draft quotations can be updated", 409)
    if not isinstance(data, dict):
        return api_error("A JSON object is required", 400)
    editable_fields = {
        "customer_id",
        "plan_id",
        "quantity",
        "duration",
        "discount_code",
        "expiry_date",
    }
    if not editable_fields.intersection(data):
        return api_error("At least one quotation field is required", 400)
    values, error = _quote_values(data, quotation)
    if error:
        return api_error(error, 404 if error == "Active plan not found" else 400)
    values["updated_at"] = utc_now()
    result = quotations.update_one(
        {"_id": identifier, "status": "draft"}, {"$set": values}
    )
    if result.matched_count == 0:
        return api_error("Quotation status changed; reload and retry", 409)
    return api_response(public_document(quotations.find_one({"_id": identifier})))


def transition_quotation(quotation_id, target_status):
    identifier = object_id(quotation_id)
    if identifier is None:
        return api_error("Invalid quotation ID", 400)
    allowed_sources = {
        "sent": {"draft"},
        "accepted": {"sent"},
        "rejected": {"draft", "sent"},
        "expired": {"draft", "sent"},
    }
    quotation = quotations.find_one({"_id": identifier})
    if quotation is None:
        return api_error("Quotation not found", 404)
    if quotation.get("status") not in allowed_sources[target_status]:
        return api_error(
            f"Cannot change quotation from {quotation.get('status')} to {target_status}",
            409,
        )
    expiry_date = parse_date(quotation.get("expiry_date"))
    if target_status == "accepted" and expiry_date and expiry_date <= utc_now():
        quotations.update_one(
            {"_id": identifier, "status": quotation["status"]},
            {"$set": {"status": "expired", "updated_at": utc_now()}},
        )
        return api_error("Quotation has expired", 409)
    result = quotations.update_one(
        {"_id": identifier, "status": quotation["status"]},
        {"$set": {"status": target_status, "updated_at": utc_now()}},
    )
    if result.modified_count == 0:
        return api_error("Quotation status changed; reload and retry", 409)
    return api_response(public_document(quotations.find_one({"_id": identifier})))


def convert_quotation(quotation_id):
    identifier = object_id(quotation_id)
    if identifier is None:
        return api_error("Invalid quotation ID", 400)
    now = utc_now()
    quotation = quotations.find_one({"_id": identifier})
    if quotation is None:
        return api_error("Quotation not found", 404)
    if quotation.get("status") != "accepted":
        return api_error("Only accepted quotations can be converted", 409)
    expiry_date = parse_date(quotation.get("expiry_date"))
    if expiry_date is not None and expiry_date <= now:
        quotations.update_one(
            {"_id": identifier, "status": "accepted"},
            {"$set": {"status": "expired", "updated_at": now}},
        )
        return api_error("Quotation has expired", 409)
    claimed = quotations.find_one_and_update(
        {"_id": identifier, "status": "accepted"},
        {"$set": {"status": "converting", "updated_at": now}},
        return_document=ReturnDocument.AFTER,
    )
    if claimed is None:
        return api_error("Quotation is already being converted", 409)

    discount_id = claimed.get("discount_id")
    discount_consumed = False
    subscription_id = None
    try:
        if discount_id:
            discount = discounts.find_one({"_id": discount_id})
            error, status = _discount_validation(discount, claimed["subtotal"])
            if error:
                quotations.update_one(
                    {"_id": identifier, "status": "converting"},
                    {"$set": {"status": "accepted", "updated_at": utc_now()}},
                )
                return api_error(error, status)
            eligible = discounts.find_one_and_update(
                {
                    "_id": discount_id,
                    "status": "active",
                    "$or": [
                        {"usage_limit": None},
                        {"$expr": {"$lt": ["$used_count", "$usage_limit"]}},
                    ],
                },
                {"$inc": {"used_count": 1}, "$set": {"updated_at": utc_now()}},
                return_document=ReturnDocument.AFTER,
            )
            if eligible is None:
                quotations.update_one(
                    {"_id": identifier, "status": "converting"},
                    {"$set": {"status": "accepted", "updated_at": utc_now()}},
                )
                return api_error("Discount usage limit has been reached", 409)
            discount_consumed = True
        sub_number = generate_number("SUB")
        subscription = {
            "subscription_number": sub_number,
            "customer_id": claimed["customer_id"],
            "product_id": claimed["product_id"],
            "plan_id": claimed["plan_id"],
            "quotation_id": identifier,
            "start_date": now,
            "end_date": None,
            "billing_cycle": claimed["billing_cycle"],
            "quantity": claimed["quantity"],
            "price": claimed["total"],
            "status": "pending",
            "auto_renew": False,
            "created_at": now,
            "updated_at": now,
        }
        from services.pricing_service import add_billing_period

        subscription["end_date"] = add_billing_period(
            now, claimed["billing_cycle"], claimed["duration"]
        )
        result = subscriptions.insert_one(subscription)
        subscription_id = result.inserted_id
        quotations.update_one(
            {"_id": identifier, "status": "converting"},
            {
                "$set": {
                    "status": "converted",
                    "subscription_id": result.inserted_id,
                    "updated_at": utc_now(),
                }
            },
        )
    except PyMongoError:
        quotations.update_one(
            {"_id": identifier, "status": "converting"},
            {"$set": {"status": "accepted", "updated_at": utc_now()}},
        )
        if discount_consumed:
            discounts.update_one(
                {"_id": discount_id, "used_count": {"$gt": 0}},
                {"$inc": {"used_count": -1}, "$set": {"updated_at": utc_now()}},
            )
        if subscription_id is not None:
            subscriptions.delete_one({"_id": subscription_id})
        raise
    return api_response({
        "message": "Quotation converted",
        "quotation": public_document(quotations.find_one({"_id": identifier})),
        "subscription": public_document(subscriptions.find_one({"_id": result.inserted_id})),
    }, 201)