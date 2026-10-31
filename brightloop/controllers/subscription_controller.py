from database.db import plans, subscriptions
from services.pricing_service import BILLING_MONTHS, add_billing_period
from utils.api_helpers import (
    api_error,
    api_response,
    object_id,
    parse_date,
    public_document,
    utc_now,
)
from utils.number_generator import generate_number


SUBSCRIPTION_STATUSES = {"pending", "active", "paused", "cancelled", "expired"}


def create_subscription(data):
    if not isinstance(data, dict):
        return api_error("A JSON object is required", 400)
    if data.get("quotation_id"):
        from controllers.quotation_controller import convert_quotation

        return convert_quotation(data["quotation_id"])
    customer_id = data.get("customer_id")
    if not isinstance(customer_id, str) or not customer_id.strip():
        return api_error("customer_id is required", 400)
    plan_id = object_id(data.get("plan_id"))
    if plan_id is None:
        return api_error("A valid plan_id is required", 400)
    plan = plans.find_one({"_id": plan_id, "status": "active"})
    if plan is None:
        return api_error("Active plan not found", 404)
    quantity = data.get("quantity", 1)
    duration = data.get("duration", 1)
    if isinstance(quantity, bool) or not isinstance(quantity, int) or quantity < 1:
        return api_error("quantity must be a positive integer", 400)
    if isinstance(duration, bool) or not isinstance(duration, int) or duration < 1:
        return api_error("duration must be a positive integer", 400)
    if "auto_renew" in data and not isinstance(data["auto_renew"], bool):
        return api_error("auto_renew must be a boolean", 400)
    start_date = parse_date(data.get("start_date")) if data.get("start_date") else utc_now()
    if start_date is None:
        return api_error("start_date must be an ISO 8601 date", 400)
    billing_cycle = plan["billing_cycle"]
    now = utc_now()
    subscription = {
        "subscription_number": generate_number("SUB"),
        "customer_id": customer_id.strip(),
        "product_id": plan["product_id"],
        "plan_id": plan_id,
        "quotation_id": None,
        "start_date": start_date,
        "end_date": add_billing_period(start_date, billing_cycle, duration),
        "billing_cycle": billing_cycle,
        "quantity": quantity,
        "price": round(float(plan["price"]) * quantity * duration, 2),
        "status": "pending",
        "auto_renew": data.get("auto_renew", False),
        "created_at": now,
        "updated_at": now,
    }
    result = subscriptions.insert_one(subscription)
    return api_response(
        {"message": "Subscription created", "subscription": public_document(subscriptions.find_one({"_id": result.inserted_id}))},
        201,
    )


def get_subscriptions(filters):
    query = {}
    if filters.get("customer_id"):
        query["customer_id"] = filters["customer_id"]
    if filters.get("status"):
        if filters["status"] not in SUBSCRIPTION_STATUSES:
            return api_error("Invalid subscription status", 400)
        query["status"] = filters["status"]
    return api_response([
        public_document(item) for item in subscriptions.find(query)
    ])


def get_customer_subscriptions(customer_id):
    return api_response([
        public_document(item)
        for item in subscriptions.find({"customer_id": customer_id})
    ])


def get_subscription(subscription_id):
    identifier = object_id(subscription_id)
    if identifier is None:
        return api_error("Invalid subscription ID", 400)
    subscription = subscriptions.find_one({"_id": identifier})
    if subscription is None:
        return api_error("Subscription not found", 404)
    return api_response(public_document(subscription))


def change_status(subscription_id, target_status):
    identifier = object_id(subscription_id)
    if identifier is None:
        return api_error("Invalid subscription ID", 400)
    transitions = {
        "paused": {"active"},
        "active": {"pending", "paused"},
        "cancelled": {"pending", "active", "paused"},
    }
    subscription = subscriptions.find_one({"_id": identifier})
    if subscription is None:
        return api_error("Subscription not found", 404)
    current = subscription.get("status")
    if current not in transitions.get(target_status, set()):
        return api_error(
            f"Cannot change subscription from {current} to {target_status}",
            409,
        )
    result = subscriptions.update_one(
        {"_id": identifier, "status": current},
        {"$set": {"status": target_status, "updated_at": utc_now()}},
    )
    if result.modified_count == 0:
        return api_error("Subscription status changed; reload and retry", 409)
    return api_response(public_document(subscriptions.find_one({"_id": identifier})))


def renew_subscription(subscription_id):
    identifier = object_id(subscription_id)
    if identifier is None:
        return api_error("Invalid subscription ID", 400)
    subscription = subscriptions.find_one({"_id": identifier})
    if subscription is None:
        return api_error("Subscription not found", 404)
    if subscription.get("status") not in {"active", "expired"}:
        return api_error("Only active or expired subscriptions can be renewed", 409)
    now = utc_now()
    previous_end = parse_date(subscription.get("end_date"))
    anchor = previous_end if previous_end and previous_end > now else now
    cycle = subscription.get("billing_cycle")
    if cycle not in BILLING_MONTHS:
        return api_error("Subscription has an invalid billing cycle", 409)
    end_date = add_billing_period(anchor, cycle)
    updated_fields = {
        "status": "active",
        "end_date": end_date,
        "updated_at": now,
    }
    if subscription["status"] == "expired":
        updated_fields["start_date"] = now
    result = subscriptions.update_one(
        {"_id": identifier, "status": subscription["status"]},
        {"$set": updated_fields},
    )
    if result.modified_count == 0:
        return api_error("Subscription changed; reload and retry", 409)
    return api_response(public_document(subscriptions.find_one({"_id": identifier})))


def change_plan(subscription_id, data):
    identifier = object_id(subscription_id)
    if identifier is None:
        return api_error("Invalid subscription ID", 400)
    if not isinstance(data, dict):
        return api_error("A JSON object is required", 400)
    plan_id = object_id(data.get("plan_id"))
    if plan_id is None:
        return api_error("A valid plan_id is required", 400)
    plan = plans.find_one({"_id": plan_id, "status": "active"})
    if plan is None:
        return api_error("Active plan not found", 404)
    subscription = subscriptions.find_one({"_id": identifier})
    if subscription is None:
        return api_error("Subscription not found", 404)
    if subscription.get("status") not in {"pending", "active", "paused"}:
        return api_error("This subscription cannot change plans", 409)
    quantity = subscription.get("quantity", 1)
    values = {
        "plan_id": plan_id,
        "product_id": plan["product_id"],
        "billing_cycle": plan["billing_cycle"],
        "price": round(float(plan["price"]) * quantity, 2),
        "updated_at": utc_now(),
    }
    result = subscriptions.update_one(
        {"_id": identifier, "status": subscription["status"]},
        {"$set": values},
    )
    if result.modified_count == 0:
        return api_error("Subscription changed; reload and retry", 409)
    return api_response(public_document(subscriptions.find_one({"_id": identifier})))