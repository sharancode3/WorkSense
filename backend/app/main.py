"""WorkSense FastAPI Application Entrypoint."""

from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_v1_router
from app.core.config import Settings, get_settings
from app.core.errors import register_error_handlers
from app.core.logging import setup_logging
from app.core.middleware import CorrelationIdMiddleware
from app.schemas.health import LivenessResponse


def create_app(settings: Settings | None = None) -> FastAPI:
    """Application factory for WorkSense backend."""
    if settings is None:
        settings = get_settings()

    # Initialize structured logging
    setup_logging(
        log_level=settings.log_level,
        service="worksense-api",
        environment=settings.app_env,
    )

    # Instantiate FastAPI
    app = FastAPI(
        title="WorkSense API",
        description="Evidence-first workforce decision intelligence and action platform API.",
        version=settings.app_version,
        docs_url="/docs" if settings.app_env != "production" else None,
        redoc_url="/redoc" if settings.app_env != "production" else None,
        openapi_url="/openapi.json" if settings.app_env != "production" else None,
    )

    # Attach settings to app state for dependency resolution
    app.state.settings = settings

    # Register correlation ID middleware
    app.add_middleware(CorrelationIdMiddleware)

    # Register CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Correlation-ID", "X-Request-ID"],
    )

    # Register custom error handlers
    register_error_handlers(app, debug=settings.debug)

    # Root process liveness check (for container orchestrators)
    @app.get(
        "/health",
        response_model=LivenessResponse,
        tags=["System Health & Diagnostics"],
        summary="Process Liveness Probe",
        description="Fast HTTP 200 process liveness check for Render and Docker health checks.",
    )
    async def process_liveness() -> LivenessResponse:
        return LivenessResponse(
            status="healthy",
            timestamp=datetime.now(timezone.utc).isoformat(),
            version=settings.app_version,
        )

    # Mount versioned API routes
    app.include_router(api_v1_router, prefix="/api/v1")

    return app


# Default application instance for Uvicorn
app = create_app()
