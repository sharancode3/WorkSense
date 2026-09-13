"""API endpoints for Canonical Recommendation-to-Action Workflow (Stage 9)."""

from typing import List, Optional
from fastapi import APIRouter, Depends

from app.api.v1.dependencies import get_current_access_context, require_role
from app.schemas.auth import AccessContext
from app.schemas.recommendation import (
    CanonicalRecommendationResponse,
    NotificationResponse,
    RecommendationApprovalRequest,
    RecommendationExecutionResponse,
)
from app.services.recommendation_service import recommendation_service

router = APIRouter()


@router.get("", response_model=List[CanonicalRecommendationResponse], summary="List canonical recommendations")
def list_recommendations(
    status: Optional[str] = None,
    source_module: Optional[str] = None,
    recommendation_type: Optional[str] = None,
    ctx: AccessContext = Depends(require_role(["manager", "hr", "leadership", "administrator"])),
):
    """Lists cross-module recommendations with transparent supporting evidence."""
    org_id = ctx.active_organization.id if ctx.active_organization else "50000000-0000-0000-0000-000000000001"
    return recommendation_service.list_recommendations(
        organization_id=org_id,
        status=status,
        source_module=source_module,
        recommendation_type=recommendation_type,
    )


@router.get("/{recommendation_id}", response_model=CanonicalRecommendationResponse, summary="Get single recommendation")
def get_recommendation(
    recommendation_id: str,
    ctx: AccessContext = Depends(require_role(["manager", "hr", "leadership", "administrator"])),
):
    """Retrieves single canonical recommendation by ID with full evidence breakdown."""
    return recommendation_service.get_recommendation(recommendation_id)


@router.post("/{recommendation_id}/approve", response_model=CanonicalRecommendationResponse, summary="Submit human approval decision")
def submit_recommendation_approval(
    recommendation_id: str,
    payload: RecommendationApprovalRequest,
    ctx: AccessContext = Depends(require_role(["manager", "hr", "leadership", "administrator"])),
):
    """Submits an accountable human decision (Approve, Reject, Changes Requested) with mandatory written reasoning."""
    return recommendation_service.submit_approval(
        recommendation_id=recommendation_id,
        approver_id=ctx.user.id,
        decision=payload.decision,
        reasoning=payload.reasoning,
        edited_action_payload=payload.edited_action_payload,
    )


@router.post("/{recommendation_id}/dispatch", response_model=RecommendationExecutionResponse, summary="Dispatch to EnterPro adapter")
@router.post("/{recommendation_id}/execute", response_model=RecommendationExecutionResponse, summary="Dispatch to EnterPro adapter alias")
def dispatch_recommendation_to_enterpro(
    recommendation_id: str,
    ctx: AccessContext = Depends(require_role(["hr", "administrator", "manager"])),
):
    """Dispatches human-approved recommendation to the EnterPro Enterprise Adapter."""
    return recommendation_service.dispatch_to_enterpro(
        recommendation_id=recommendation_id,
        dispatched_by_id=ctx.user.id,
    )


@router.get("/notifications/my", response_model=List[NotificationResponse], summary="List in-app notifications")
def list_my_notifications(
    ctx: AccessContext = Depends(get_current_access_context),
):
    """Lists in-app notifications for the authenticated user."""
    org_id = ctx.active_organization.id if ctx.active_organization else "50000000-0000-0000-0000-000000000001"
    return recommendation_service.list_notifications(
        organization_id=org_id,
        recipient_id=ctx.user.id,
    )
