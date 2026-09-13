"""Health and platform readiness endpoints."""

from fastapi import APIRouter, Depends, Request
from app.core.config import Settings, get_settings
from app.schemas.health import HealthResponse
from app.services.health_service import HealthService

router = APIRouter(tags=["System Health & Diagnostics"])


def get_health_service(request: Request) -> HealthService:
    """Dependency provider for HealthService."""
    settings: Settings = getattr(request.app.state, "settings", None) or get_settings()
    return HealthService(settings=settings)


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Application Readiness Evaluation",
    description="Evaluates connectivity to database, storage, local Qwen gateway, and EnterPro orchestrator.",
)
async def check_readiness(
    request: Request,
    health_service: HealthService = Depends(get_health_service),
) -> HealthResponse:
    """Check platform readiness and subsystem status."""
    request_id = getattr(request.state, "request_id", None)
    return await health_service.get_readiness(request_id=request_id)


@router.get(
    "/readiness",
    response_model=HealthResponse,
    summary="Readiness Probe Alias",
    description="Alias for Kubernetes/Render container readiness probes.",
)
async def check_readiness_alias(
    request: Request,
    health_service: HealthService = Depends(get_health_service),
) -> HealthResponse:
    """Readiness probe alias."""
    request_id = getattr(request.state, "request_id", None)
    return await health_service.get_readiness(request_id=request_id)


@router.get(
    "/version",
    summary="Application Version & Deployment Metadata",
    description="Returns backend semantic version, commit hash, schema version, and runtime modes.",
)
def get_version():
    """Version metadata endpoint."""
    return {
        "app_name": "WorkSense HR Intelligence Platform",
        "app_version": "1.0.0",
        "git_commit": "8b353cd",
        "schema_version": "20260913000001",
        "environment": "production",
        "qwen_gateway_mode": "local_with_deterministic_fallback",
        "enterpro_orchestrator": "governed_execution_simulated",
    }
