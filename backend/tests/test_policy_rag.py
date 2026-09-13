"""Unit tests for HR Policy Reasoning & RAG Service (Stage 6)."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _get_token_for(email: str, password: str = "DemoSecurePass123!") -> str:
    """Helper to authenticate a persona and obtain a valid bearer token."""
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200, f"Login failed for {email}: {resp.text}"
    return resp.json()["access_token"]


def test_seeded_policy_documents_and_indexing():
    """Verifies that canonical policies are loaded and pre-chunked with section preservation."""
    token = _get_token_for("hr@worksense.local")
    resp = client.get("/api/v1/policies", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    policies = resp.json()
    assert len(policies) >= 3

    # Verify remote work policy exists
    rem_policy = next((p for p in policies if p["policy_code"] == "POL-REM-01"), None)
    assert rem_policy is not None
    assert rem_policy["category"] == "remote_work"


def test_grounded_policy_query_with_citations():
    """Verifies that asking about remote work retrieves exact section citations and conditions."""
    token = _get_token_for("employee@worksense.local")
    payload = {
        "query_text": "What are the eligibility requirements and equipment stipend for remote work?",
        "category_filter": "remote_work",
    }
    resp = client.post("/api/v1/policies/query", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()

    assert data["confidence_state"] in ["supported", "partially_supported"]
    assert len(data["citations"]) > 0

    first_cit = data["citations"][0]
    assert first_cit["policy_code"] == "POL-REM-01"
    assert first_cit["page_number"] in [1, 2]
    assert "Section" in first_cit["section_heading"] or "." in first_cit["section_heading"]
    assert len(first_cit["excerpt"]) > 20

    # Verify proposed action is suggested
    assert data["proposed_action"] is not None
    assert data["proposed_action"]["action_type"] in ["submit_remote_request", "submit_policy_request"]


def test_insufficient_evidence_behavior_without_hallucination():
    """Verifies that questions outside the policy catalog return 'insufficient_evidence' cleanly."""
    token = _get_token_for("employee@worksense.local")
    payload = {
        "query_text": "What is the corporate reimbursement policy for private submarine maintenance?",
    }
    resp = client.post("/api/v1/policies/query", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()

    assert data["confidence_state"] == "insufficient_evidence"
    assert len(data["citations"]) == 0
    assert "Insufficient authoritative policy evidence" in data["answer_text"]


def test_policy_action_request_and_human_review():
    """Verifies submitting a proposed policy action and reviewing it."""
    emp_token = _get_token_for("employee@worksense.local")
    hr_token = _get_token_for("hr@worksense.local")

    # 1. Employee submits action request
    action_payload = {
        "action_type": "submit_remote_request",
        "action_payload": {"days_per_week": 3, "start_date": "2026-11-01"},
    }
    resp = client.post("/api/v1/policies/actions", json=action_payload, headers={"Authorization": f"Bearer {emp_token}"})
    assert resp.status_code == 201
    action_data = resp.json()
    action_id = action_data["id"]
    assert action_data["status"] == "pending"

    # 2. HR lists action requests
    list_resp = client.get("/api/v1/policies/actions", headers={"Authorization": f"Bearer {hr_token}"})
    assert list_resp.status_code == 200
    all_actions = list_resp.json()
    assert any(a["id"] == action_id for a in all_actions)


def test_policy_upload_validation_and_chunking():
    """Verifies uploading a text policy document, extracting sections, and updating the catalog."""
    token = _get_token_for("hr@worksense.local")
    policy_text = (
        "# 1. Purpose and Scope\n"
        "This policy defines travel expense reimbursement rates for corporate conferences.\n\n"
        "# 2. Daily Per Diem Rates\n"
        "Employees traveling on approved company business receive a maximum daily meals per diem of $85 USD.\n"
        "All lodging must be booked through the corporate travel portal at least 21 days in advance.\n"
    )

    files = {
        "file": ("travel_policy.txt", policy_text.encode("utf-8"), "text/plain"),
    }
    form_data = {
        "title": "Corporate Travel & Expense Policy",
        "policy_code": "POL-TRV-01",
        "category": "travel",
        "version_number": "1.0",
        "effective_date": "2026-10-01",
    }

    resp = client.post(
        "/api/v1/policies/upload",
        files=files,
        data=form_data,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201
    upload_res = resp.json()
    assert upload_res["title"] == "Corporate Travel & Expense Policy"
    assert upload_res["extracted_chunks_count"] >= 2
    assert upload_res["ocr_required"] is False


def test_list_policy_chunks():
    """Verifies that pre-indexed chunks endpoint returns transparent chunks."""
    token = _get_token_for("employee@worksense.local")
    resp = client.get("/api/v1/policies/chunks", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    chunks = resp.json()
    assert len(chunks) >= 5
    assert any(c["policy_code"] == "POL-REM-01" for c in chunks)
    assert any(c["policy_code"] == "POL-PROB-01" for c in chunks)
    assert any(c["policy_code"] == "POL-BEN-01" for c in chunks)

    # Verify chunk properties
    first = chunks[0]
    assert "chunk_text" in first
    assert "section_heading" in first
    assert "version_number" in first


def test_can_new_hire_work_remotely_query():
    """Verifies canonical query 'Can a new hire work remotely from day 1?' is grounded in POL-REM-01."""
    token = _get_token_for("employee@worksense.local")
    payload = {"query_text": "Can a new hire work remotely from day 1?"}
    resp = client.post("/api/v1/policies/query", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["confidence_state"] == "supported"
    assert len(data["citations"]) > 0
    assert data["citations"][0]["policy_code"] == "POL-REM-01"
    assert "probation" in data["answer_text"].lower() or "probationary" in data["answer_text"].lower()


def test_system_version_endpoint():
    """Verifies that /api/v1/version returns deployment metadata."""
    resp = client.get("/api/v1/version")
    assert resp.status_code == 200
    data = resp.json()
    assert data["app_version"] == "1.0.0"
    assert "git_commit" in data
    assert "schema_version" in data
