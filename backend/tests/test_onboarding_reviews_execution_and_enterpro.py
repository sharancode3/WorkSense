"""Test suite for Stage 5: Reviews, Manager Tasks, Task Execution, Blockers, EnterPro, and Replanning."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import create_app


@pytest.fixture
def app():
    """Create test application instance."""
    return create_app()


async def get_token(client: AsyncClient, email: str) -> str:
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "DemoPassword123!"},
    )
    assert res.status_code == 200
    return res.json()["access_token"]


async def ensure_case(client: AsyncClient, token: str) -> dict:
    res_cases = await client.get("/api/v1/onboarding/cases", headers={"Authorization": f"Bearer {token}"})
    if res_cases.status_code == 200 and len(res_cases.json()["cases"]) > 0:
        return res_cases.json()["cases"][0]

    payload = {
        "candidate_id": "30000000-0000-0000-0000-000000000001",
        "job_opening_id": "40000000-0000-0000-0000-000000000001",
        "department_id": "60000000-0000-0000-0000-000000000002",
        "job_role_id": "61000000-0000-0000-0000-000000000002",
        "employee_code": "EMP-90090",
        "hire_date": "2026-10-20",
        "manager_employee_id": "69000000-0000-0000-0000-000000000001",
        "work_location": "Remote",
        "employment_type": "full_time",
    }
    res_case = await client.post("/api/v1/onboarding/cases", json=payload, headers={"Authorization": f"Bearer {token}"})
    return res_case.json()


@pytest.mark.asyncio
async def test_dual_human_review_and_manager_task_addition(app):
    """Verify HR and Manager review gates, and custom milestone addition by manager."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        hr_token = await get_token(client, "hr@techcorp.local")
        mgr_token = await get_token(client, "manager@techcorp.local")

        # 1. Create onboarding case
        payload = {
            "candidate_id": "30000000-0000-0000-0000-000000000001",
            "job_opening_id": "40000000-0000-0000-0000-000000000001",
            "department_id": "60000000-0000-0000-0000-000000000002",
            "job_role_id": "61000000-0000-0000-0000-000000000002",
            "employee_code": "EMP-90090",
            "hire_date": "2026-10-20",
            "manager_employee_id": "69000000-0000-0000-0000-000000000001",
            "work_location": "Remote",
            "employment_type": "full_time",
        }
        res_case = await client.post("/api/v1/onboarding/cases", json=payload, headers={"Authorization": f"Bearer {hr_token}"})
        assert res_case.status_code in (200, 201)
        case = res_case.json()
        plan_id = case["current_plan_id"]

        # 2. Manager adds custom team task
        task_payload = {
            "title": "Quarterly Systems Architecture Onboarding 1:1",
            "description": "Align on 6-month roadmap for low-latency streaming pipeline and consensus engine.",
            "category": "team_integration",
            "phase": "week_1",
            "scheduled_day_offset": 4,
            "verification_type": "manager_approval",
            "owner_role": "employee",
            "reasoning": "Critical alignment for lead distributed systems engineer.",
        }
        res_add_task = await client.post(
            f"/api/v1/onboarding/plans/{plan_id}/tasks",
            json=task_payload,
            headers={"Authorization": f"Bearer {mgr_token}"},
        )
        assert res_add_task.status_code == 201
        added_task = res_add_task.json()
        assert added_task["title"] == "Quarterly Systems Architecture Onboarding 1:1"

        # 3. Manager approves plan
        res_mgr_review = await client.post(
            f"/api/v1/onboarding/plans/{plan_id}/manager-review",
            json={"decision": "approve", "notes": "Approved technical milestones and 1:1 onboarding session."},
            headers={"Authorization": f"Bearer {mgr_token}"},
        )
        assert res_mgr_review.status_code == 200
        assert res_mgr_review.json()["manager_review_status"] == "approved"

        # 4. HR approves plan
        res_hr_review = await client.post(
            f"/api/v1/onboarding/plans/{plan_id}/hr-review",
            json={"decision": "approve", "notes": "Compliance checks verified."},
            headers={"Authorization": f"Bearer {hr_token}"},
        )
        assert res_hr_review.status_code == 200
        approved_plan = res_hr_review.json()
        assert approved_plan["hr_review_status"] == "approved"
        assert approved_plan["status"] == "approved"


