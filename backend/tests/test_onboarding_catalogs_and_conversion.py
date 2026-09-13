"""Test suite for Stage 5: Onboarding Catalogs, Skill Gaps, and Candidate Conversion."""

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
async def test_catalogs_and_templates_listing(app):
    """Verify standard task definitions, templates, and learning catalog are discoverable."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_token(client, "hr@techcorp.local")
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Task Definitions
        res_tasks = await client.get("/api/v1/onboarding/catalogs/tasks", headers=headers)
        assert res_tasks.status_code == 200
        tasks = res_tasks.json()
        assert len(tasks) >= 10
        codes = [t["code"] for t in tasks]
        assert "TASK_PREBOARD_DOCS" in codes
        assert "TASK_SECURITY_AWARENESS" in codes
        assert "TASK_FIRST_COMMIT" in codes

        # 2. Templates
        res_tpls = await client.get("/api/v1/onboarding/catalogs/templates", headers=headers)
        assert res_tpls.status_code == 200
        tpls = res_tpls.json()
        assert len(tpls) >= 2
        tpl_names = [t["name"] for t in tpls]
        assert any("Organization-Wide" in n for n in tpl_names)
        assert any("Engineering Department" in n for n in tpl_names)

        # 3. Learning Resources
        res_learn = await client.get("/api/v1/onboarding/catalogs/learning-resources", headers=headers)
        assert res_learn.status_code == 200
        learn_items = res_learn.json()
        assert len(learn_items) >= 4
        assert any("Raft" in r["title"] or "Kubernetes" in r["title"] or "Concurrency" in r["title"] for r in learn_items)


@pytest.mark.asyncio
async def test_skill_gap_analysis_and_preview(app):
    """Verify deterministic skill gap analyzer compares candidate against job opening requirements."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_token(client, "hr@techcorp.local")
        headers = {"Authorization": f"Bearer {token}"}

        cand_id = "30000000-0000-0000-0000-000000000001"  # Elena Rostova
        job_id = "40000000-0000-0000-0000-000000000001"   # Lead Distributed Systems Engineer

        # Ensure candidate has an active offer decision
        await client.post(
            f"/api/v1/recruitment/jobs/{job_id}/candidates/{cand_id}/decision",
            json={"decision": "offer", "rationale": "Approved for hire.", "is_override": False, "candidate_facing_status": "Offer Extended"},
            headers=headers,
        )

        # 1. Direct Skill Gap Analyzer
        res_gaps = await client.get(
            f"/api/v1/onboarding/skill-gaps?candidate_id={cand_id}&job_opening_id={job_id}",
            headers=headers,
        )
        assert res_gaps.status_code == 200
        gap_data = res_gaps.json()
        assert gap_data["required_skills_count"] >= 1
        assert "summary" in gap_data

        # 2. Onboarding Case Preview
        res_prev = await client.get(
            f"/api/v1/onboarding/cases/preview?candidate_id={cand_id}&job_opening_id={job_id}",
            headers=headers,
        )
        assert res_prev.status_code == 200
        prev_data = res_prev.json()
        assert prev_data["candidate_id"] == cand_id
        assert prev_data["candidate_name"] == "Elena Rostova"
        assert prev_data["is_eligible"] is True
        assert prev_data["mandatory_task_count"] >= 7


@pytest.mark.asyncio
async def test_create_onboarding_case_and_conversion_idempotency(app):
    """Verify candidate conversion creates Employee Twin and generates scheduled Plan v1."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_token(client, "hr@techcorp.local")
        headers = {"Authorization": f"Bearer {token}"}

        cand_id = "30000000-0000-0000-0000-000000000001"  # Elena Rostova
        job_id = "40000000-0000-0000-0000-000000000001"   # Lead Distributed Systems Engineer
        dept_id = "60000000-0000-0000-0000-000000000002"  # Engineering
        role_id = "61000000-0000-0000-0000-000000000002"  # Senior Infra / Systems Role
        mgr_id = "69000000-0000-0000-0000-000000000001"   # Marcus Vance

        payload = {
            "candidate_id": cand_id,
            "job_opening_id": job_id,
            "department_id": dept_id,
            "job_role_id": role_id,
            "employee_code": "EMP-90088",
            "hire_date": "2026-10-15",
            "manager_employee_id": mgr_id,
            "work_location": "San Francisco, CA (Remote)",
            "employment_type": "full_time",
        }

        # Create onboarding case
        res_create = await client.post("/api/v1/onboarding/cases", json=payload, headers=headers)
        assert res_create.status_code == 201
        case_data = res_create.json()

        assert case_data["candidate_id"] == cand_id
        assert case_data["employee_code"] == "EMP-90088"
        assert case_data["status"] == "in_review"
        assert case_data["active_plan"] is not None
        plan = case_data["active_plan"]
        assert plan["version_number"] == 1
        assert plan["status"] == "hr_review"
        assert len(plan["tasks"]) >= 10

        # Verify idempotency: repeated request returns existing case
        res_idem = await client.post("/api/v1/onboarding/cases", json=payload, headers=headers)
        assert res_idem.status_code == 201 or res_idem.status_code == 200
        assert res_idem.json()["id"] == case_data["id"]
