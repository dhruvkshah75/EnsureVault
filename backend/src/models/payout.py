from datetime import date
from enum import Enum

from pydantic import BaseModel, Field


class PaymentMode(str, Enum):
    """Accepted payment modes for payouts and premium payments."""

    CREDIT_CARD = "Credit Card"
    DEBIT_CARD = "Debit Card"
    UPI = "UPI"
    NET_BANKING = "Net Banking"
    CASH = "Cash"


class PaymentStatus(str, Enum):
    """Status of a payment transaction."""

    SUCCESS = "Success"
    FAILED = "Failed"
    PENDING = "Pending"


# ── Request schemas ──────────────────────────────────────────────


class ApproveClaimRequest(BaseModel):
    """Request body for approving a claim and issuing a payout."""

    payout_amount: float = Field(
        ...,
        gt=0,
        le=100_000_000,
        description="Amount to pay out to the customer in ₹ (must be positive and ≤ max_coverage)",
        examples=[25000.00],
    )
    payment_mode: PaymentMode = Field(
        ...,
        description="Mode of payment for the payout",
        examples=["UPI"],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {"payout_amount": 25000.00, "payment_mode": "UPI"}
            ]
        }
    }


class PremiumPaymentRequest(BaseModel):
    """Request body for recording a premium payment."""

    payment_mode: PaymentMode = Field(
        ...,
        description="Mode of payment for the premium",
        examples=["Credit Card"],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [{"payment_mode": "Credit Card"}]
        }
    }


# ── Response schemas ─────────────────────────────────────────────


class ApproveClaimResponse(BaseModel):
    """Data returned after a claim is approved and payout recorded."""

    claim_id: int = Field(..., description="ID of the approved claim")
    txn_id: int = Field(..., description="Payment transaction ID")
    payout_amount: float = Field(..., ge=0, description="Amount paid out in ₹")


class PremiumPaymentResponse(BaseModel):
    """Data returned after a premium payment is recorded."""

    policy_id: int = Field(..., description="ID of the policy")
    txn_id: int = Field(..., description="Payment transaction ID")
    amount: float = Field(..., ge=0, description="Premium amount paid in ₹")


class PaymentRecord(BaseModel):
    """A single payment transaction record."""

    payment_id: int = Field(..., description="Unique payment ID")
    policy_id: int = Field(..., description="Associated policy ID")
    amount: float = Field(..., ge=0, description="Payment amount in ₹")
    payment_date: date = Field(..., description="Date the payment was made")
    payment_mode: str = Field(..., description="Mode of payment used")
    status: str = Field(..., description="Payment status (Success / Failed / Pending)")
