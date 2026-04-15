from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    """Request body for user registration."""

    name: str = Field(
        ...,
        min_length=2,
        max_length=150,
        description="Full name of the new customer",
        examples=["Jane Doe"],
    )
    email: str = Field(
        ...,
        min_length=5,
        max_length=255,
        description="User email address",
        examples=["jane.doe@email.com"],
    )
    agent_id: int | None = Field(
        None,
        description="Optional ID of the agent onboarding this customer",
    )

    model_config = {
        "json_schema_extra": {
            "examples": [{"name": "Jane Doe", "email": "jane.doe@email.com"}]
        }
    }


class LoginRequest(BaseModel):
    """Request body for email-based authentication."""

    email: str = Field(
        ...,
        min_length=5,
        max_length=255,
        description="User email address (customer, agent, or admin)",
        examples=["rahul.sharma@email.com"],
    )

    model_config = {
        "json_schema_extra": {
            "examples": [{"email": "rahul.sharma@email.com"}]
        }
    }


class LoginResponse(BaseModel):
    """User identity and role returned after successful authentication."""

    name: str = Field(..., min_length=1, description="Display name of the authenticated user")
    role: str = Field(
        ...,
        description="User role — one of 'customer', 'agent', or 'admin'",
        examples=["customer"],
    )
    user_id: int = Field(..., description="Unique user identifier in the respective table")
    customer_id: int | None = Field(
        None,
        description="Customer ID (only present when role is 'customer')",
    )
    email: str | None = Field(
        None,
        description="User email address",
    )
    kyc_status: str | None = Field(
        None,
        description="KYC verification status (only for customers)",
    )
