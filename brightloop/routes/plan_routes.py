from flask import Blueprint, request
from controllers import plan_controller

plan_bp = Blueprint("plans", __name__)


@plan_bp.route("/", methods=["POST"])
def create_plan():
    return plan_controller.create_plan(request.get_json(silent=True))


@plan_bp.route("/", methods=["GET"])
def get_plans():
    return plan_controller.get_plans(request.args)


@plan_bp.route("/product/<product_id>", methods=["GET"])
def get_plans_by_product(product_id):
    return plan_controller.get_plans_by_product(product_id)


@plan_bp.route("/<plan_id>", methods=["GET"])
def get_plan(plan_id):
    return plan_controller.get_plan(plan_id)


@plan_bp.route("/<plan_id>", methods=["PUT"])
def update_plan(plan_id):
    return plan_controller.update_plan(
        plan_id, request.get_json(silent=True)
    )


@plan_bp.route("/<plan_id>", methods=["DELETE"])
def delete_plan(plan_id):
    return plan_controller.delete_plan(plan_id)