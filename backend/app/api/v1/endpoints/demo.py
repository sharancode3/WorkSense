"""Demo and Golden Path Endpoints for Hackathon Evaluation (Stage 10).

Provides:
1. One-click persona switcher catalog.
2. Full state reset to pristine demo seed state.
3. Automated Golden Path walk-through payloads for Elena Rostova and Marcus Chen.
"""

import logging
from typing import Any, Dict, List
from fastapi import APIRouter
from pydantic import BaseModel

from app.services.onboarding_service import onboarding_service
from app.services.policy_rag_service import policy_rag_service
from app.services.recommendation_service import recommendation_service
from app.services.recruitment_service import recruitment_service
from app.services.workforce_intelligence_service import workforce_intelligence_service
from app.services.workforce_service import workforce_service

logger = logging.getLogger("worksense.demo")

router = APIRouter()


class PersonaItem(BaseModel):
    id: str
    name: str
    email: str
    role: str
    title: str
    department: str
    narrative_focus: str
    avatar_color: str


class DemoResetResponse(BaseModel):
    status: str
    message: str
    entities_reset: Dict[str, int]


@router.get("/personas", response_model=List[PersonaItem], summary="Get Demo Persona Catalog")
def list_demo_personas() -> List[PersonaItem]:
    """Returns curated personas demonstrating each role workspace and narrative golden path."""
    return [
        PersonaItem(
            id="persona-hr",
            name="Sarah Jenkins",
            email="hr@worksense.local",
            role="hr",
            title="People Operations Director",
            department="People & Culture",
            narrative_focus="Stages 6, 8, 9: Policy reasoning, HR Decision Dashboard, human recommendation review & EnterPro dispatch.",
            avatar_color="#2563EB",
        ),
        PersonaItem(
            id="persona-manager",
            name="David Kim",
            email="manager@worksense.local",
            role="manager",
            title="Engineering Manager - Platform",
            department="Engineering",
            narrative_focus="Stages 5, 7: Adaptive onboarding milestone reviews, Marcus Chen performance & mobility assessment.",
            avatar_color="#7C3AED",
        ),
        PersonaItem(
            id="persona-employee",
            name="Marcus Chen",
            email="employee@worksense.local",
            role="employee",
            title="Senior Distributed Systems Engineer",
            department="Engineering",
            narrative_focus="Stages 6, 7, 9: Remote policy queries, transparent attrition factor transparency, career mobility match.",
            avatar_color="#059669",
        ),
        PersonaItem(
            id="persona-recruiter",
            name="Chloe Bennett",
            email="recruiter@worksense.local",
            role="recruiter",
            title="Senior Technical Talent Partner",
            department="Talent Acquisition",
            narrative_focus="Stages 4, 5: Elena Rostova resume evidence extraction, 5-tier interview rubric generation, hire sign-off.",
            avatar_color="#D97706",
        ),
        PersonaItem(
            id="persona-leadership",
            name="Rachel Vance",
            email="leadership@worksense.local",
            role="leadership",
            title="VP of Engineering & Workforce Strategy",
            department="Executive Leadership",
            narrative_focus="Stages 7, 8: Aggregated workforce cohort risk, departmental mobility readiness, recruitment pipeline health.",
            avatar_color="#DC2626",
        ),
    ]


@router.post("/reset", response_model=DemoResetResponse, summary="Reset Demo Data to Seed State")
def reset_demo_state() -> DemoResetResponse:
    """Restores all in-memory services to pristine initial state for clean evaluation."""
    logger.info("Executing full demo state reset across all WorkSense services.")

    # Re-initialize workforce services
    workforce_service.__init__()
    recruitment_service.__init__()
    onboarding_service.__init__()
    policy_rag_service.__init__()
    workforce_intelligence_service.__init__()
    recommendation_service.__init__()

    return DemoResetResponse(
        status="reset_completed",
        message="All workforce entities, candidate twins, policies, and recommendation pipelines successfully reset to seed state.",
        entities_reset={
            "employees": len(workforce_service._employees),
            "candidates": len(workforce_service._candidate_profiles),
            "departments": len(workforce_service._departments),
            "job_roles": len(workforce_service._job_roles),
            "skills": len(workforce_service._skills),
            "policies": len(workforce_service._policy_documents),
            "recommendations": len(recommendation_service._recommendations),
        },
    )


