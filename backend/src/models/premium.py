from pydantic import BaseModel, Field

class PremiumCalculateRequest(BaseModel):
    customer_id: int = Field(..., gt=0, description="The ID of the customer requesting the premium calculation")
    type_id: int = Field(..., gt=0, description="The ID of the policy type")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {"customer_id": 1, "type_id": 1}
            ]
        }
    }


class PremiumCalculateResponse(BaseModel):
    customer_id: int
    type_id: int
    type_name: str
    base_premium: float
    risk_multiplier: float
    calculated_premium: float


class RiskFactorsResponse(BaseModel):
    type_id: int
    type_name: str
    base_premium: float
    max_coverage: float
    type_multiplier: float
    description: str
