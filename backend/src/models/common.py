from pydantic import BaseModel, Field
from typing import Any, List, Optional


class APIResponse(BaseModel):
    """Standard envelope returned by every endpoint."""

    success: bool = Field(..., description="Whether the request completed successfully")
    message: str = Field(..., description="Human-readable status message")
    data: Optional[Any] = Field(None, description="Payload — shape varies per endpoint")


class PaginatedResponse(BaseModel):
    """Paginated list envelope."""

    success: bool = Field(..., description="Whether the request completed successfully")
    message: str = Field(..., description="Human-readable status message")
    data: List[Any] = Field(..., description="List of items for the current page")
    total: int = Field(..., ge=0, description="Total number of items across all pages")
    page: int = Field(..., ge=1, description="Current page number (1-indexed)")
    per_page: int = Field(..., ge=1, description="Number of items per page")


class ErrorResponse(BaseModel):
    """Shape of all 4XX / 5XX error bodies."""

    success: bool = Field(False, description="Always false for errors")
    message: str = Field(..., description="Short error summary")
    detail: Optional[str] = Field(None, description="Extended diagnostic info (may be null)")
