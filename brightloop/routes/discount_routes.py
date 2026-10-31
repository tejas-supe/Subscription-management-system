from flask import Blueprint, request
from controllers import discount_controller

discount_bp = Blueprint("discounts", __name__)


@discount_bp.route("/", methods=["POST"])
def create_discount():
    return discount_controller.create_discount(request.get_json(silent=True))


@discount_bp.route("/", methods=["GET"])
def get_discounts():
    return discount_controller.get_discounts(request.args)


@discount_bp.route("/validate", methods=["POST"])
def validate_discount():
    return discount_controller.validate_discount(request.get_json(silent=True))


@discount_bp.route("/<discount_id>", methods=["PUT"])
def update_discount(discount_id):
    return discount_controller.update_discount(
        discount_id, request.get_json(silent=True)
    )


@discount_bp.route("/<discount_id>", methods=["DELETE"])
def delete_discount(discount_id):
    return discount_controller.delete_discount(discount_id)