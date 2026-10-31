import re

from database.db import products
from pymongo import ReturnDocument

from utils.api_helpers import (
    api_error,
    api_response,
    object_id,
    public_document,
    utc_now,
)


PRODUCT_FIELDS = {"name", "description", "category", "status"}
VALID_STATUSES = {"active", "inactive"}


def _validate_product(data, partial=False):
    if not isinstance(data, dict):
        return None, "A JSON object is required"
    if not partial and not isinstance(data.get("name"), str):
        return None, "Product name is required"
    values = {key: data[key] for key in PRODUCT_FIELDS if key in data}
    if "name" in values:
        values["name"] = values["name"].strip()
        if not values["name"]:
            return None, "Product name cannot be empty"
    if "status" in values:
        if not isinstance(values["status"], str) or values["status"] not in VALID_STATUSES:
            return None, "Status must be active or inactive"
    return values, None


def create_product(data):
    values, error = _validate_product(data)
    if error:
        return api_error(error, 400)
    now = utc_now()
    values.update({"status": values.get("status", "active"), "created_at": now, "updated_at": now})
    result = products.insert_one(values)
    return api_response(
        {"message": "Product created", "product": public_document(products.find_one({"_id": result.inserted_id}))},
        201,
    )


def get_products(filters):
    query = {}
    status = filters.get("status")
    category = filters.get("category")
    search = filters.get("search") or filters.get("q")
    if status:
        if status not in VALID_STATUSES:
            return api_error("Status must be active or inactive", 400)
        query["status"] = status
    if category:
        query["category"] = category
    if search:
        pattern = re.escape(search.strip())
        query["$or"] = [
            {"name": {"$regex": pattern, "$options": "i"}},
            {"description": {"$regex": pattern, "$options": "i"}},
            {"category": {"$regex": pattern, "$options": "i"}},
        ]
    return api_response([public_document(item) for item in products.find(query)])


def get_product(product_id):
    identifier = object_id(product_id)
    if identifier is None:
        return api_error("Invalid product ID", 400)
    product = products.find_one({"_id": identifier})
    if product is None:
        return api_error("Product not found", 404)
    return api_response(public_document(product))


def update_product(product_id, data):
    identifier = object_id(product_id)
    if identifier is None:
        return api_error("Invalid product ID", 400)
    values, error = _validate_product(data, partial=True)
    if error:
        return api_error(error, 400)
    if not values:
        return api_error("At least one product field is required", 400)
    values["updated_at"] = utc_now()
    updated = products.find_one_and_update(
        {"_id": identifier},
        {"$set": values},
        return_document=ReturnDocument.AFTER,
    )
    if updated is None:
        return api_error("Product not found", 404)
    return api_response(public_document(products.find_one({"_id": identifier})))


def delete_product(product_id):
    identifier = object_id(product_id)
    if identifier is None:
        return api_error("Invalid product ID", 400)
    result = products.update_one(
        {"_id": identifier},
        {"$set": {"status": "inactive", "updated_at": utc_now()}},
    )
    if result.matched_count == 0:
        return api_error("Product not found", 404)
    return api_response({"message": "Product deactivated"})