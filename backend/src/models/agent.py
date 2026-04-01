from decimal import Decimal
from pydantic import BaseModel, Field

class AgentCreate(BaseModel):
    """Request body for creating a new agent."""
    name: str = Field(..., min_length=2, max_length=100, description="Full name of the agent")
    region: str = Field(..., min_length=2, max_length=100, description="Region the agent operates in")
    commission_rate: Decimal = Field(default=Decimal("0.00"), ge=0, le=100, description="Agent's commission percentage")


class AgentResponse(BaseModel):
    """Response body for agent details."""
    agent_id: int
    name: str
    region: str
    commission_rate: Decimal
    total_commission_earned: Decimal = Decimal("0.00")
