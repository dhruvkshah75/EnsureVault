from pydantic import BaseModel
from typing import Any, List, Optional


class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None


class PaginatedResponse(BaseModel):
    success: bool
    message: str
    data: List[Any]
    total: int
    page: int
    per_page: int


class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    detail: Optional[str] = None
