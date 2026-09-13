"""Role-based authorization and permission enforcement test suite."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import create_app


@pytest.fixture
def app():
    return create_app()


async def get_token_for(client: AsyncClient, email: str) -> str:
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "DemoPassword123!"},
    )
    assert res.status_code == 200
    return res.json()["access_token"]


@pytest.mark.asyncio
async def test_candidate_cannot_access_internal_endpoints(app):
    """Candidate token accessing admin endpoints receives 403 Forbidden."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        token = await get_token_for(client, "candidate@worksense.local")
        headers = {"Authorization": f"Bearer {token}"}

        res = await client.get("/api/v1/admin/members", headers=headers)
        assert res.status_code == 403
        assert res.json()["error"]["code"] == "FORBIDDEN"


@pytest.mark.asyncio
async def test_employee_cannot_access_admin_endpoints(app):
    """Regular employee accessing admin endpoints receives 403 Forbidden."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        token = await get_token_for(client, "employee@techcorp.local")
        headers = {"Authorization": f"Bearer {token}"}

        res = await client.get("/api/v1/admin/members", headers=headers)
        assert res.status_code == 403
        assert res.json()["error"]["code"] == "FORBIDDEN"


@pytest.mark.asyncio
async def test_manager_cannot_access_admin_endpoints(app):
    """Team manager accessing admin endpoints receives 403 Forbidden."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        token = await get_token_for(client, "manager@techcorp.local")
        headers = {"Authorization": f"Bearer {token}"}

        res = await client.get("/api/v1/admin/members", headers=headers)
        assert res.status_code == 403
        assert res.json()["error"]["code"] == "FORBIDDEN"


@pytest.mark.asyncio
async def test_recruiter_cannot_access_admin_endpoints(app):
    """Recruiter accessing admin endpoints receives 403 Forbidden."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        token = await get_token_for(client, "recruiter@techcorp.local")
        headers = {"Authorization": f"Bearer {token}"}

        res = await client.get("/api/v1/admin/members", headers=headers)
        assert res.status_code == 403
        assert res.json()["error"]["code"] == "FORBIDDEN"


@pytest.mark.asyncio
async def test_administrator_can_access_admin_endpoints(app):
    """Administrator accessing admin member list receives 200 OK."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        token = await get_token_for(client, "admin@techcorp.local")
        headers = {"Authorization": f"Bearer {token}"}

        res = await client.get("/api/v1/admin/members", headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert "members" in data
        assert len(data["members"]) > 0
