from pydantic import BaseModel
from typing import Any, List, Optional, Generic, TypeVar

T = TypeVar("T")

class APIResponse(BaseModel, Generic[T]):
    success: bool
    message: str
    data: Optional[T] = None


class PaginatedResponse(BaseModel, Generic[T]):
    success: bool
    message: str
    data: List[T]
    total: int
    page: int
    per_page: int


class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    detail: Optional[str] = None
