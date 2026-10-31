from flask import Blueprint, request
from controllers import quotation_controller

quotation_bp = Blueprint("quotations", __name__)


@quotation_bp.route("/", methods=["POST"])
def create_quotation():
    return quotation_controller.create_quotation(request.get_json(silent=True))


@quotation_bp.route("/", methods=["GET"])
def get_quotations():
    return quotation_controller.get_quotations(request.args)


@quotation_bp.route("/customer/<customer_id>", methods=["GET"])
def get_customer_quotations(customer_id):
    return quotation_controller.get_customer_quotations(customer_id)


@quotation_bp.route("/<quotation_id>", methods=["GET"])
def get_quotation(quotation_id):
    return quotation_controller.get_quotation(quotation_id)


@quotation_bp.route("/<quotation_id>", methods=["PUT"])
def update_quotation(quotation_id):
    return quotation_controller.update_quotation(
        quotation_id, request.get_json(silent=True)
    )


@quotation_bp.route("/<quotation_id>/send", methods=["POST"])
def send_quotation(quotation_id):
    return quotation_controller.transition_quotation(quotation_id, "sent")


@quotation_bp.route("/<quotation_id>/accept", methods=["POST"])
def accept_quotation(quotation_id):
    return quotation_controller.transition_quotation(quotation_id, "accepted")


@quotation_bp.route("/<quotation_id>/reject", methods=["POST"])
def reject_quotation(quotation_id):
    return quotation_controller.transition_quotation(quotation_id, "rejected")


@quotation_bp.route("/<quotation_id>/expire", methods=["POST"])
def expire_quotation(quotation_id):
    return quotation_controller.transition_quotation(quotation_id, "expired")


@quotation_bp.route("/<quotation_id>/convert", methods=["POST"])
def convert_quotation(quotation_id):
    return quotation_controller.convert_quotation(quotation_id)