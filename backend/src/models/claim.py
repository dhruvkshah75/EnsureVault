from pydantic import BaseModel, Field, model_validator
from typing import Optional
from datetime import date
from enum import Enum


class ClaimStatus(str, Enum):
    """Allowed claim lifecycle states."""

    PENDING = "Pending"
    UNDER_REVIEW = "Under Review"
    APPROVED = "Approved"
    REJECTED = "Rejected"


class RiskLevel(str, Enum):
    """Automated risk classification output."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


# ── Request schemas ─────────────────────────────────────────────


class ClaimCreate(BaseModel):
    """Request body for submitting a new insurance claim."""

    policy_id: int = Field(
        ..., gt=0, description="ID of the policy to file the claim against", examples=[1]
    )
    incident_date: date = Field(
        ..., description="Date the incident occurred (YYYY-MM-DD)", examples=["2026-03-15"]
    )
    claim_amount: float = Field(
        ...,
        gt=0,
        le=100_000_000,
        description="Claimed amount in ₹ (must be positive)",
        examples=[25000.00],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "policy_id": 1,
                    "incident_date": "2026-03-15",
                    "claim_amount": 25000.00,
                }
            ]
        }
    }


class ClaimDecisionRequest(BaseModel):
    """Request body for approving or rejecting a claim."""

    status: ClaimStatus = Field(
        ..., description="Decision — must be 'Approved' or 'Rejected'"
    )
    rejection_reason: Optional[str] = Field(
        None,
        min_length=1,
        max_length=500,
        description="Required when rejecting a claim (1–500 chars)",
    )

    @model_validator(mode="after")
    def _reason_required_on_reject(self):
        if self.status == ClaimStatus.REJECTED and not self.rejection_reason:
            raise ValueError("rejection_reason is required when rejecting a claim")
        return self

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "status": "Approved",
                    "rejection_reason": None,
                },
                {
                    "status": "Rejected",
                    "rejection_reason": "Insufficient documentation provided for the claimed incident.",
                },
            ]
        }
    }


# ── Response schemas ────────────────────────────────────────────


class ClaimResponse(BaseModel):
    """Claim record returned by the API."""

    claim_id: int = Field(..., description="Unique claim identifier")
    policy_id: int = Field(..., description="Associated policy ID")
    customer_name: Optional[str] = Field(None, description="Policyholder name")
    policy_type: Optional[str] = Field(None, description="Policy category label")
    incident_date: date = Field(..., description="Date of the incident")
    claim_amount: float = Field(..., ge=0, description="Claimed amount in ₹")
    status: str = Field(..., description="Current claim status")
    rejection_reason: Optional[str] = Field(None, description="Reason for rejection (if rejected)")


class ClaimAssessmentResponse(BaseModel):
    """Output of the automated risk-assessment stored procedure."""

    claim_id: int = Field(..., description="Assessed claim ID")
    claim_amount: float = Field(..., ge=0, description="Amount claimed in ₹")
    max_coverage: float = Field(..., gt=0, description="Max coverage of the linked policy type")
    coverage_ratio: float = Field(
        ..., ge=0, description="claim_amount / max_coverage ratio"
    )
    customer_claim_count: int = Field(
        ..., ge=0, description="Total historical claims by this customer"
    )
    days_since_policy_start: int = Field(
        ..., description="Days elapsed since policy start date"
    )
    risk_score: str = Field(..., description="Computed risk level (LOW / MEDIUM / HIGH)")
    recommended_action: str = Field(
        ..., description="Suggested next step (e.g. 'Approve', 'Manual Review')"
    )


class DocumentResponse(BaseModel):
    """Claim-supporting document record."""

    doc_id: int = Field(..., description="Unique document identifier")
    claim_id: int = Field(..., description="Parent claim ID")
    doc_type: str = Field(..., min_length=1, description="Document category (e.g. 'ID Proof')")
    file_url: str = Field(..., min_length=1, description="URL/path to the uploaded file")


class DocumentCreate(BaseModel):
    """Request body for adding a document to a claim."""

    doc_type: str = Field(..., min_length=1, description="Document type (e.g. 'ID Proof')")
    file_url: str = Field(..., min_length=1, description="URL or path to the document")
