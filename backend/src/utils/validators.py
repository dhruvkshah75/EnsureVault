from datetime import date
from fastapi import HTTPException


def validate_date_range(start_date: date, end_date: date) -> None:
    """Ensure end_date is after start_date."""
    if end_date <= start_date:
        raise HTTPException(
            status_code=400,
            detail="end_date must be after start_date",
        )


def validate_positive_amount(amount: float, field_name: str = "amount") -> None:
    """Ensure amount is positive."""
    if amount <= 0:
        raise HTTPException(
            status_code=400,
            detail=f"{field_name} must be a positive number",
        )


def validate_share_percent_total(percentages: list[float]) -> None:
    """Ensure nominee share percentages sum to 100."""
    total = sum(percentages)
    if abs(total - 100.0) > 0.01:
        raise HTTPException(
            status_code=400,
            detail=f"Nominee share percentages must sum to 100, got {total}",
        )
