"""Pydantic schemas for process liveness and component readiness endpoints."""

from typing import Literal, Optional
from pydantic import BaseModel, Field

HealthStatusType = Literal["healthy", "degraded", "unavailable", "not configured"]


class ComponentHealth(BaseModel):
    """Health and connectivity evaluation for a specific subsystem dependency."""

    status: HealthStatusType = Field(..., description="Operational status of this dependency")
    latency_ms: Optional[float] = Field(default=None, description="Round-trip probe latency in milliseconds")
    detail: Optional[str] = Field(default=None, description="Diagnostic notice or error detail")


class HealthComponents(BaseModel):
    """Subsystem dependencies monitored by the WorkSense platform."""

    database: ComponentHealth = Field(..., description="Supabase PostgreSQL database connectivity")
    storage: ComponentHealth = Field(..., description="Supabase object storage connectivity")
    qwen_ai_gateway: ComponentHealth = Field(..., description="Local Qwen3-4B AI Gateway tunnel connectivity")
    enterpro_orchestrator: ComponentHealth = Field(..., description="EnterPro enterprise workflow orchestrator connectivity")


class HealthResponse(BaseModel):
    """Application readiness evaluation report."""

    status: Literal["healthy", "degraded", "unavailable"] = Field(..., description="Overall platform operational status")
    timestamp: str = Field(..., description="ISO-8601 UTC timestamp of check evaluation")
    environment: str = Field(..., description="Runtime environment: development, test, demo, production")
    version: str = Field(..., description="Application semantic version")
    components: HealthComponents = Field(..., description="Component-level health evaluations")
    request_id: Optional[str] = Field(default=None, description="Correlation identifier")


class LivenessResponse(BaseModel):
    """FastAPI process liveness check response."""

    status: Literal["healthy"] = Field(default="healthy", description="Process is alive and responding to requests")
    timestamp: str = Field(..., description="ISO-8601 UTC timestamp")
    version: str = Field(..., description="Application version")
