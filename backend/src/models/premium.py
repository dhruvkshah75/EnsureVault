from pydantic import BaseModel, Field


class PremiumCalculateRequest(BaseModel):
    """Request body for calculating a premium for a customer + policy type pair."""

    customer_id: int = Field(
        ...,
        gt=0,
        description="ID of the customer (must be a positive integer)",
        examples=[1],
    )
    type_id: int = Field(
        ...,
        gt=0,
        description="ID of the policy type (must be a positive integer)",
        examples=[1],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [{"customer_id": 1, "type_id": 1}]
        }
    }


class PremiumCalculateResponse(BaseModel):
    """Breakdown returned after a premium calculation."""

    customer_id: int = Field(..., description="Customer ID used in calculation")
    type_id: int = Field(..., description="Policy type ID used in calculation")
    type_name: str = Field(..., description="Human-readable policy type name (e.g. 'Health')")
    base_premium: float = Field(..., ge=0, description="Base premium before risk adjustment")
    risk_multiplier: float = Field(..., ge=0, description="Risk multiplier applied to base premium")
    calculated_premium: float = Field(..., ge=0, description="Final premium after applying risk multiplier")


class RiskFactorsResponse(BaseModel):
    """Risk factors and multiplier details for a specific policy type."""

    type_id: int = Field(..., description="Policy type ID")
    type_name: str = Field(..., description="Human-readable policy type name")
    base_premium: float = Field(..., ge=0, description="Base premium for the policy type")
    max_coverage: float = Field(..., gt=0, description="Maximum coverage amount")
    type_multiplier: float = Field(..., ge=0, description="Type-specific risk multiplier")
    description: str = Field(..., description="Human-readable explanation of the risk factor")
