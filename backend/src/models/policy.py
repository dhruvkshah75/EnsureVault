from pydantic import BaseModel, Field, model_validator
from typing import Optional, List
from datetime import date
from enum import Enum


class PolicyStatus(str, Enum):
    """Allowed lifecycle states for a policy."""

    ACTIVE = "Active"
    EXPIRED = "Expired"
    CANCELLED = "Cancelled"
    PENDING = "Pending"


class PolicyCreate(BaseModel):
    """Request body for creating a new insurance policy."""

    customer_id: int = Field(
        ..., gt=0, description="ID of the customer purchasing the policy", examples=[1]
    )
    type_id: int = Field(
        ..., gt=0, description="ID of the policy type (Health / Car / Home)", examples=[1]
    )
    agent_id: int = Field(
        ..., gt=0, description="ID of the handling agent", examples=[1]
    )
    start_date: date = Field(
        ..., description="Policy coverage start date (YYYY-MM-DD)", examples=["2026-04-01"]
    )
    end_date: date = Field(
        ..., description="Policy coverage end date (YYYY-MM-DD)", examples=["2027-04-01"]
    )
    premium_amount: Optional[float] = Field(
        None,
        gt=0,
        le=1_000_000,
        description="Override premium in ₹. If omitted, auto-calculated via stored procedure.",
        examples=[6500.00],
    )

    @model_validator(mode="after")
    def _end_after_start(self):
        if self.end_date <= self.start_date:
            raise ValueError("end_date must be after start_date")
        return self

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "customer_id": 1,
                    "type_id": 1,
                    "agent_id": 1,
                    "start_date": "2026-04-01",
                    "end_date": "2027-04-01",
                    "premium_amount": 6500.00,
                }
            ]
        }
    }


class PolicyStatusUpdate(BaseModel):
    """Request body for changing a policy's lifecycle state."""

    status: PolicyStatus = Field(
        ..., description="New status to assign to the policy"
    )


class PolicyResponse(BaseModel):
    """Policy record returned by the API."""

    policy_id: int = Field(..., description="Unique policy identifier")
    customer_id: int = Field(..., description="Owning customer ID")
    customer_name: Optional[str] = Field(None, description="Customer's full name")
    type_id: int = Field(..., description="Policy type ID")
    type_name: Optional[str] = Field(None, description="Policy type label")
    agent_id: int = Field(..., description="Handling agent ID")
    agent_name: Optional[str] = Field(None, description="Agent's display name")
    start_date: date = Field(..., description="Coverage start")
    end_date: date = Field(..., description="Coverage end")
    status: str = Field(..., description="Current lifecycle status")
    premium_amount: float = Field(..., ge=0, description="Premium amount in ₹")


class NomineeResponse(BaseModel):
    """Single nominee entry linked to a policy."""

    nom_id: int = Field(..., description="Unique nominee identifier")
    nominee_name: str = Field(..., min_length=1, description="Nominee's full name")
    relation: str = Field(..., min_length=1, description="Relation to the policyholder")
    share_percent: float = Field(
        ..., gt=0, le=100, description="Payout share percentage (0–100)"
    )


class PolicyDetailResponse(BaseModel):
    """Full policy view including associated nominees."""

    policy: PolicyResponse
    nominees: List[NomineeResponse]
