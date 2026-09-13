"""Authentication and identity endpoints."""

from fastapi import APIRouter, Depends, status

from app.api.v1.dependencies import get_current_access_context
from app.schemas.auth import (
    AccessContext,
    AuthTokenResponse,
    CandidateRegisterRequest,
    ForgotPasswordRequest,
    InviteAcceptRequest,
    LoginRequest,
    MessageResponse,
    ResetPasswordRequest,
    SwitchOrgRequest,
)
from app.services.identity_service import IdentityService, get_identity_service

router = APIRouter()


@router.post(
    "/register-candidate",
    response_model=AuthTokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Candidate Self-Registration",
    description="Public self-registration strictly creating candidate accounts. Zero elevated role assignment.",
)
async def register_candidate(
    req: CandidateRegisterRequest,
    identity_svc: IdentityService = Depends(get_identity_service),
) -> AuthTokenResponse:
    res = identity_svc.register_candidate(req)
    return AuthTokenResponse(
        access_token=res["access_token"],
        token_type=res["token_type"],
        expires_in_minutes=res["expires_in_minutes"],
        context=res["context"],
    )


@router.post(
    "/login",
    response_model=AuthTokenResponse,
    status_code=status.HTTP_200_OK,
    summary="User Authentication",
    description="Verify credentials and issue signed token with authoritative AccessContext.",
)
async def login(
    req: LoginRequest,
    identity_svc: IdentityService = Depends(get_identity_service),
) -> AuthTokenResponse:
    res = identity_svc.authenticate(req.email, req.password)
    return AuthTokenResponse(
        access_token=res["access_token"],
        token_type=res["token_type"],
        expires_in_minutes=res["expires_in_minutes"],
        context=res["context"],
    )


@router.post(
    "/logout",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Sign Out",
    description="Terminate session and acknowledge logout.",
)
async def logout() -> MessageResponse:
    return MessageResponse(message="Session successfully terminated.")


@router.get(
    "/me",
    response_model=AccessContext,
    status_code=status.HTTP_200_OK,
    summary="Current Access Context",
    description="Return authoritative user identity, active organization, active roles, and granted capabilities.",
)
async def get_my_context(
    ctx: AccessContext = Depends(get_current_access_context),
) -> AccessContext:
    return ctx


@router.post(
    "/switch-organization",
    response_model=AccessContext,
    status_code=status.HTTP_200_OK,
    summary="Switch Active Organization",
    description="Switch active tenant context for users with verified multi-organization memberships.",
)
async def switch_organization(
    req: SwitchOrgRequest,
    ctx: AccessContext = Depends(get_current_access_context),
    identity_svc: IdentityService = Depends(get_identity_service),
) -> AccessContext:
    updated_ctx = identity_svc.switch_organization(ctx.user.id, req.organization_id)
    return updated_ctx


@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Request Password Reset",
    description="Safe password recovery initiation. Leaks no sensitive account information.",
)
async def forgot_password(
    req: ForgotPasswordRequest,
    identity_svc: IdentityService = Depends(get_identity_service),
) -> MessageResponse:
    msg = identity_svc.request_password_reset(req.email)
    return MessageResponse(message=msg)


@router.post(
    "/reset-password",
    response_model=MessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Complete Password Reset",
    description="Complete password reset using a verified high-entropy token.",
)
async def reset_password(
    req: ResetPasswordRequest,
    identity_svc: IdentityService = Depends(get_identity_service),
) -> MessageResponse:
    identity_svc.reset_password(req)
    return MessageResponse(message="Password has been successfully updated.")


@router.post(
    "/accept-invite",
    response_model=AuthTokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Accept Staff Invitation",
    description="Accept internal invitation, activate organization membership, and assign verified role.",
)
async def accept_invite(
    req: InviteAcceptRequest,
    identity_svc: IdentityService = Depends(get_identity_service),
) -> AuthTokenResponse:
    res = identity_svc.accept_invitation(req)
    return AuthTokenResponse(
        access_token=res["access_token"],
        token_type=res["token_type"],
        expires_in_minutes=res["expires_in_minutes"],
        context=res["context"],
    )
