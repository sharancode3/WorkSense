"""Regression Tests for Canonical Demo Source of Truth (Hackathon Track 1).

Proves:
1. Canonical demo constants from `app.data.canonical_demo` are actively consumed
   by seed logic in workforce, recruitment, onboarding, recommendations,
   workforce intelligence, and demo endpoints.
2. Elena Rostova's title is strictly canonical ("Senior Distributed Systems Engineer")
   across recruitment, onboarding, recommendations, candidate view, and employee data.
3. Dashboard average candidate score derives strictly from real match evaluation data,
   and drops to 0.0 when evaluations are absent (zero fabricated fallbacks).
"""

from copy import deepcopy
from fastapi.testclient import TestClient

from app.data.canonical_demo import (
    DEPT_ENG_ID,
    ELENA_CANDIDATE_ID,
    ELENA_EMPLOYEE_CODE,
    ELENA_INTERVIEW_KIT_ID,
    ELENA_INTERVIEW_SCORE,
    ELENA_JOB_OPENING_ID,
    ELENA_ONBOARDING_CASE_ID,
    ELENA_ONBOARDING_PLAN_ID,
    ELENA_ONBOARDING_RECOMMENDATION_ID,
    ELENA_RESUME_ID,
    MARCUS_CHEN_EMPLOYEE_ID,
    MARCUS_CHEN_RECOMMENDATION_ID,
    MARCUS_CHEN_RETENTION_RISK_SCORE,
    MARCUS_VANCE_EMPLOYEE_ID,
    ORG_TECHCORP_ID,
    ROLE_ELENA_APPLIED_CODE,
    ROLE_ELENA_APPLIED_ID,
    ROLE_ELENA_APPLIED_TITLE,
    ROLE_MARCUS_TARGET_TITLE,
)
from app.main import app
from app.services.dashboard_service import dashboard_service
from app.services.onboarding_service import onboarding_service
from app.services.recommendation_service import recommendation_service
from app.services.recruitment_service import recruitment_service
from app.services.workforce_intelligence_service import workforce_intelligence_service
from app.services.workforce_service import workforce_service

client = TestClient(app)


def test_canonical_demo_constants_consumed_by_services():
    """Verifies that canonical_demo constants are actually populated in services."""
    # 1. Workforce service consumption
    role = workforce_service._job_roles.get(ROLE_ELENA_APPLIED_ID)
    assert role is not None, f"Expected role {ROLE_ELENA_APPLIED_ID} in workforce_service"
    assert role["title"] == ROLE_ELENA_APPLIED_TITLE
    assert role["code"] == ROLE_ELENA_APPLIED_CODE
    assert role["department_id"] == DEPT_ENG_ID

    marcus_emp = workforce_service._employees.get(MARCUS_CHEN_EMPLOYEE_ID)
    assert marcus_emp is not None, f"Expected employee {MARCUS_CHEN_EMPLOYEE_ID} in workforce_service"
    vance_emp = workforce_service._employees.get(MARCUS_VANCE_EMPLOYEE_ID)
    assert vance_emp is not None, f"Expected employee {MARCUS_VANCE_EMPLOYEE_ID} in workforce_service"

    # 2. Recruitment service consumption
    job = recruitment_service._job_openings.get(ELENA_JOB_OPENING_ID)
    assert job is not None, f"Expected job opening {ELENA_JOB_OPENING_ID} in recruitment_service"
    assert job["title"] == ROLE_ELENA_APPLIED_TITLE

    cand = workforce_service._candidate_profiles.get(ELENA_CANDIDATE_ID)
    assert cand is not None, f"Expected candidate {ELENA_CANDIDATE_ID} in workforce_service"

    resume = recruitment_service._resumes.get(ELENA_RESUME_ID)
    assert resume is not None, f"Expected resume {ELENA_RESUME_ID} in recruitment_service"
    assert ROLE_ELENA_APPLIED_TITLE in resume["extracted_text"]

    kit = recruitment_service._interview_kits.get(ELENA_INTERVIEW_KIT_ID)
    assert kit is not None, f"Expected interview kit {ELENA_INTERVIEW_KIT_ID} in recruitment_service"
    assert "Senior Distributed Systems" in kit["title"]

    # 3. Onboarding service consumption
    case = onboarding_service._cases.get(ELENA_ONBOARDING_CASE_ID)
    assert case is not None, f"Expected case {ELENA_ONBOARDING_CASE_ID} in onboarding_service"
    assert case["role_title"] == ROLE_ELENA_APPLIED_TITLE
    assert case["employee_code"] == ELENA_EMPLOYEE_CODE

    plan = onboarding_service._plans.get(ELENA_ONBOARDING_PLAN_ID)
    assert plan is not None, f"Expected plan {ELENA_ONBOARDING_PLAN_ID} in onboarding_service"

    # 4. Recommendation service consumption
    recs = recommendation_service._recommendations
    assert MARCUS_CHEN_RECOMMENDATION_ID in recs
    assert ELENA_ONBOARDING_RECOMMENDATION_ID in recs

    # 5. Workforce intelligence service consumption
    matches = list(workforce_intelligence_service._mobility_matches.values())
    marcus_match = next((m for m in matches if m.get("employee_id") == MARCUS_CHEN_EMPLOYEE_ID), None)
    assert marcus_match is not None
    assert marcus_match["target_role_title"] == ROLE_MARCUS_TARGET_TITLE

    risk = workforce_intelligence_service._risk_assessments.get(MARCUS_CHEN_EMPLOYEE_ID)
    assert risk is not None
    assert risk["risk_score"] == MARCUS_CHEN_RETENTION_RISK_SCORE


