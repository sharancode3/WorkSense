"""Tests for health endpoints, middleware, correlation IDs, and error formatting."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import Settings
from app.main import create_app


@pytest.fixture
def test_settings():
    """Isolated test settings."""
    return Settings(
        app_name="WorkSense Test API",
        app_env="test",
        app_version="1.0.0-test",
        cors_origins=["http://localhost:3000", "http://example.com"],
        supabase_url=None,
        supabase_anon_key=None,
        qwen_gateway_url=None,
        enterpro_api_url=None,
    )


@pytest.fixture
def test_app(test_settings):
    """Create test application instance."""
    return create_app(settings=test_settings)


@pytest.mark.asyncio
async def test_process_liveness(test_app):
    """GET /health must return HTTP 200 with healthy status and timestamp."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert data["version"] == "1.0.0-test"


@pytest.mark.asyncio
async def test_application_readiness_unconfigured(test_app):
    """GET /api/v1/health must report honest 'not configured' state for absent dependencies."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/api/v1/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["environment"] == "test"
        assert data["version"] == "1.0.0-test"

        # Verify component status honesty
        components = data["components"]
        assert components["database"]["status"] == "not configured"
        assert "Stage 2" in components["database"]["detail"]
        assert components["storage"]["status"] == "not configured"
        assert components["qwen_ai_gateway"]["status"] == "not configured"
        assert components["enterpro_orchestrator"]["status"] == "not configured"

        # Request ID must be present
        assert "request_id" in data
        assert data["request_id"] is not None


@pytest.mark.asyncio
async def test_readiness_alias(test_app):
    """GET /api/v1/readiness must return identical contract to /api/v1/health."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/api/v1/readiness")
        assert response.status_code == 200
        data = response.json()
        assert "components" in data


@pytest.mark.asyncio
async def test_correlation_id_propagation(test_app):
    """Correlation ID passed in header must be propagated into response headers and body."""
    custom_corr_id = "test-correlation-uuid-12345"
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get(
            "/api/v1/health",
            headers={"X-Correlation-ID": custom_corr_id},
        )

        assert response.status_code == 200
        assert response.headers.get("X-Correlation-ID") == custom_corr_id
        assert response.headers.get("X-Request-ID") == custom_corr_id
        data = response.json()
        assert data["request_id"] == custom_corr_id


@pytest.mark.asyncio
async def test_generated_correlation_id(test_app):
    """When no correlation ID is sent, the server generates a UUID and sets response headers."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/health")

        assert response.status_code == 200
        assert "X-Correlation-ID" in response.headers
        assert len(response.headers["X-Correlation-ID"]) > 10


@pytest.mark.asyncio
async def test_standard_not_found_error_envelope(test_app):
    """Accessing an invalid endpoint must return standard error envelope with request_id."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/api/v1/nonexistent-route")

        assert response.status_code == 404
        data = response.json()
        assert "error" in data
        err = data["error"]
        assert err["code"] == "NOT_FOUND"
        assert "message" in err
        assert "request_id" in err
        assert len(err["request_id"]) > 0


@pytest.mark.asyncio
async def test_cors_preflight(test_app):
    """CORS preflight request must allow configured origins."""
    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.options(
            "/api/v1/health",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "X-Correlation-ID",
            },
        )
        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"
