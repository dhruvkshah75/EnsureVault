from typing import List

from pydantic import BaseModel, Field


class AdminKPIs(BaseModel):
    """Aggregate metrics for the Admin dashboard."""

    total_revenue: float = Field(..., description="Sum of all successful payments")
    active_policies: int = Field(..., description="Count of policies currently 'Active'")
    total_payouts: float = Field(..., description="Sum of all approved claims")
    approved_claims_count: int = Field(..., description="Number of approved claims")
    rejected_claims_count: int = Field(..., description="Number of rejected claims")
    reserve_balance: float = Field(..., description="Current company reserve funds")


class LeaderboardEntry(BaseModel):
    """Ranked agent performance record."""

    agent_id: int
    agent_name: str
    region: str
    total_policies_sold: int
    total_premium_value: float
    total_commission_earned: float


class AdminDashboardResponse(BaseModel):
    """Combined response for the Admin landing page."""

    kpis: AdminKPIs
    leaderboard: List[LeaderboardEntry]
