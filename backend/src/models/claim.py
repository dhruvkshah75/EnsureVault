from pydantic import BaseModel, Field
from typing import Optional
from datetime import date
from enum import Enum


class ClaimStatus(str, Enum):
    PENDING = "Pending"
    UNDER_REVIEW = "Under Review"
    APPROVED = "Approved"
    REJECTED = "Rejected"


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class ClaimDecisionRequest(BaseModel):
    status: ClaimStatus = Field(..., description="Must be 'Approved' or 'Rejected'")
    rejection_reason: Optional[str] = Field(
        None,
        max_length=500,
        description="Required when rejecting a claim",
    )

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


class ClaimResponse(BaseModel):
    claim_id: int
    policy_id: int
    customer_name: Optional[str] = None
    policy_type: Optional[str] = None
    incident_date: date
    claim_amount: float
    status: str
    rejection_reason: Optional[str] = None


class ClaimAssessmentResponse(BaseModel):
    claim_id: int
    claim_amount: float
    max_coverage: float
    coverage_ratio: float
    customer_claim_count: int
    days_since_policy_start: int
    risk_score: str
    recommended_action: str


class DocumentResponse(BaseModel):
    doc_id: int
    claim_id: int
    doc_type: str
    file_url: str
