from datetime import datetime
from typing import Any


BILLING_MONTHS = {
    "monthly": 1,
    "quarterly": 3,
    "half-yearly": 6,
    "yearly": 12,
}


def calculate_discount(
    subtotal: float, discount: dict[str, Any] | None = None
) -> float:
    if not discount:
        return 0.0
    value = float(discount["discount_value"])
    if discount["discount_type"] == "percentage":
        amount = subtotal * value / 100
    else:
        amount = min(value, subtotal)
    maximum = discount.get("maximum_discount")
    if maximum is not None:
        amount = min(amount, float(maximum))
    return round(min(max(amount, 0), subtotal), 2)


def quotation_totals(
    unit_price: float,
    quantity: int,
    duration: int,
    discount: dict[str, Any] | None = None,
) -> dict[str, float]:
    subtotal = round(unit_price * quantity * duration, 2)
    discount_amount = calculate_discount(subtotal, discount)
    return {
        "subtotal": subtotal,
        "discount": discount_amount,
        "total": round(subtotal - discount_amount, 2),
    }


def add_billing_period(value: datetime, billing_cycle: str, periods: int = 1):
    import calendar

    months = BILLING_MONTHS[billing_cycle] * periods
    month_index = value.month - 1 + months
    year = value.year + month_index // 12
    month = month_index % 12 + 1
    day = min(value.day, calendar.monthrange(year, month)[1])
    return value.replace(year=year, month=month, day=day)