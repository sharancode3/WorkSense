"""API endpoints for Workforce Intelligence (Stage 7)."""

from typing import List
from fastapi import APIRouter, Depends

from app.api.v1.dependencies import require_role
from app.schemas.auth import AccessContext
from app.schemas.intelligence import (
    AttritionAggregateOverview,
    AttritionRiskAssessmentResponse,
    InternalMobilityMatchResponse,
    PerformanceInsightResponse,
)
from app.services.workforce_intelligence_service import workforce_intelligence_service

router = APIRouter()


@router.get("/attrition/overview", response_model=AttritionAggregateOverview, summary="Get cohort attrition overview")
def get_attrition_overview(
    ctx: AccessContext = Depends(require_role(["hr", "leadership", "administrator"])),
):
    """Retrieves aggregated attrition risk overview with small-cohort protection for leadership."""
    org_id = ctx.active_organization.id if ctx.active_organization else "50000000-0000-0000-0000-000000000001"
    is_leadership = "leadership" in ctx.active_roles and "hr" not in ctx.active_roles
    return workforce_intelligence_service.get_attrition_aggregate_overview(
        organization_id=org_id,
        is_leadership=is_leadership,
    )


@router.get("/attrition/{employee_id}", response_model=AttritionRiskAssessmentResponse, summary="Get employee attrition risk (HR-Restricted)")
def get_employee_attrition_risk(
    employee_id: str,
    ctx: AccessContext = Depends(require_role(["hr", "administrator"])),
):
    """Retrieves transparent individual attrition risk signals (strictly restricted to HR and Admins)."""
    return workforce_intelligence_service.get_employee_attrition_risk(employee_id)


@router.get("/performance/{employee_id}", response_model=PerformanceInsightResponse, summary="Get employee performance insights")
def get_employee_performance_insights(
    employee_id: str,
    ctx: AccessContext = Depends(require_role(["manager", "hr", "administrator"])),
):
    """Synthesizes evidence-backed performance insights from goals, feedback, and skills."""
    return workforce_intelligence_service.get_performance_insights(employee_id)


@router.get("/mobility", response_model=List[InternalMobilityMatchResponse], summary="List internal mobility recommendations")
@router.get("/mobility/matches", response_model=List[InternalMobilityMatchResponse], summary="List internal mobility recommendations alias")
def list_internal_mobility_matches(
    ctx: AccessContext = Depends(require_role(["manager", "hr", "administrator"])),
):
    """Lists skill-graph-backed internal mobility match recommendations across the organization."""
    org_id = ctx.active_organization.id if ctx.active_organization else "50000000-0000-0000-0000-000000000001"
    return workforce_intelligence_service.list_internal_mobility_matches(organization_id=org_id)
