"""Test suite for Stage 4: Interview Intelligence, Response Insights, and Human Decision Gate."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import create_app


@pytest.fixture
def app():
    """Create test application instance."""
    return create_app()


async def get_token(client: AsyncClient, email: str = "recruiter@techcorp.local") -> str:
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "DemoPassword123!"},
    )
    assert res.status_code == 200
    return res.json()["access_token"]


@pytest.mark.asyncio
async def test_interview_kit_generation_and_rubric_structure(app):
    """Interview Architect: Generate role-specific questions and 5-point observable rubrics."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_token(client)
        headers = {"Authorization": f"Bearer {token}"}

        cand_id = "30000000-0000-0000-0000-000000000001"
        job_id = "40000000-0000-0000-0000-000000000001"

        payload = {
            "job_opening_id": job_id,
            "candidate_id": cand_id,
            "title": "Technical Systems Architecture Interview",
            "stage": "technical_round_1",
            "focus_competencies": ["Distributed Systems", "Python"],
        }

        res = await client.post("/api/v1/recruitment/interviews/kits", json=payload, headers=headers)
        assert res.status_code == 201
        kit = res.json()

        assert kit["title"] == "Technical Systems Architecture Interview"
        assert kit["status"] == "draft"
        assert len(kit["questions"]) >= 1

        # Verify rubric format: 5 observable levels per question
        for q in kit["questions"]:
            assert "competency" in q
            assert "question_text" in q
            assert "rubric" in q
            rubric = q["rubric"]
            assert len(rubric) == 5
            levels = [r["level"] for r in rubric]
            assert levels == [1, 2, 3, 4, 5]


@pytest.mark.asyncio
async def test_interview_kit_approval_and_session_lifecycle(app):
    """Test full interview workflow: approve kit, schedule session, record answers, synthesize insights."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_token(client)
        headers = {"Authorization": f"Bearer {token}"}

        cand_id = "30000000-0000-0000-0000-000000000001"
        job_id = "40000000-0000-0000-0000-000000000001"

        # 1. Create kit
        kit_res = await client.post(
            "/api/v1/recruitment/interviews/kits",
            json={"job_opening_id": job_id, "candidate_id": cand_id, "title": "Consensus & Concurrency Round"},
            headers=headers,
        )
        assert kit_res.status_code == 201
        kit_id = kit_res.json()["id"]

        # 2. Recruiter reviews and approves kit
        appr_res = await client.post(f"/api/v1/recruitment/interviews/kits/{kit_id}/approve", headers=headers)
        assert appr_res.status_code == 200
        assert appr_res.json()["status"] == "approved"

        # 3. Schedule interview session
        sess_res = await client.post(
            "/api/v1/recruitment/interviews/sessions",
            json={
                "interview_kit_id": kit_id,
                "candidate_id": cand_id,
                "scheduled_at": "2026-09-15T14:00:00Z",
                "notes": "System design and concurrency deep-dive.",
            },
            headers=headers,
        )
        assert sess_res.status_code == 201
        session_id = sess_res.json()["id"]

        # 4. Record interview responses
        resp_res = await client.post(
            f"/api/v1/recruitment/interviews/sessions/{session_id}/responses",
            json={
                "question_index": 1,
                "question_text": "Describe your approach to mitigating split-brain scenarios in distributed consensus.",
                "competency": "Distributed Systems",
                "candidate_response_text": (
                    "I implemented Raft consensus with pre-vote phase and strict majority quorum. "
                    "When network partition occurred, minority partitions rejected write proposals and queued idempotently."
                ),
                "interviewer_notes": "Candidate demonstrated deep understanding of Raft state machines and quorum leases.",
            },
            headers=headers,
        )
        assert resp_res.status_code == 200
        assert resp_res.json()["question_index"] == 1

        # 5. Complete session and synthesize insights
        comp_res = await client.post(f"/api/v1/recruitment/interviews/sessions/{session_id}/complete", headers=headers)
        assert comp_res.status_code == 200
        insight = comp_res.json()
        assert insight["candidate_id"] == cand_id
        assert len(insight["rubric_analysis"]) >= 1
        assert "demonstrated_strengths" in insight
        assert "evidence_gaps" in insight


@pytest.mark.asyncio
async def test_accountable_human_decision_and_override_capture(app):
    """Test that human decision gate records rationale and enforces explicit justification on override."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        token = await get_token(client)
        headers = {"Authorization": f"Bearer {token}"}

        cand_id = "30000000-0000-0000-0000-000000000001"
        job_id = "40000000-0000-0000-0000-000000000001"

        # 1. Normal decision aligned with recommendation
        dec_payload = {
            "decision": "offer",
            "rationale": "Candidate scored 94% on deterministic match and demonstrated Level 5 Raft expertise.",
            "is_override": False,
            "candidate_facing_status": "Final Review",
        }
        res = await client.post(
            f"/api/v1/recruitment/jobs/{job_id}/candidates/{cand_id}/decision",
            json=dec_payload,
            headers=headers,
        )
        assert res.status_code == 201
        dec = res.json()
        assert dec["decision"] == "offer"
        assert dec["is_override"] is False
        assert dec["candidate_facing_status"] == "Final Review"

        # 2. Human override requiring explicit reason
        override_payload = {
            "decision": "hold",
            "rationale": "Holding offer pending executive headcount re-allocation next quarter.",
            "is_override": True,
            "override_reason": "Executive headcount freeze across department until Q4.",
            "candidate_facing_status": "Application Active",
        }
        ovr_res = await client.post(
            f"/api/v1/recruitment/jobs/{job_id}/candidates/{cand_id}/decision",
            json=override_payload,
            headers=headers,
        )
        assert ovr_res.status_code == 201
        ovr = ovr_res.json()
        assert ovr["is_override"] is True
        assert ovr["override_reason"] == "Executive headcount freeze across department until Q4."


@pytest.mark.asyncio
async def test_candidate_access_shield_and_privacy(app):
    """Verify that candidates cannot access internal recruiter scores, rubrics, rankings, or telemetry."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Authenticate as candidate (Elena Rostova)
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"email": "candidate@worksense.local", "password": "DemoPassword123!"},
        )
        assert login_res.status_code == 200
        cand_token = login_res.json()["access_token"]
        cand_headers = {"Authorization": f"Bearer {cand_token}"}

        job_id = "40000000-0000-0000-0000-000000000001"
        cand_id = "30000000-0000-0000-0000-000000000001"

        # 1. Candidate forbidden from reading recruiter ranking table
        rank_res = await client.get(f"/api/v1/recruitment/jobs/{job_id}/rankings", headers=cand_headers)
        assert rank_res.status_code == 403

        # 2. Candidate forbidden from generating interview kits
        kit_res = await client.post(
            "/api/v1/recruitment/interviews/kits",
            json={"job_opening_id": job_id, "title": "Unauthorized Kit"},
            headers=cand_headers,
        )
        assert kit_res.status_code == 403

        # 3. Candidate forbidden from recording hiring decisions
        dec_res = await client.post(
            f"/api/v1/recruitment/jobs/{job_id}/candidates/{cand_id}/decision",
            json={"decision": "offer", "rationale": "I hire myself", "is_override": False},
            headers=cand_headers,
        )
        assert dec_res.status_code == 403

        # 4. Candidate forbidden from reading multi-brain telemetry
        tel_res = await client.get("/api/v1/recruitment/telemetry/runs", headers=cand_headers)
        assert tel_res.status_code == 403
