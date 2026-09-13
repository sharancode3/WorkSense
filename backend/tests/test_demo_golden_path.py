"""Unit tests for Stage 10 Demo Experience & Golden Path Orchestration."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_list_demo_personas():
    """Verifies that the demo persona catalog returns complete role information."""
    resp = client.get("/api/v1/demo/personas")
    assert resp.status_code == 200
    personas = resp.json()
    assert len(personas) >= 5

    # Check key personas are present
    roles = {p["role"] for p in personas}
    assert "hr" in roles
    assert "manager" in roles
    assert "employee" in roles
    assert "recruiter" in roles
    assert "leadership" in roles


def test_demo_state_reset():
    """Verifies that the demo reset endpoint reinitializes all data stores."""
    resp = client.post("/api/v1/demo/reset")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "reset_completed"
    assert "entities_reset" in data
    assert data["entities_reset"]["employees"] >= 1
    assert data["entities_reset"]["policies"] >= 3
    assert data["entities_reset"]["recommendations"] >= 3


def test_marcus_chen_golden_path():
    """Verifies that Marcus Chen's golden path is fully synthesized across Stages 7 & 9."""
    resp = client.get("/api/v1/demo/golden-path/marcus-chen")
    assert resp.status_code == 200
    data = resp.json()

    assert "persona" in data
    assert "Marcus Chen" in data["persona"]["name"]
    assert "stage_7a_attrition_risk" in data
    assert data["stage_7a_attrition_risk"]["risk_score"] > 0.0
    assert "stage_7b_performance_insights" in data
    assert "stage_7c_internal_mobility" in data
    assert data["stage_7c_internal_mobility"]["skill_match_percentage"] > 80.0
    assert "narrative_summary" in data


def test_elena_rostova_golden_path():
    """Verifies that Elena Rostova's golden path is synthesized across Stages 4 & 5."""
    resp = client.get("/api/v1/demo/golden-path/elena-rostova")
    assert resp.status_code == 200
    data = resp.json()

    assert "persona" in data
    assert "Elena" in data["persona"]["name"]
    assert "stage_4_recruitment" in data
    assert "stage_5_adaptive_onboarding" in data
    assert "narrative_summary" in data
