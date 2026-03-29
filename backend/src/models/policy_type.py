from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class PolicyTypeName(str, Enum):
    HEALTH = "Health"
    CAR = "Car"
    HOME = "Home"


class PolicyTypeCreate(BaseModel):
    type_name: PolicyTypeName
    base_premium: float = Field(..., gt=0, description="Base premium amount (must be positive)")
    max_coverage: float = Field(..., gt=0, description="Maximum coverage amount (must be positive)")

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
    type_name: Optional[PolicyTypeName] = None
    base_premium: Optional[float] = Field(None, gt=0)
    max_coverage: Optional[float] = Field(None, gt=0)


class PolicyTypeResponse(BaseModel):
    type_id: int
    type_name: str
    base_premium: float
    max_coverage: float
