"""Unit tests for Workforce Intelligence (Stage 7)."""

from fastapi.testclient import TestClient

from app.main import app
from app.services.workforce_service import workforce_service

client = TestClient(app)


def _get_token_for(email: str, password: str = "DemoSecurePass123!") -> str:
    """Helper to authenticate a persona and obtain a valid bearer token."""
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200, f"Login failed for {email}: {resp.text}"
    return resp.json()["access_token"]


def test_individual_attrition_risk_and_factors():
    """Verifies transparent risk index calculation and signal contributions for Marcus Chen."""
    hr_token = _get_token_for("hr@worksense.local")
    employees = workforce_service.list_employees()
    marcus = next((e for e in employees if "marcus" in e["full_name"].lower()), employees[0])

    resp = client.get(
        f"/api/v1/intelligence/attrition/{marcus['id']}",
        headers={"Authorization": f"Bearer {hr_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()

    assert data["employee_name"] == marcus["full_name"]
    assert data["risk_band"] in ["priority_review", "review", "monitor"]
    assert 0.0 <= data["risk_score"] <= 1.0
    assert len(data["contributing_factors"]) > 0

    # Verify tenure stagnation factor exists for Marcus Chen
    if "marcus" in marcus["full_name"].lower():
        tenure_factor = next(
            (f for f in data["contributing_factors"] if "tenure" in f["signal_name"].lower()),
            None,
        )
        assert tenure_factor is not None
        assert tenure_factor["direction"] == "increases_risk"


def test_attrition_endpoint_rbac_restriction():
    """Verifies that individual employee attrition risk is strictly forbidden for regular employees and candidates."""
    emp_token = _get_token_for("employee@worksense.local")
    employees = workforce_service.list_employees()
    first_emp = employees[0]

    # Employee attempting to access individual risk gets 403
    resp = client.get(
        f"/api/v1/intelligence/attrition/{first_emp['id']}",
        headers={"Authorization": f"Bearer {emp_token}"},
    )
    assert resp.status_code == 403


def test_attrition_cohort_overview_for_leadership():
    """Verifies aggregated cohort risk overview for leadership."""
    lead_token = _get_token_for("leadership@worksense.local")
    resp = client.get(
        "/api/v1/intelligence/attrition/overview",
        headers={"Authorization": f"Bearer {lead_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()

    assert data["total_evaluated"] >= 1
    assert "band_distribution" in data
    assert len(data["top_contributing_signals"]) > 0


def test_performance_insights_synthesis():
    """Verifies evidence-backed performance insights synthesis."""
    mgr_token = _get_token_for("manager@worksense.local")
    employees = workforce_service.list_employees()
    first_emp = employees[0]

    resp = client.get(
        f"/api/v1/intelligence/performance/{first_emp['id']}",
        headers={"Authorization": f"Bearer {mgr_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()

    assert data["employee_name"] == first_emp["full_name"]
    assert len(data["demonstrated_strengths"]) > 0
    assert "goal_summary" in data
    assert data["goal_summary"]["average_progress_pct"] >= 0.0


def test_internal_mobility_matches_and_transferability():
    """Verifies skill-graph-backed internal mobility recommendations."""
    hr_token = _get_token_for("hr@worksense.local")
    resp = client.get(
        "/api/v1/intelligence/mobility",
        headers={"Authorization": f"Bearer {hr_token}"},
    )
    assert resp.status_code == 200
    matches = resp.json()
    assert len(matches) >= 1

    first_match = matches[0]
    assert first_match["fit_percentage"] > 50
    assert len(first_match["adjacent_transferable_skills"]) > 0
