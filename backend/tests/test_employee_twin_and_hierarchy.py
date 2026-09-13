"""Test suite for Employee Digital Twin, temporal profile, and manager hierarchy."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import create_app


@pytest.fixture
def app():
    return create_app()


async def get_token(client: AsyncClient, email: str) -> str:
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "DemoPassword123!"},
    )
    assert res.status_code == 200
    return res.json()["access_token"]


@pytest.mark.asyncio
async def test_employee_listing_and_filtering(app):
    """Test employee directory listing."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        hr_token = await get_token(client, "hr@techcorp.local")
        headers = {"Authorization": f"Bearer {hr_token}"}

        res = await client.get("/api/v1/workforce/employees", headers=headers)
        assert res.status_code == 200
        employees = res.json()
        assert len(employees) >= 2

        names = [e["full_name"] for e in employees]
        assert "Marcus Chen" in names
        assert "Marcus Vance" in names


@pytest.mark.asyncio
async def test_employee_twin_projection(app):
    """Test full employee twin projection includes skills, goals, feedback, and attendance."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        hr_token = await get_token(client, "hr@techcorp.local")
        headers = {"Authorization": f"Bearer {hr_token}"}

        # 1. Fetch Marcus Chen employee ID
        res_list = await client.get("/api/v1/workforce/employees", headers=headers)
        chen = next(e for e in res_list.json() if e["work_email"] == "employee@techcorp.local")
        chen_id = chen["id"]

        # 2. Fetch Twin
        res_twin = await client.get(f"/api/v1/workforce/employees/{chen_id}/twin", headers=headers)
        assert res_twin.status_code == 200
        twin = res_twin.json()

        assert twin["employee"]["id"] == chen_id
        assert twin["employee"]["full_name"] == "Marcus Chen"
        assert twin["employee"]["current_manager"] is not None
        assert "Marcus Vance" in twin["employee"]["current_manager"]["manager_name"]

        # Check skills
        assert len(twin["skills"]) >= 1
        # Check goals
        assert len(twin["goals"]) >= 1
        # Check attendance summary
        assert len(twin["attendance_summaries"]) >= 1
        assert twin["attendance_summaries"][0]["scheduled_workdays"] >= 10


@pytest.mark.asyncio
async def test_manager_hierarchy_direct_reports(app):
    """Test manager relationship and hierarchy."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        mgr_token = await get_token(client, "manager@techcorp.local")
        headers = {"Authorization": f"Bearer {mgr_token}"}

        # Fetch employees
        res_list = await client.get("/api/v1/workforce/employees", headers=headers)
        employees = res_list.json()
        chen = next(e for e in employees if e["work_email"] == "employee@techcorp.local")
        assert chen["current_manager"] is not None
        assert "Marcus Vance" in chen["current_manager"]["manager_name"]


@pytest.mark.asyncio
async def test_candidate_forbidden_from_employee_directory(app):
    """Candidates cannot browse internal employee directories."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        cand_token = await get_token(client, "candidate@worksense.local")
        headers = {"Authorization": f"Bearer {cand_token}"}

        res = await client.get("/api/v1/workforce/employees", headers=headers)
        assert res.status_code == 403
