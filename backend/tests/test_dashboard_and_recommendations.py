"""Unit tests for HR Decision Dashboard (Stage 8) and Recommendation-to-Action (Stage 9)."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _get_token_for(email: str, password: str = "DemoSecurePass123!") -> str:
    """Helper to authenticate a persona and obtain a valid bearer token."""
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200, f"Login failed for {email}: {resp.text}"
    return resp.json()["access_token"]


def test_dashboard_metrics_aggregation():
    """Verifies decision dashboard aggregates real data across recruitment, attendance, onboarding, and skills."""
    hr_token = _get_token_for("hr@worksense.local")
    resp = client.get(
        "/api/v1/dashboard/metrics",
        headers={"Authorization": f"Bearer {hr_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()

    assert data["organization_name"] == "TechCorp Global"
    assert "recruitment_funnel" in data
    assert data["recruitment_funnel"]["applications_total"] >= 1
    assert "attendance" in data
    assert data["attendance"]["average_attendance_rate_pct"] > 80.0
    assert "onboarding" in data
    assert "attrition_overview" in data
    assert len(data["priority_alerts"]) >= 1
    assert len(data["skill_heatmap"]) >= 1


def test_list_canonical_recommendations():
    """Verifies querying canonical recommendations with transparent supporting evidence."""
    hr_token = _get_token_for("hr@worksense.local")
    resp = client.get(
        "/api/v1/recommendations",
        headers={"Authorization": f"Bearer {hr_token}"},
    )
    assert resp.status_code == 200
    recs = resp.json()
    assert len(recs) >= 3

    # Verify Marcus Chen internal mobility recommendation exists
    marcus_rec = next((r for r in recs if "marcus" in r["subject_name"].lower()), None)
    assert marcus_rec is not None
    assert marcus_rec["recommendation_type"] == "internal_mobility"
    assert len(marcus_rec["supporting_evidence"]) >= 2


def test_recommendation_human_approval_gate_validation():
    """Verifies that human approval requires written reasoning and rejects empty reasons."""
    hr_token = _get_token_for("hr@worksense.local")
    recs = client.get("/api/v1/recommendations", headers={"Authorization": f"Bearer {hr_token}"}).json()
    target_rec = recs[0]

    # Attempt approval without reasoning (should fail with 422)
    invalid_resp = client.post(
        f"/api/v1/recommendations/{target_rec['id']}/approve",
        json={"decision": "approved", "reasoning": "ok"},  # < 5 characters
        headers={"Authorization": f"Bearer {hr_token}"},
    )
    assert invalid_resp.status_code == 422

    # Valid approval with written reasoning
    valid_resp = client.post(
        f"/api/v1/recommendations/{target_rec['id']}/approve",
        json={
            "decision": "approved",
            "reasoning": "Fully aligned with department headcount and strategic AI fraud milestone objectives.",
        },
        headers={"Authorization": f"Bearer {hr_token}"},
    )
    assert valid_resp.status_code == 200
    approved_data = valid_resp.json()
    assert approved_data["status"] == "approved"
    assert "outcome_notes" in approved_data


def test_enterpro_workflow_dispatch_idempotency_and_outcome():
    """Verifies dispatching an approved recommendation to the EnterPro adapter."""
    hr_token = _get_token_for("hr@worksense.local")
    recs = client.get("/api/v1/recommendations", headers={"Authorization": f"Bearer {hr_token}"}).json()
    # Find or approve a recommendation
    target_rec = next((r for r in recs if r["status"] == "approved"), None)
    if not target_rec:
        target_rec = recs[0]
        client.post(
            f"/api/v1/recommendations/{target_rec['id']}/approve",
            json={
                "decision": "approved",
                "reasoning": "Sign-off for EnterPro demonstration dispatch.",
            },
            headers={"Authorization": f"Bearer {hr_token}"},
        )

    # First dispatch
    dispatch_resp = client.post(
        f"/api/v1/recommendations/{target_rec['id']}/dispatch",
        headers={"Authorization": f"Bearer {hr_token}"},
    )
    assert dispatch_resp.status_code == 200
    disp_data = dispatch_resp.json()
    assert disp_data["status"] == "SIMULATED_ACKNOWLEDGEMENT"
    assert disp_data["correlation_id"].startswith("EP-ACT-")

    # Second dispatch should be idempotent
    repeat_resp = client.post(
        f"/api/v1/recommendations/{target_rec['id']}/dispatch",
        headers={"Authorization": f"Bearer {hr_token}"},
    )
    assert repeat_resp.status_code == 200
    repeat_data = repeat_resp.json()
    assert repeat_data["correlation_id"] == disp_data["correlation_id"]
    assert "IDEMPOTENT" in repeat_data["message"]
