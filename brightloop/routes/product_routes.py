from flask import Blueprint, request
from controllers import product_controller

product_bp = Blueprint("products", __name__)


@product_bp.route("/", methods=["POST"])
def create_product():
    return product_controller.create_product(request.get_json(silent=True))


@product_bp.route("/", methods=["GET"])
def get_products():
    return product_controller.get_products(request.args)


@product_bp.route("/<product_id>", methods=["GET"])
def get_product(product_id):
    return product_controller.get_product(product_id)


@product_bp.route("/<product_id>", methods=["PUT"])
def update_product(product_id):
    return product_controller.update_product(
        product_id, request.get_json(silent=True)
    )


@product_bp.route("/<product_id>", methods=["DELETE"])
def delete_product(product_id):
    return product_controller.delete_product(product_id)