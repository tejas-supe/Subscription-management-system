from database.db import plans, products
from services.pricing_service import BILLING_MONTHS
from utils.api_helpers import (
    api_error,
    api_response,
    number,
    object_id,
    public_document,
    utc_now,
)


PLAN_FIELDS = {
    "product_id",
    "name",
    "description",
    "price",
    "billing_cycle",
    "features",
    "status",
}
VALID_STATUSES = {"active", "inactive"}


def _prepare_plan(data, partial=False):
    if not isinstance(data, dict):
        return None, "A JSON object is required"
    if not partial:
        for field in ("product_id", "name", "price", "billing_cycle"):
            if field not in data:
                return None, f"{field} is required"
    values = {key: data[key] for key in PLAN_FIELDS if key in data}
    if "product_id" in values:
        identifier = object_id(values["product_id"])
        if identifier is None:
            return None, "Invalid product_id"
        product = products.find_one({"_id": identifier, "status": "active"})
        if product is None:
            return None, "Active product not found"
        values["product_id"] = identifier
    if "name" in values:
        if not isinstance(values["name"], str) or not values["name"].strip():
            return None, "Plan name is required"
        values["name"] = values["name"].strip()
    if "price" in values:
        price = number(values["price"])
        if price is None:
            return None, "Price must be a non-negative number"
        values["price"] = price
    if "billing_cycle" in values:
        if not isinstance(values["billing_cycle"], str) or values["billing_cycle"] not in BILLING_MONTHS:
            return None, "billing_cycle must be monthly, quarterly, half-yearly, or yearly"
    if "features" in values and not isinstance(values["features"], list):
        return None, "Features must be a list"
    if "status" in values:
        if not isinstance(values["status"], str) or values["status"] not in VALID_STATUSES:
            return None, "Status must be active or inactive"
    return values, None


def create_plan(data):
    values, error = _prepare_plan(data)
    if error:
        return api_error(error, 404 if error == "Active product not found" else 400)
    now = utc_now()
    values.update({"status": values.get("status", "active"), "created_at": now, "updated_at": now})
    result = plans.insert_one(values)
    return api_response(
        {"message": "Plan created", "plan": public_document(plans.find_one({"_id": result.inserted_id}))},
        201,
    )


def _list_plans(query):
    return api_response([public_document(item) for item in plans.find(query)])


def get_plans(filters):
    query = {}
    if filters.get("status"):
        if filters["status"] not in VALID_STATUSES:
            return api_error("Status must be active or inactive", 400)
        query["status"] = filters["status"]
    if filters.get("product_id"):
        identifier = object_id(filters["product_id"])
        if identifier is None:
            return api_error("Invalid product_id", 400)
        query["product_id"] = identifier
    return _list_plans(query)


def get_plans_by_product(product_id):
    identifier = object_id(product_id)
    if identifier is None:
        return api_error("Invalid product ID", 400)
    if products.find_one({"_id": identifier}) is None:
        return api_error("Product not found", 404)
    return _list_plans({"product_id": identifier})


def get_plan(plan_id):
    identifier = object_id(plan_id)
    if identifier is None:
        return api_error("Invalid plan ID", 400)
    plan = plans.find_one({"_id": identifier})
    if plan is None:
        return api_error("Plan not found", 404)
    return api_response(public_document(plan))


def update_plan(plan_id, data):
    identifier = object_id(plan_id)
    if identifier is None:
        return api_error("Invalid plan ID", 400)
    values, error = _prepare_plan(data, partial=True)
    if error:
        return api_error(error, 404 if error == "Active product not found" else 400)
    if not values:
        return api_error("At least one plan field is required", 400)
    values["updated_at"] = utc_now()
    if plans.update_one({"_id": identifier}, {"$set": values}).matched_count == 0:
        return api_error("Plan not found", 404)
    return api_response(public_document(plans.find_one({"_id": identifier})))


def delete_plan(plan_id):
    identifier = object_id(plan_id)
    if identifier is None:
        return api_error("Invalid plan ID", 400)
    result = plans.update_one(
        {"_id": identifier},
        {"$set": {"status": "inactive", "updated_at": utc_now()}},
    )
    if result.matched_count == 0:
        return api_error("Plan not found", 404)
    return api_response({"message": "Plan deactivated"})