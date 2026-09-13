"""FastAPI security, identity, and authorization dependencies."""

from typing import Callable, List, Optional
from fastapi import Depends, Header
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.auth import decode_access_token
from app.core.errors import ForbiddenError, UnauthorizedError
from app.schemas.auth import AccessContext, SafeUser
from app.services.identity_service import IdentityService, get_identity_service

# Optional Bearer security scheme so we can handle 401 with standard error envelopes
bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    identity_svc: IdentityService = Depends(get_identity_service),
) -> SafeUser:
    """Validate Bearer token and return current authenticated SafeUser."""
    if not credentials or not credentials.credentials:
        raise UnauthorizedError("Missing authentication token. Please sign in.")

    token = credentials.credentials
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedError("Invalid token subject.")

    user = identity_svc._users.get(user_id)
    if not user:
        raise UnauthorizedError("User profile not found or deleted.")

    if not user.get("is_active", True):
        raise ForbiddenError("Account is inactive.")

    return SafeUser(
        id=user["id"],
        email=user["email"],
        full_name=user["full_name"],
        avatar_url=user.get("avatar_url"),
        is_active=user["is_active"],
    )


async def get_current_access_context(
    user: SafeUser = Depends(get_current_user),
    x_organization_id: Optional[str] = Header(None, alias="X-Organization-ID"),
    identity_svc: IdentityService = Depends(get_identity_service),
) -> AccessContext:
    """Resolve authoritative AccessContext for current user, respecting tenant header if valid."""
    ctx = identity_svc.get_access_context(user.id, preferred_org_id=x_organization_id)
    return ctx


def require_permission(permission_code: str) -> Callable:
    """Dependency factory checking for a specific granular capability."""

    async def _check_permission(ctx: AccessContext = Depends(get_current_access_context)) -> AccessContext:
        # Check suspended membership
        if ctx.membership_status == "suspended":
            raise ForbiddenError("Your organization membership is suspended. Action is prohibited.")

        if permission_code not in ctx.granted_capabilities:
            raise ForbiddenError(
                f"Action forbidden: required permission '{permission_code}' is not granted to your active role."
            )
        return ctx

    return _check_permission


def require_role(allowed_roles: List[str]) -> Callable:
    """Dependency factory checking for at least one authorized role."""

    async def _check_role(ctx: AccessContext = Depends(get_current_access_context)) -> AccessContext:
        if ctx.membership_status == "suspended":
            raise ForbiddenError("Your organization membership is suspended. Action is prohibited.")

        has_role = any(role in ctx.active_roles for role in allowed_roles)
        if not has_role:
            raise ForbiddenError(
                f"Access denied: this resource requires one of the following roles: {allowed_roles}."
            )
        return ctx

    return _check_role


async def require_active_membership(ctx: AccessContext = Depends(get_current_access_context)) -> AccessContext:
    """Ensure membership in active organization is not suspended or revoked."""
    if "candidate" in ctx.active_roles:
        return ctx

    if ctx.membership_status != "active":
        raise ForbiddenError(f"Active organization membership required. Current status: {ctx.membership_status}.")
    return ctx
