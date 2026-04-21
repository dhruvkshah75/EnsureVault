from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class PolicyTypeName(str, Enum):
    """Allowed insurance plan categories."""

    HEALTH = "Health"
    CAR = "Car"
    HOME = "Home"


class PolicyTypeCreate(BaseModel):
    """Request body for creating a new insurance plan type."""

    type_name: PolicyTypeName = Field(
        ...,
        description="Insurance category — must be one of Health, Car, Home",
    )
    base_premium: float = Field(
        ...,
        gt=0,
        le=1_000_000,
        description="Base premium amount in ₹ (must be > 0)",
        examples=[5000.00],
    )
    max_coverage: float = Field(
        ...,
        gt=0,
        le=100_000_000,
        description="Maximum coverage amount in ₹ (must be > 0)",
        examples=[500000.00],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "type_name": "Health",
                    "base_premium": 5000.00,
                    "max_coverage": 500000.00,
                }
            ]
        }
    }


class PolicyTypeUpdate(BaseModel):
    """Request body for partially updating an insurance plan type.
    Only supplied fields are changed; omitted fields stay unchanged.
    """

    type_name: Optional[PolicyTypeName] = Field(
        None,
        description="New insurance category name",
    )
    base_premium: Optional[float] = Field(
        None,
        gt=0,
        le=1_000_000,
        description="New base premium amount in ₹ (must be > 0 if provided)",
    )
    max_coverage: Optional[float] = Field(
        None,
        gt=0,
        le=100_000_000,
        description="New maximum coverage in ₹ (must be > 0 if provided)",
    )


class PolicyTypeResponse(BaseModel):
    """Insurance plan type returned by the API."""

    type_id: int = Field(..., description="Unique identifier")
    type_name: str = Field(..., description="Category name (Health / Car / Home)")
    base_premium: float = Field(..., ge=0, description="Base premium in ₹")
    max_coverage: float = Field(..., gt=0, description="Maximum coverage in ₹")
