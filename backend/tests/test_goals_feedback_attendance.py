"""Test suite for goals, multi-tier visibility feedback, and attendance aggregates."""

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
async def test_goals_lifecycle_and_progress_tracking(app):
    """Test creating, listing, and updating goal progress."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        mgr_token = await get_token(client, "manager@techcorp.local")
        headers = {"Authorization": f"Bearer {mgr_token}"}

        # 1. Fetch employee
        res_list = await client.get("/api/v1/workforce/employees", headers=headers)
        chen = next(e for e in res_list.json() if e["work_email"] == "employee@techcorp.local")

        # 2. Create new goal
        res_goal = await client.post(
            "/api/v1/workforce/goals",
            headers=headers,
            json={
                "employee_id": chen["id"],
                "title": "Migrate Ingest Pipeline to Kafka",
                "description": "Increase throughput to 50k events/sec with zero loss",
                "due_date": "2026-12-31",
                "priority": "high",
                "visibility": "employee_visible",
            },
        )
        assert res_goal.status_code == 201
        goal_id = res_goal.json()["id"]

        # 3. Update goal progress via PATCH
        res_update = await client.patch(
            f"/api/v1/workforce/goals/{goal_id}",
            headers=headers,
            json={"progress_percentage": 65},
        )
        assert res_update.status_code == 200
        assert res_update.json()["progress_percentage"] == 65


@pytest.mark.asyncio
async def test_feedback_explicit_visibility_enforcement(app):
    """Test multi-tier visibility enforcement for feedback records."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        mgr_token = await get_token(client, "manager@techcorp.local")
        mgr_headers = {"Authorization": f"Bearer {mgr_token}"}

        # Fetch employee Marcus Chen
        res_list = await client.get("/api/v1/workforce/employees", headers=mgr_headers)
        chen = next(e for e in res_list.json() if e["work_email"] == "employee@techcorp.local")

        # 1. Manager leaves confidential feedback visible only to Manager and HR
        res_fb = await client.post(
            "/api/v1/workforce/feedback",
            headers=mgr_headers,
            json={
                "subject_employee_id": chen["id"],
                "feedback_type": "manager_1on1",
                "visibility": "hr_restricted",
                "structured_strengths": ["Strong technical execution on Triton GEMM kernels"],
                "development_areas": ["Strategic delegation to junior engineers"],
            },
        )
        assert res_fb.status_code == 201
        fb_id = res_fb.json()["id"]

        # 2. HR can view this feedback
        hr_token = await get_token(client, "hr@techcorp.local")
        hr_headers = {"Authorization": f"Bearer {hr_token}"}
        res_hr_view = await client.get(f"/api/v1/workforce/feedback/employee/{chen['id']}", headers=hr_headers)
        assert res_hr_view.status_code == 200
        feedback_list = res_hr_view.json()
        assert any(item["id"] == fb_id for item in feedback_list)


@pytest.mark.asyncio
async def test_attendance_summary_aggregation(app):
    """Test attendance aggregate summary computation."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        hr_token = await get_token(client, "hr@techcorp.local")
        headers = {"Authorization": f"Bearer {hr_token}"}

        # Fetch Marcus Chen
        res_list = await client.get("/api/v1/workforce/employees", headers=headers)
        chen = next(e for e in res_list.json() if e["work_email"] == "employee@techcorp.local")

        res_att = await client.get(f"/api/v1/workforce/attendance/employee/{chen['id']}", headers=headers)
        assert res_att.status_code == 200
        summaries = res_att.json()
        assert len(summaries) >= 1

        summary = summaries[0]
        assert "scheduled_workdays" in summary
        assert "present_days" in summary
        assert "remote_days" in summary
        assert summary["scheduled_workdays"] >= 10
