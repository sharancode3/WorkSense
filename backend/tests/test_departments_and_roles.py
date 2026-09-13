"""Test suite for departments hierarchy and job role catalog."""

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
async def test_departments_listing_and_hierarchy(app):
    """Test listing departments preserves tree structure and seeded departments."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        token = await get_token(client, "admin@techcorp.local")
        headers = {"Authorization": f"Bearer {token}"}

        res = await client.get("/api/v1/workforce/departments", headers=headers)
        assert res.status_code == 200
        departments = res.json()
        assert len(departments) >= 4

        dept_codes = [d["code"] for d in departments]
        assert "ENG" in dept_codes
        assert "ENG-INFRA" in dept_codes
        assert "ENG-AI" in dept_codes
        assert "PEOPLE" in dept_codes


@pytest.mark.asyncio
async def test_department_creation_and_cycle_prevention(app):
    """Test creating departments and verifying cycle detection."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        token = await get_token(client, "admin@techcorp.local")
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Create a parent department
        res_parent = await client.post(
            "/api/v1/workforce/departments",
            headers=headers,
            json={
                "name": "Cloud Operations",
                "code": "CLOUD_OPS",
                "description": "Infrastructure and Cloud Platform",
            },
        )
        assert res_parent.status_code == 201
        parent_id = res_parent.json()["id"]

        # 2. Create child department
        res_child = await client.post(
            "/api/v1/workforce/departments",
            headers=headers,
            json={
                "name": "Site Reliability",
                "code": "SRE_TEAM",
                "parent_department_id": parent_id,
            },
        )
        assert res_child.status_code == 201
        child_id = res_child.json()["id"]

        # 3. Attempting to update parent to make child its parent (cycle) should be rejected
        res_cycle = await client.patch(
            f"/api/v1/workforce/departments/{parent_id}",
            headers=headers,
            json={"parent_department_id": child_id},
        )
        assert res_cycle.status_code in (400, 422)


@pytest.mark.asyncio
async def test_job_roles_catalog_and_skill_requirements(app):
    """Test job roles catalog retrieval and required skills mapping."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        token = await get_token(client, "hr@techcorp.local")
        headers = {"Authorization": f"Bearer {token}"}

        res = await client.get("/api/v1/workforce/job-roles", headers=headers)
        assert res.status_code == 200
        roles = res.json()
        assert len(roles) >= 4

        # Verify Senior Distributed Systems Engineer exists
        dist_role = next((r for r in roles if r["code"] == "ROLE-DIST-SR"), None)
        assert dist_role is not None
        assert dist_role["department_id"] is not None

        # Fetch detail by ID with skill requirements
        res_detail = await client.get(f"/api/v1/workforce/job-roles/{dist_role['id']}", headers=headers)
        assert res_detail.status_code == 200
        detail = res_detail.json()
        assert "required_skills" in detail
        assert len(detail["required_skills"]) >= 1


@pytest.mark.asyncio
async def test_candidate_forbidden_from_modifying_departments(app):
    """Candidate should not be authorized to create departments."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        token = await get_token(client, "candidate@worksense.local")
        headers = {"Authorization": f"Bearer {token}"}

        res = await client.post(
            "/api/v1/workforce/departments",
            headers=headers,
            json={"name": "Hacker Dept", "code": "HACK"},
        )
        assert res.status_code == 403
