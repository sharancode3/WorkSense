"""API endpoints for Main HR Decision Dashboard (Stage 8)."""

from typing import Optional
from fastapi import APIRouter, Depends

from app.api.v1.dependencies import require_role
from app.schemas.auth import AccessContext
from app.schemas.dashboard import DashboardSummaryResponse
from app.services.dashboard_service import dashboard_service

router = APIRouter()


@router.get("/metrics", response_model=DashboardSummaryResponse, summary="Get main HR decision dashboard metrics")
@router.get("/summary", response_model=DashboardSummaryResponse, summary="Get main HR decision dashboard metrics alias")
def get_dashboard_metrics(
    department_id: Optional[str] = None,
    ctx: AccessContext = Depends(require_role(["hr", "leadership", "administrator", "manager"])),
):
    """Calculates comprehensive decision dashboard metrics dynamically from live operational services."""
    org_id = ctx.active_organization.id if ctx.active_organization else "50000000-0000-0000-0000-000000000001"
    is_leadership = "leadership" in ctx.active_roles and "hr" not in ctx.active_roles
    return dashboard_service.get_dashboard_summary(
        organization_id=org_id,
        department_id=department_id,
        is_leadership=is_leadership,
    )