@router.get("/golden-path/marcus-chen", summary="Marcus Chen Golden Path Intelligence")
def get_marcus_chen_golden_path() -> Dict[str, Any]:
    """Pre-computed narrative summary of Marcus Chen's journey from tenure stagnation to internal mobility."""
    employees = workforce_service.list_employees()
    marcus = next((e for e in employees if "chen" in e["full_name"].lower()), next((e for e in employees if "marcus" in e["full_name"].lower()), employees[0]))
    marcus_id = marcus["id"]

    risk = workforce_intelligence_service.get_employee_attrition_risk(
        employee_id=marcus_id,
    )

    perf = workforce_intelligence_service.get_performance_insights(employee_id=marcus_id)
    recs = recommendation_service.list_recommendations(organization_id=marcus.get("organization_id"))
    marcus_rec = next((r for r in recs if r.subject_id == marcus_id), None)

    return {
        "persona": {
            "name": marcus["full_name"],
            "title": marcus.get("job_title", "Senior Distributed Systems Engineer"),
            "tenure_years": 3.8,
            "department": marcus.get("department_name", "Core Infrastructure"),
        },
        "stage_7a_attrition_risk": risk.model_dump(),
        "stage_7b_performance_insights": perf.model_dump(),
        "stage_7c_internal_mobility": {
            "recommended_target_role": "Principal Distributed Systems Architect",
            "skill_match_percentage": 94.0,
            "transferable_skills": ["Go", "Distributed Systems", "Kubernetes", "Kafka"],
            "growth_areas": ["Cloud Economics", "Enterprise Architecture Governance"],
        },
        "stage_9_canonical_recommendation": marcus_rec.model_dump() if marcus_rec else None,
        "narrative_summary": (
            "Marcus Chen is an exceptional performer facing tenure stagnation (L5 for 3.8 years). "
            "Rather than allowing unmitigated attrition, WorkSense identifies high skill transferability (94%) "
            "to the open Principal Distributed Systems Architect role, generating an evidence-backed "
            "recommendation that HR approves and dispatches to EnterPro in under 2 minutes."
        ),
    }


@router.get("/golden-path/elena-rostova", summary="Elena Rostova Golden Path Journey")
def get_elena_rostova_golden_path() -> Dict[str, Any]:
    """Pre-computed narrative summary of Elena Rostova's journey from candidate to adapted employee."""
    cands = list(workforce_service._candidate_profiles.values())
    elena = next((c for c in cands if "elena" in f"{c.get('first_name', '')} {c.get('last_name', '')}".lower()), None)

    onb_cases = onboarding_service.list_cases(org_id="00000000-0000-0000-0000-000000000001")
    elena_case = next((c for c in onb_cases.cases if "elena" in c.candidate_name.lower()), None)

    return {
        "persona": {
            "name": f"{elena.get('first_name', 'Elena')} {elena.get('last_name', 'Rostova')}" if elena else "Elena Rostova",
            "target_role": "Senior Fraud Detection ML Engineer",
            "department": "Risk & Trust Engineering",
            "hire_date": "2026-10-01",
        },
        "stage_4_recruitment": {
            "match_score": 88.5,
            "interview_stage": "Technical Architecture & Fairness Rubrics",
            "decision": "Hired (Strong Hire - Approved by David Kim)",
        },
        "stage_5_adaptive_onboarding": elena_case.model_dump() if elena_case else None,
        "narrative_summary": (
            "Elena Rostova's Candidate Twin transitions seamlessly into an Employee Twin. "
            "Her verified ML and Python skills are retained, while WorkSense dynamically schedules "
            "targeted learning modules for corporate Zero-Trust VPN setup and Go microservices standards."
        ),
    }
