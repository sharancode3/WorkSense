"""Test suite for Candidate Digital Twin, Evidence Ledger, and Idempotent Conversion."""

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
async def test_candidate_twin_projection_and_evidence(app):
    """Test candidate twin projection renders skills, evidence lineage, and timeline."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        recruiter_token = await get_token(client, "recruiter@techcorp.local")
        headers = {"Authorization": f"Bearer {recruiter_token}"}

        # 1. Fetch candidate list
        res_list = await client.get("/api/v1/workforce/candidates", headers=headers)
        assert res_list.status_code == 200
        candidates = res_list.json()
        assert len(candidates) >= 1

        sarah = next((c for c in candidates if "Sarah" in c["full_name"]), candidates[0])
        candidate_id = sarah["id"]

        # 2. Fetch Candidate Twin
        res_twin = await client.get(f"/api/v1/workforce/candidates/{candidate_id}/twin", headers=headers)
        assert res_twin.status_code == 200
        twin = res_twin.json()

        assert twin["candidate"]["id"] == candidate_id
        assert "skills" in twin
        assert len(twin["skills"]) >= 1
        assert "evidence_items" in twin
        assert len(twin["evidence_items"]) >= 1

        # Check evidence lineage has verifiable source_uri and claim_summary
        ev_item = twin["evidence_items"][0]
        assert ev_item["source_type"] is not None
        assert ev_item["source_uri"] is not None

        # Check completeness percentage and timeline
        assert 0 <= twin["profile_completeness_pct"] <= 100
        assert len(twin["timeline"]) >= 1


@pytest.mark.asyncio
async def test_candidate_to_employee_idempotent_conversion(app):
    """Test candidate conversion to employee preserves lineage and is strictly idempotent."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        hr_token = await get_token(client, "hr@techcorp.local")
        headers = {"Authorization": f"Bearer {hr_token}"}

        # 1. Get candidate
        res_list = await client.get("/api/v1/workforce/candidates", headers=headers)
        candidates = res_list.json()
        sarah = next((c for c in candidates if "Sarah" in c["full_name"]), candidates[0])
        candidate_id = sarah["id"]

        # Get engineering department and role
        res_depts = await client.get("/api/v1/workforce/departments", headers=headers)
        eng_dept = next(d for d in res_depts.json() if d["code"] == "ENG")

        res_roles = await client.get("/api/v1/workforce/job-roles", headers=headers)
        role = res_roles.json()[0]

        # 2. Execute conversion
        conversion_payload = {
            "department_id": eng_dept["id"],
            "job_role_id": role["id"],
            "employee_code": "TC-ENG-991",
            "hire_date": "2026-10-01",
        }

        res_convert = await client.post(
            f"/api/v1/workforce/candidates/{candidate_id}/convert",
            headers=headers,
            json=conversion_payload,
        )
        assert res_convert.status_code == 200
        conv_data = res_convert.json()
        assert conv_data["success"] is True
        assert conv_data["employee_id"] is not None
        emp_id = conv_data["employee_id"]
        assert conv_data["carried_skill_count"] >= 1
        assert conv_data["carried_evidence_count"] >= 1

        # 3. Test Idempotency: Re-submitting conversion for the same candidate returns existing record
        res_convert_again = await client.post(
            f"/api/v1/workforce/candidates/{candidate_id}/convert",
            headers=headers,
            json=conversion_payload,
        )
        assert res_convert_again.status_code == 200
        conv_again_data = res_convert_again.json()
        assert conv_again_data["success"] is True
        assert conv_again_data["employee_id"] == emp_id
        assert "already converted" in conv_again_data["message"].lower()

        # 4. Verify candidate status updated
        res_cand = await client.get(f"/api/v1/workforce/candidates/{candidate_id}", headers=headers)
        assert res_cand.status_code == 200
        assert res_cand.json()["record_status"] == "converted"


@pytest.mark.asyncio
async def test_candidate_cannot_execute_conversion(app):
    """Candidate attempting to self-convert is rejected with 403."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        cand_token = await get_token(client, "candidate@worksense.local")
        headers = {"Authorization": f"Bearer {cand_token}"}

        res = await client.post(
            "/api/v1/workforce/candidates/68000000-0000-0000-0000-000000000001/convert",
            headers=headers,
            json={
                "department_id": "60000000-0000-0000-0000-000000000001",
                "job_role_id": "61000000-0000-0000-0000-000000000001",
                "employee_code": "TC-HACK-01",
            },
        )
        assert res.status_code == 403
