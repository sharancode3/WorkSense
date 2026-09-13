"""Test suite for Stage 5: Multi-Brain Scheduling, Dependency Precedence, and Plan Quality Critic."""

from datetime import datetime
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import create_app


@pytest.fixture
def app():
    """Create test application instance."""
    return create_app()


async def get_token(client: AsyncClient, email: str = "hr@techcorp.local") -> str:
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "DemoPassword123!"},
    )
    assert res.status_code == 200
    return res.json()["access_token"]


@pytest.mark.asyncio
async def test_dependency_precedence_and_topological_dates(app):
    """Verify deterministic scheduler enforces that dependent tasks are scheduled on or after prerequisites."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_token(client, "hr@techcorp.local")
        headers = {"Authorization": f"Bearer {token}"}

        cand_id = "30000000-0000-0000-0000-000000000001"
        job_id = "40000000-0000-0000-0000-000000000001"
        dept_id = "60000000-0000-0000-0000-000000000002"
        role_id = "61000000-0000-0000-0000-000000000002"
        mgr_id = "69000000-0000-0000-0000-000000000001"

        payload = {
            "candidate_id": cand_id,
            "job_opening_id": job_id,
            "department_id": dept_id,
            "job_role_id": role_id,
            "employee_code": "EMP-90089",
            "hire_date": "2026-11-01",
            "manager_employee_id": mgr_id,
            "work_location": "Remote",
            "employment_type": "full_time",
        }

        res = await client.post("/api/v1/onboarding/cases", json=payload, headers=headers)
        assert res.status_code in (200, 201)
        case = res.json()
        plan = case["active_plan"]
        tasks = {t["task_code"]: t for t in plan["tasks"]}

        # 1. Preboarding hardware receipt precedes Dev Environment Setup
        if "TASK_EQUIPMENT_RECEIPT" in tasks and "TASK_ENV_SETUP" in tasks:
            equip_date = datetime.strptime(tasks["TASK_EQUIPMENT_RECEIPT"]["due_date"], "%Y-%m-%d")
            env_date = datetime.strptime(tasks["TASK_ENV_SETUP"]["due_date"], "%Y-%m-%d")
            assert equip_date <= env_date

        # 2. Security Awareness precedes First Production PR
        if "TASK_SECURITY_AWARENESS" in tasks and "TASK_FIRST_COMMIT" in tasks:
            sec_date = datetime.strptime(tasks["TASK_SECURITY_AWARENESS"]["due_date"], "%Y-%m-%d")
            commit_date = datetime.strptime(tasks["TASK_FIRST_COMMIT"]["due_date"], "%Y-%m-%d")
            assert sec_date <= commit_date

        # 3. Preboarding tasks must have day offset < 0
        preboarding_tasks = [t for t in plan["tasks"] if t["phase"] == "preboarding"]
        for pt in preboarding_tasks:
            assert pt["scheduled_day_offset"] < 0


@pytest.mark.asyncio
async def test_plan_critic_review_audit_checks(app):
    """Verify Plan Quality Critic performs deterministic sanity checks on policy retention and workload."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_token(client, "hr@techcorp.local")
        headers = {"Authorization": f"Bearer {token}"}

        res_cases = await client.get("/api/v1/onboarding/cases", headers=headers)
        assert res_cases.status_code == 200
        cases = res_cases.json()["cases"]
        if not cases:
            payload = {
                "candidate_id": "30000000-0000-0000-0000-000000000001",
                "job_opening_id": "40000000-0000-0000-0000-000000000001",
                "department_id": "60000000-0000-0000-0000-000000000002",
                "job_role_id": "61000000-0000-0000-0000-000000000002",
                "employee_code": "EMP-90089",
                "hire_date": "2026-11-01",
                "manager_employee_id": "69000000-0000-0000-0000-000000000001",
                "work_location": "Remote",
                "employment_type": "full_time",
            }
            res_c = await client.post("/api/v1/onboarding/cases", json=payload, headers=headers)
            case = res_c.json()
        else:
            case = cases[0]

        plan = case["active_plan"]
        assert "critic_review" in plan
        critic = plan["critic_review"]

        assert "rule_checks" in critic
        assert critic["rule_checks"]["mandatory_tasks_retained"] is True
        assert critic["rule_checks"]["preboarding_prior_to_day_1"] is True
        assert critic["workload_pacing_score"] > 0.0
        assert critic["policy_compliance"] is True


@pytest.mark.asyncio
async def test_unauthorized_candidate_cannot_create_or_review_cases(app):
    """Candidate or unauthorized persona is rejected with 403 when attempting administrative actions."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_token(client, "candidate@worksense.local")
        headers = {"Authorization": f"Bearer {token}"}

        # Attempt to create case as candidate
        payload = {
            "candidate_id": "30000000-0000-0000-0000-000000000001",
            "job_opening_id": "40000000-0000-0000-0000-000000000001",
            "department_id": "60000000-0000-0000-0000-000000000002",
            "job_role_id": "61000000-0000-0000-0000-000000000002",
            "employee_code": "HACK-001",
            "hire_date": "2026-10-01",
        }
        res_create = await client.post("/api/v1/onboarding/cases", json=payload, headers=headers)
        assert res_create.status_code == 403