def test_elena_title_identical_across_all_stages():
    """Elena's title must strictly be 'Senior Distributed Systems Engineer' everywhere."""
    canonical_title = "Senior Distributed Systems Engineer"
    assert ROLE_ELENA_APPLIED_TITLE == canonical_title

    # 1. Recruitment job opening & candidate record
    job = recruitment_service._job_openings[ELENA_JOB_OPENING_ID]
    assert job["title"] == canonical_title

    # 2. Recruitment interview kit
    kit = recruitment_service._interview_kits[ELENA_INTERVIEW_KIT_ID]
    assert "Senior Distributed Systems" in kit["title"]
    assert "Staff Distributed Systems" not in kit["title"]

    # 3. Onboarding Case
    case = onboarding_service._cases[ELENA_ONBOARDING_CASE_ID]
    assert case["role_title"] == canonical_title
    assert case["job_title"] == canonical_title

    # 4. Onboarding Employee record
    emp = workforce_service._employees.get(case["employee_id"])
    if emp:
        role = workforce_service._job_roles.get(emp["job_role_id"])
        if role:
            assert role["title"] == canonical_title

    # 5. Recommendation summary
    elena_rec = recommendation_service._recommendations[ELENA_ONBOARDING_RECOMMENDATION_ID]
    assert "Senior Distributed Systems Engineer" in elena_rec["title"] or "Senior Distributed Systems Engineer" in elena_rec["summary"]
    assert "Staff Distributed Systems" not in elena_rec["title"]
    assert "Staff Distributed Systems" not in elena_rec["summary"]

    # 6. Demo persona and golden path endpoint
    resp = client.get("/api/v1/demo/golden-path/elena-rostova")
    assert resp.status_code == 200
    data = resp.json()
    assert data["persona"]["target_role"] == canonical_title


def test_dashboard_score_derives_from_evaluations_and_zeros_when_absent():
    """Verifies that average_candidate_score derives from evaluations and becomes 0.0 when none exist."""
    # When seeded, Elena's evaluation is present
    summary_seeded = dashboard_service.get_dashboard_summary(organization_id=ORG_TECHCORP_ID)
    assert summary_seeded.recruitment_funnel.average_candidate_score == ELENA_INTERVIEW_SCORE

    # Backup evaluations and clear them
    saved_evals = deepcopy(recruitment_service._match_evaluations)
    try:
        recruitment_service._match_evaluations.clear()
        summary_empty = dashboard_service.get_dashboard_summary(organization_id=ORG_TECHCORP_ID)
        # Must strictly be 0.0 with no fabricated fallback
        assert summary_empty.recruitment_funnel.average_candidate_score == 0.0
    finally:
        # Restore evaluations
        recruitment_service._match_evaluations = saved_evals

    # Verify restored state
    summary_restored = dashboard_service.get_dashboard_summary(organization_id=ORG_TECHCORP_ID)
    assert summary_restored.recruitment_funnel.average_candidate_score == ELENA_INTERVIEW_SCORE
