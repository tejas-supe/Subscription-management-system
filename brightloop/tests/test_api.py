from datetime import datetime, timezone
from types import SimpleNamespace

from app import app
from bson import ObjectId
from controllers import quotation_controller
from services.pricing_service import add_billing_period, quotation_totals


def test_health_endpoint():
    response = app.test_client().get("/")

    assert response.status_code == 200
    assert response.get_json() == {"message": "Brightloop Flask API running"}


def test_module_routes_are_registered():
    paths = {rule.rule for rule in app.url_map.iter_rules()}

    assert "/api/products/" in paths
    assert "/api/plans/product/<product_id>" in paths
    assert "/api/discounts/validate" in paths
    assert "/api/quotations/<quotation_id>/convert" in paths
    assert "/api/subscriptions/<subscription_id>/change-plan" in paths


def test_quotation_totals_apply_capped_fixed_discount():
    totals = quotation_totals(
        unit_price=120,
        quantity=2,
        duration=3,
        discount={
            "discount_type": "fixed",
            "discount_value": 100,
            "maximum_discount": 50,
        },
    )

    assert totals == {"subtotal": 720, "discount": 50, "total": 670}


def test_quotation_uses_plan_price_not_client_submitted_total(monkeypatch):
    plan_id = ObjectId()
    quotation_id = ObjectId()
    plan = {
        "_id": plan_id,
        "status": "active",
        "price": 100,
        "billing_cycle": "monthly",
        "product_id": ObjectId(),
    }

    class FakePlans:
        def find_one(self, query):
            return plan

    class FakeQuotations:
        saved = None

        def insert_one(self, document):
            self.saved = {**document, "_id": quotation_id}
            return SimpleNamespace(inserted_id=quotation_id)

        def find_one(self, query):
            return self.saved

    fake_quotations = FakeQuotations()
    monkeypatch.setattr(quotation_controller, "plans", FakePlans())
    monkeypatch.setattr(quotation_controller, "quotations", fake_quotations)

    response = app.test_client().post(
        "/api/quotations/",
        json={
            "customer_id": "customer-1",
            "plan_id": str(plan_id),
            "quantity": 2,
            "duration": 3,
            "unit_price": 0,
            "total": 0,
        },
    )

    assert response.status_code == 201
    quotation = response.get_json()["quotation"]
    assert quotation["unit_price"] == 100
    assert quotation["subtotal"] == 600
    assert quotation["total"] == 600


def test_billing_period_clamps_to_last_day_of_month():
    start = datetime(2026, 1, 31, tzinfo=timezone.utc)

    assert add_billing_period(start, "monthly") == datetime(
        2026, 2, 28, tzinfo=timezone.utc
    )


def test_invalid_product_payload_returns_bad_request():
    response = app.test_client().post("/api/products/", json={})

    assert response.status_code == 400
    assert response.get_json() == {"error": "Product name is required"}


def test_invalid_subscription_id_returns_bad_request():
    response = app.test_client().get("/api/subscriptions/not-an-object-id")

    assert response.status_code == 400
    assert response.get_json() == {"error": "Invalid subscription ID"}
