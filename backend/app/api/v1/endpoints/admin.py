"""Administration, access governance, and security audit endpoints."""

from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, Query, status

from app.api.v1.dependencies import require_permission
from app.schemas.auth import (
    AccessContext,
    AuditLogResponse,
    InviteCreateRequest,
    MemberListResponse,
    MessageResponse,
    RoleUpdateRequest,
)
from app.services.identity_service import IdentityService, get_identity_service

router = APIRouter()


@router.get(
    "/members",
    response_model=MemberListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Organization Members",
    description="List members strictly within caller's active organization with status and role details.",
)
async def list_members(
    query: Optional[str] = Query(None, description="Filter by name or email"),
    role: Optional[str] = Query(None, description="Filter by role name"),
    ctx: AccessContext = Depends(require_permission("admin.members.read")),
    identity_svc: IdentityService = Depends(get_identity_service),
) -> MemberListResponse:
    return identity_svc.list_members(ctx, query=query, role=role)


@router.post(
    "/invite",
    response_model=Dict[str, Any],
    status_code=status.HTTP_201_CREATED,
    summary="Invite Internal Staff",
    description="Issue a secure internal invitation for an employee, manager, recruiter, HR, or admin role.",
)
async def invite_member(
    req: InviteCreateRequest,
    ctx: AccessContext = Depends(require_permission("admin.members.invite")),
    identity_svc: IdentityService = Depends(get_identity_service),
) -> Dict[str, Any]:
    return identity_svc.invite_member(ctx, req)


@router.post(
    "/members/{user_id}/role",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Update Member Role",
    description="Assign or modify a member's role with self-elevation and last-admin protection.",
)
async def update_member_role(
    user_id: str,
    req: RoleUpdateRequest,
    ctx: AccessContext = Depends(require_permission("admin.members.role_assign")),
    identity_svc: IdentityService = Depends(get_identity_service),
) -> MessageResponse:
    identity_svc.update_member_role(ctx, user_id, req)
    return MessageResponse(message=f"Role successfully updated to {req.role}.")


@router.post(
    "/members/{user_id}/suspend",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Suspend Member",
    description="Suspend member access with self-suspension and last-admin protection.",
)
async def suspend_member(
    user_id: str,
    ctx: AccessContext = Depends(require_permission("admin.members.suspend")),
    identity_svc: IdentityService = Depends(get_identity_service),
) -> MessageResponse:
    identity_svc.suspend_member(ctx, user_id)
    return MessageResponse(message="Member access has been suspended.")


@router.post(
    "/members/{user_id}/reactivate",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Reactivate Member",
    description="Reactivate a suspended member's access in the organization.",
)
async def reactivate_member(
    user_id: str,
    ctx: AccessContext = Depends(require_permission("admin.members.suspend")),
    identity_svc: IdentityService = Depends(get_identity_service),
) -> MessageResponse:
    identity_svc.reactivate_member(ctx, user_id)
    return MessageResponse(message="Member access has been reactivated.")


@router.get(
    "/audit-logs",
    response_model=AuditLogResponse,
    status_code=status.HTTP_200_OK,
    summary="Query Security Audit Trail",
    description="Retrieve immutable security audit trail events for active organization.",
)
async def list_audit_logs(
    limit: int = Query(50, ge=1, le=200, description="Max entries to return"),
    ctx: AccessContext = Depends(require_permission("admin.audit.read")),
    identity_svc: IdentityService = Depends(get_identity_service),
) -> AuditLogResponse:
    return identity_svc.list_audit_logs(ctx, limit=limit)
