from flask import Blueprint, request
from controllers import subscription_controller

subscription_bp = Blueprint("subscriptions", __name__)


@subscription_bp.route("/", methods=["POST"])
def create_subscription():
    return subscription_controller.create_subscription(
        request.get_json(silent=True)
    )


@subscription_bp.route("/", methods=["GET"])
def get_subscriptions():
    return subscription_controller.get_subscriptions(request.args)


@subscription_bp.route("/customer/<customer_id>", methods=["GET"])
def get_customer_subscriptions(customer_id):
    return subscription_controller.get_customer_subscriptions(customer_id)


@subscription_bp.route("/<subscription_id>", methods=["GET"])
def get_subscription(subscription_id):
    return subscription_controller.get_subscription(subscription_id)


@subscription_bp.route("/<subscription_id>/cancel", methods=["POST"])
def cancel_subscription(subscription_id):
    return subscription_controller.change_status(subscription_id, "cancelled")


@subscription_bp.route("/<subscription_id>/pause", methods=["POST"])
def pause_subscription(subscription_id):
    return subscription_controller.change_status(subscription_id, "paused")


@subscription_bp.route("/<subscription_id>/resume", methods=["POST"])
def resume_subscription(subscription_id):
    return subscription_controller.change_status(subscription_id, "active")


@subscription_bp.route("/<subscription_id>/renew", methods=["POST"])
def renew_subscription(subscription_id):
    return subscription_controller.renew_subscription(subscription_id)


@subscription_bp.route("/<subscription_id>/change-plan", methods=["PUT"])
def change_subscription_plan(subscription_id):
    return subscription_controller.change_plan(
        subscription_id, request.get_json(silent=True)
    )