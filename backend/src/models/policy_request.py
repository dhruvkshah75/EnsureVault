from datetime import date, datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class PolicyRequestStatus(str, Enum):
    """Status of a policy request."""

    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"


class PolicyRequestCreate(BaseModel):
    """Request body for creating a new policy request."""

    type_id: int = Field(
        ..., gt=0, description="ID of the policy type (Health / Car / Home)", examples=[1]
    )
    start_date: date = Field(
        ..., description="Desired policy coverage start date (YYYY-MM-DD)", examples=["2026-04-15"]
    )
    end_date: date = Field(
        ..., description="Desired policy coverage end date (YYYY-MM-DD)", examples=["2027-04-15"]
    )
    premium_amount: Optional[float] = Field(
        None,
        gt=0,
        le=1_000_000,
        description="Optional premium override. If omitted, server calculates.",
        examples=[6500.00],
    )

    class Config:
        json_schema_extra = {
            "examples": [
                {
                    "type_id": 1,
                    "start_date": "2026-04-15",
                    "end_date": "2027-04-15",
                    "premium_amount": None,
                }
            ]
        }


class PolicyRequestResponse(BaseModel):
    """Policy request record returned by the API."""

    request_id: int = Field(..., description="Unique request identifier")
    customer_id: int = Field(..., description="Customer who made the request")
    agent_id: int = Field(..., description="Assigned agent (auto-set from customer)")
    type_id: int = Field(..., description="Policy type ID")
    start_date: date = Field(..., description="Requested coverage start date")
    end_date: date = Field(..., description="Requested coverage end date")
    premium_amount: Optional[float] = Field(None, ge=0, description="Calculated or provided premium")
    status: str = Field(..., description="Request status: Pending, Approved, or Rejected")
    requested_at: datetime = Field(..., description="When request was created")
    reviewed_at: Optional[datetime] = Field(None, description="When agent reviewed")
    reviewed_by: Optional[int] = Field(None, description="Agent ID who reviewed")
    rejection_reason: Optional[str] = Field(None, description="Reason if rejected")


class PolicyRequestApprovalRequest(BaseModel):
    """Request to approve a policy request."""

    reviewed_by: int = Field(..., gt=0, description="Agent ID approving this request", examples=[1])


class PolicyRequestRejectionRequest(BaseModel):
    """Request to reject a policy request."""

    rejection_reason: str = Field(
        ..., min_length=5, max_length=500, description="Reason for rejection"
    )
    reviewed_by: int = Field(..., gt=0, description="Agent ID rejecting this request", examples=[1])
