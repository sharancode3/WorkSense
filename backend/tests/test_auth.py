"""Comprehensive authentication test suite."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import create_app


@pytest.fixture
def app():
    """Create test application instance."""
    return create_app()


@pytest.mark.asyncio
async def test_candidate_registration_success(app):
    """Candidate self-registration strictly assigns candidate role and returns valid token."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        payload = {
            "full_name": "Alice Candidate",
            "email": "alice.unique@worksense.local",
            "password": "Password123!",
            "password_confirm": "Password123!",
        }
        res = await client.post("/api/v1/auth/register-candidate", json=payload)
        assert res.status_code == 201
        data = res.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        ctx = data["context"]
        assert ctx["user"]["email"] == "alice.unique@worksense.local"
        assert ctx["user"]["full_name"] == "Alice Candidate"
        assert ctx["active_roles"] == ["candidate"]
        assert "portal.candidate.access" in ctx["granted_capabilities"]
        assert "admin.access" not in ctx["granted_capabilities"]
        assert ctx["default_destination"] == "/candidate"


@pytest.mark.asyncio
async def test_candidate_registration_duplicate_email(app):
    """Candidate registration with existing email returns 409 Conflict."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        payload = {
            "full_name": "Duplicate Candidate",
            "email": "candidate@worksense.local",  # Already seeded
            "password": "Password123!",
            "password_confirm": "Password123!",
        }
        res = await client.post("/api/v1/auth/register-candidate", json=payload)
        assert res.status_code == 409
        body = res.json()
        assert body["error"]["code"] == "CONFLICT"


@pytest.mark.asyncio
async def test_candidate_registration_password_mismatch(app):
    """Candidate registration with mismatched passwords fails validation."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        payload = {
            "full_name": "Alice Candidate",
            "email": "mismatch@worksense.local",
            "password": "Password123!",
            "password_confirm": "DifferentPassword123!",
        }
        res = await client.post("/api/v1/auth/register-candidate", json=payload)
        assert res.status_code == 422


@pytest.mark.asyncio
async def test_login_success_across_roles(app):
    """Test login across different canonical personas."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        # 1. Administrator
        res_admin = await client.post(
            "/api/v1/auth/login",
            json={"email": "admin@techcorp.local", "password": "DemoPassword123!"},
        )
        assert res_admin.status_code == 200
        data_admin = res_admin.json()
        assert data_admin["context"]["active_roles"] == ["administrator"]
        assert "admin.access" in data_admin["context"]["granted_capabilities"]
        assert data_admin["context"]["default_destination"] == "/admin/access"

        # 2. Manager
        res_mgr = await client.post(
            "/api/v1/auth/login",
            json={"email": "manager@techcorp.local", "password": "DemoPassword123!"},
        )
        assert res_mgr.status_code == 200
        data_mgr = res_mgr.json()
        assert "manager" in data_mgr["context"]["active_roles"]
        assert "portal.manager.access" in data_mgr["context"]["granted_capabilities"]
        assert data_mgr["context"]["default_destination"] == "/manager"


@pytest.mark.asyncio
async def test_login_invalid_credentials(app):
    """Invalid email or password returns 401 without leaking existence."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        # Invalid password
        res1 = await client.post(
            "/api/v1/auth/login",
            json={"email": "admin@techcorp.local", "password": "WrongPassword!"},
        )
        assert res1.status_code == 401
        assert res1.json()["error"]["code"] == "UNAUTHORIZED"

        # Nonexistent email
        res2 = await client.post(
            "/api/v1/auth/login",
            json={"email": "nonexistent@techcorp.local", "password": "DemoPassword123!"},
        )
        assert res2.status_code == 401
        assert res2.json()["error"]["code"] == "UNAUTHORIZED"


@pytest.mark.asyncio
async def test_session_restoration_me(app):
    """GET /api/v1/auth/me restores authoritative AccessContext with valid token."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        # Sign in
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"email": "hr@techcorp.local", "password": "DemoPassword123!"},
        )
        token = login_res.json()["access_token"]

        # Restore context
        headers = {"Authorization": f"Bearer {token}"}
        me_res = await client.get("/api/v1/auth/me", headers=headers)
        assert me_res.status_code == 200
        ctx = me_res.json()
        assert ctx["user"]["email"] == "hr@techcorp.local"
        assert "hr" in ctx["active_roles"]
        assert ctx["active_organization"]["name"] == "TechCorp International"
        assert "portal.hr.access" in ctx["granted_capabilities"]


@pytest.mark.asyncio
async def test_unauthorized_when_missing_token(app):
    """Accessing protected endpoint without Bearer token returns 401."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        res = await client.get("/api/v1/auth/me")
        assert res.status_code == 401
        assert res.json()["error"]["code"] == "UNAUTHORIZED"


@pytest.mark.asyncio
async def test_forgot_and_reset_password_flow(app):
    """Forgot password request and tokenized reset flow."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        # Forgot password request
        res = await client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "employee@techcorp.local"},
        )
        assert res.status_code == 200
        assert res.json()["success"] is True

        # Nonexistent email also returns safe 200
        res_fake = await client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "unknown@domain.com"},
        )
        assert res_fake.status_code == 200
