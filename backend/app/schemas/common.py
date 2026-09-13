"""Common schema models and error contracts."""

from typing import Any, Dict
from pydantic import BaseModel, Field


class ErrorPayload(BaseModel):
    """Standard WorkSense error details."""

    code: str = Field(..., description="Machine-readable error classification code", examples=["VALIDATION_ERROR", "NOT_FOUND"])
    message: str = Field(..., description="Safe, human-readable description of what went wrong")
    details: Dict[str, Any] = Field(default_factory=dict, description="Structured contextual error data")
    request_id: str = Field(..., description="Unique correlation identifier for tracing logs")


class ErrorResponse(BaseModel):
    """Standard envelope for all error responses."""

    error: ErrorPayload