@pytest.mark.asyncio
async def test_enterpro_demonstration_handoff_idempotency(app):
    """Verify EnterPro adapter produces SIMULATED_ACKNOWLEDGEMENT with correlation tracking."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        hr_token = await get_token(client, "hr@techcorp.local")
        headers = {"Authorization": f"Bearer {hr_token}"}

        case = await ensure_case(client, hr_token)
        case_id = case["id"]

        # First dispatch
        res_dispatch = await client.post(
            f"/api/v1/onboarding/cases/{case_id}/enterpro-handoff",
            json={"correlation_id": f"EP-TEST-{case_id[:6]}", "notes": "Simulated production dispatch test"},
            headers=headers,
        )
        assert res_dispatch.status_code == 200
        handoff = res_dispatch.json()
        assert handoff["status"] == "SIMULATED_ACKNOWLEDGEMENT"
        assert "ENTERPRO-WF-SIM" in handoff["simulated_external_workflow_id"]
        assert "disclaimer" in handoff
        assert "Simulated external workflow handoff acknowledged" in handoff["disclaimer"]

        # Second dispatch (idempotency check)
        res_dispatch_again = await client.post(
            f"/api/v1/onboarding/cases/{case_id}/enterpro-handoff",
            json={},
            headers=headers,
        )
        assert res_dispatch_again.status_code == 200
        assert res_dispatch_again.json()["id"] == handoff["id"]


@pytest.mark.asyncio
async def test_task_execution_blockers_and_adaptive_replanning(app):
    """Verify task completion, prerequisite checks, blocker reporting, and adaptive replanning."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        hr_token = await get_token(client, "hr@techcorp.local")
        headers = {"Authorization": f"Bearer {hr_token}"}

        case = await ensure_case(client, hr_token)
        case_id = case["id"]
        plan = case["active_plan"]
        tasks = {t["task_code"]: t for t in plan["tasks"]}

        # 1. Attempting to complete downstream task without prerequisite fails
        if "TASK_FIRST_COMMIT" in tasks and "TASK_SECURITY_AWARENESS" in tasks:
            # First commit requires security awareness
            res_fail = await client.post(
                f"/api/v1/onboarding/tasks/{tasks['TASK_FIRST_COMMIT']['id']}/complete",
                json={"notes": "premature attempt"},
                headers=headers,
            )
            assert res_fail.status_code == 422

        # 2. Complete prerequisite task successfully
        if "TASK_PREBOARD_DOCS" in tasks:
            res_comp = await client.post(
                f"/api/v1/onboarding/tasks/{tasks['TASK_PREBOARD_DOCS']['id']}/complete",
                json={"evidence_url": "https://vault.techcorp.internal/docs/signed-offer.pdf", "notes": "All documents signed"},
                headers=headers,
            )
            assert res_comp.status_code == 200
            assert res_comp.json()["status"] == "completed"

        # 3. Report Blocker on Equipment Receipt
        if "TASK_EQUIPMENT_RECEIPT" in tasks:
            res_block = await client.post(
                f"/api/v1/onboarding/tasks/{tasks['TASK_EQUIPMENT_RECEIPT']['id']}/blocker",
                json={"blocker_reason": "Courier shipment delayed in transit due to weather."},
                headers=headers,
            )
            assert res_block.status_code == 200
            assert res_block.json()["status"] == "blocked"

            # Case status must now be blocked
            res_case_check = await client.get(f"/api/v1/onboarding/cases/{case_id}", headers=headers)
            assert res_case_check.json()["status"] == "blocked"

            # 4. Propose Adaptive Replan
            replan_payload = {
                "trigger": "task_blocked",
                "trigger_task_id": tasks["TASK_EQUIPMENT_RECEIPT"]["id"],
                "explanation": "Courier delay requires shifting hardware dependent tasks by 3 business days.",
                "suggested_day_shift": 3,
            }
            res_replan = await client.post(
                f"/api/v1/onboarding/cases/{case_id}/replan",
                json=replan_payload,
                headers=headers,
            )
            assert res_replan.status_code == 200
            new_plan = res_replan.json()
            assert new_plan["version_number"] == 2
            assert new_plan["status"] == "manager_review"

            # Check diffs
            res_diffs = await client.get(f"/api/v1/onboarding/cases/{case_id}/diffs", headers=headers)
            assert res_diffs.status_code == 200
            diffs = res_diffs.json()
            assert len(diffs) >= 1
            assert "shifted_tasks" in diffs[0]["task_diff"]
