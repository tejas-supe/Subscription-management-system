from datetime import datetime, timezone

from database.db import discounts
from services.pricing_service import calculate_discount
from utils.api_helpers import (
    api_error,
    api_response,
    number,
    object_id,
    parse_date,
    public_document,
    utc_now,
)


DISCOUNT_FIELDS = {
    "code",
    "discount_type",
    "discount_value",
    "valid_from",
    "valid_until",
    "minimum_amount",
    "maximum_discount",
    "usage_limit",
    "status",
}
VALID_STATUSES = {"active", "inactive"}


def _prepare_discount(data, partial=False):
    if not isinstance(data, dict):
        return None, "A JSON object is required"
    if not partial:
        for field in ("code", "discount_type", "discount_value"):
            if field not in data:
                return None, f"{field} is required"
    values = {key: data[key] for key in DISCOUNT_FIELDS if key in data}
    if "code" in values:
        if not isinstance(values["code"], str) or not values["code"].strip():
            return None, "Discount code is required"
        values["code"] = values["code"].strip().upper()
    if "discount_type" in values:
        if not isinstance(values["discount_type"], str) or values["discount_type"] not in {"percentage", "fixed"}:
            return None, "discount_type must be percentage or fixed"
    if "discount_value" in values:
        value = number(values["discount_value"], minimum=0.000001)
        if value is None:
            return None, "discount_value must be greater than zero"
        if values.get("discount_type") == "percentage" and value > 100:
            return None, "Percentage discounts cannot exceed 100"
        values["discount_value"] = value
    if "minimum_amount" in values:
        amount = number(values["minimum_amount"])
        if amount is None:
            return None, "minimum_amount must be non-negative"
        values["minimum_amount"] = amount
    if "maximum_discount" in values and values["maximum_discount"] is not None:
        maximum = number(values["maximum_discount"])
        if maximum is None:
            return None, "maximum_discount must be non-negative"
        values["maximum_discount"] = maximum
    for field in ("valid_from", "valid_until"):
        if field in values and values[field] is not None:
            parsed = parse_date(values[field])
            if parsed is None:
                return None, f"{field} must be an ISO 8601 date"
            values[field] = parsed
    if values.get("valid_from") and values.get("valid_until"):
        if values["valid_until"] <= values["valid_from"]:
            return None, "valid_until must be later than valid_from"
    if "usage_limit" in values and values["usage_limit"] is not None:
        limit = values["usage_limit"]
        if isinstance(limit, bool) or not isinstance(limit, int) or limit < 1:
            return None, "usage_limit must be a positive integer or null"
    if "status" in values:
        if not isinstance(values["status"], str) or values["status"] not in VALID_STATUSES:
            return None, "Status must be active or inactive"
    return values, None


def create_discount(data):
    values, error = _prepare_discount(data)
    if error:
        return api_error(error, 400)
    if values.get("code") and discounts.find_one({"code": values["code"]}):
        return api_error("Discount code already exists", 409)
    now = utc_now()
    values.update({
        "status": values.get("status", "active"),
        "minimum_amount": values.get("minimum_amount", 0),
        "maximum_discount": values.get("maximum_discount"),
        "usage_limit": values.get("usage_limit"),
        "used_count": 0,
        "created_at": now,
        "updated_at": now,
    })
    result = discounts.insert_one(values)
    return api_response(
        {"message": "Discount created", "discount": public_document(discounts.find_one({"_id": result.inserted_id}))},
        201,
    )


def get_discounts(filters):
    query = {}
    if filters.get("status"):
        if filters["status"] not in VALID_STATUSES:
            return api_error("Status must be active or inactive", 400)
        query["status"] = filters["status"]
    return api_response([public_document(item) for item in discounts.find(query)])


def _find_discount(code):
    if not isinstance(code, str) or not code.strip():
        return None
    return discounts.find_one({"code": code.strip().upper()})


def _discount_validation(discount, amount):
    if discount is None:
        return "Discount code not found", 404
    if discount.get("status") != "active":
        return "Discount is inactive", 400
    now = datetime.now(timezone.utc)
    start = parse_date(discount.get("valid_from"))
    end = parse_date(discount.get("valid_until"))
    if start and start > now:
        return "Discount is not yet valid", 400
    if end and end < now:
        return "Discount has expired", 400
    limit = discount.get("usage_limit")
    if limit is not None and discount.get("used_count", 0) >= limit:
        return "Discount usage limit has been reached", 409
    if amount < discount.get("minimum_amount", 0):
        return "Minimum purchase amount has not been met", 400
    return None


def validate_discount(data):
    if not isinstance(data, dict):
        return api_error("A JSON object is required", 400)
    amount = number(data.get("amount"))
    if amount is None:
        return api_error("amount must be a non-negative number", 400)
    discount = _find_discount(data.get("code"))
    error, status = _discount_validation(discount, amount)
    if error:
        return api_error(error, status)
    discount_amount = calculate_discount(amount, discount)
    return api_response({
        "valid": True,
        "code": discount["code"],
        "discount_amount": discount_amount,
        "total": round(amount - discount_amount, 2),
    })


def update_discount(discount_id, data):
    identifier = object_id(discount_id)
    if identifier is None:
        return api_error("Invalid discount ID", 400)
    if not isinstance(data, dict):
        return api_error("A JSON object is required", 400)
    if not DISCOUNT_FIELDS.intersection(data):
        return api_error("At least one discount field is required", 400)
    existing = discounts.find_one({"_id": identifier})
    if existing is None:
        return api_error("Discount not found", 404)
    validated, error = _prepare_discount({**existing, **data}, partial=True)
    if error:
        return api_error(error, 400)
    values = {key: validated[key] for key in data if key in DISCOUNT_FIELDS}
    if not values:
        return api_error("At least one discount field is required", 400)
    if "code" in values and discounts.find_one({"code": values["code"], "_id": {"$ne": identifier}}):
        return api_error("Discount code already exists", 409)
    values["updated_at"] = utc_now()
    values.pop("_id", None)
    values.pop("used_count", None)
    values.pop("created_at", None)
    if discounts.update_one({"_id": identifier}, {"$set": values}).matched_count == 0:
        return api_error("Discount not found", 404)
    return api_response(public_document(discounts.find_one({"_id": identifier})))


def delete_discount(discount_id):
    identifier = object_id(discount_id)
    if identifier is None:
        return api_error("Invalid discount ID", 400)
    result = discounts.update_one(
        {"_id": identifier},
        {"$set": {"status": "inactive", "updated_at": utc_now()}},
    )
    if result.matched_count == 0:
        return api_error("Discount not found", 404)
    return api_response({"message": "Discount deactivated"})