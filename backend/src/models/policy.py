from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date
from enum import Enum


class PolicyStatus(str, Enum):
    ACTIVE = "Active"
    EXPIRED = "Expired"
    CANCELLED = "Cancelled"
    PENDING = "Pending"


class PolicyCreate(BaseModel):
    customer_id: int = Field(..., gt=0)
    type_id: int = Field(..., gt=0)
    agent_id: int = Field(..., gt=0)
    start_date: date
    end_date: date
    premium_amount: Optional[float] = Field(None, gt=0, description="If not provided, calculated via stored procedure")

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
    status: PolicyStatus


class PolicyResponse(BaseModel):
    policy_id: int
    customer_id: int
    customer_name: Optional[str] = None
    type_id: int
    type_name: Optional[str] = None
    agent_id: int
    agent_name: Optional[str] = None
    start_date: date
    end_date: date
    status: str
    premium_amount: float


class NomineeResponse(BaseModel):
    nom_id: int
    nominee_name: str
    relation: str
    share_percent: float


class PolicyDetailResponse(BaseModel):
    policy: PolicyResponse
    nominees: List[NomineeResponse]
