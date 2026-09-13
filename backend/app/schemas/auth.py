"""Authentication and identity Pydantic schemas."""

from typing import Annotated, List, Optional
from pydantic import BaseModel, Field

EMAIL_PATTERN = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
WorkSenseEmail = Annotated[str, Field(pattern=EMAIL_PATTERN, description="WorkSense verified email address")]


class CandidateRegisterRequest(BaseModel):
    """Candidate self-registration payload."""

    full_name: str = Field(..., min_length=2, max_length=100, description="Candidate full name")
    email: WorkSenseEmail = Field(..., description="Candidate email address")
    password: str = Field(..., min_length=8, max_length=128, description="Password (min 8 chars)")
    password_confirm: str = Field(..., min_length=8, max_length=128, description="Password confirmation")


class LoginRequest(BaseModel):
    """Sign-in payload."""

    email: WorkSenseEmail = Field(..., description="User email address")
    password: str = Field(..., min_length=1, description="Account password")


class SwitchOrgRequest(BaseModel):
    """Switch active tenant organization payload."""

    organization_id: str = Field(..., description="Target organization UUID")


class InviteAcceptRequest(BaseModel):
    """Accept internal invitation payload."""

    token: str = Field(..., description="Invitation token string")
    full_name: str = Field(..., min_length=2, max_length=100, description="Full name")
    password: str = Field(..., min_length=8, max_length=128, description="New password")
    password_confirm: str = Field(..., min_length=8, max_length=128, description="Password confirmation")


class ForgotPasswordRequest(BaseModel):
    """Forgot password request payload."""

    email: WorkSenseEmail = Field(..., description="Registered account email")


class ResetPasswordRequest(BaseModel):
    """Reset password completion payload."""

    token: str = Field(..., description="Reset password token")
    password: str = Field(..., min_length=8, max_length=128, description="New password")
    password_confirm: str = Field(..., min_length=8, max_length=128, description="Password confirmation")


class SafeUser(BaseModel):
    """Public safe representation of a user identity."""

    id: str
    email: str
    full_name: str
    avatar_url: Optional[str] = None
    is_active: bool


class SafeOrganization(BaseModel):
    """Safe tenant organization summary."""

    id: str
    name: str
    slug: str


class AccessContext(BaseModel):
    """Authoritative access context returned to frontend."""

    user: SafeUser
    active_organization: Optional[SafeOrganization] = None
    active_roles: List[str]
    granted_capabilities: List[str]
    membership_status: Optional[str] = None  # active, invited, suspended, revoked, or None for candidate
    available_organizations: List[SafeOrganization] = []
    default_destination: str


class AuthTokenResponse(BaseModel):
    """Login and registration token response envelope."""

    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int
    context: AccessContext


class InviteCreateRequest(BaseModel):
    """Admin invite internal staff request."""

    email: WorkSenseEmail = Field(..., description="Corporate email address of invited employee")
    role: str = Field(..., description="Role to be assigned (employee, manager, recruiter, hr, leadership, administrator)")


class RoleUpdateRequest(BaseModel):
    """Admin role update payload."""

    role: str = Field(..., description="Target role (employee, manager, recruiter, hr, leadership, administrator)")


class MemberItem(BaseModel):
    """Organization member summary for access management console."""

    id: str
    user_id: str
    email: str
    full_name: str
    role: str
    status: str
    joined_at: Optional[str] = None
    is_current_user: bool = False


class MemberListResponse(BaseModel):
    """List of members in active organization."""

    members: List[MemberItem]
    total: int


class AuditLogItem(BaseModel):
    """Security audit trail event entry."""

    id: str
    organization_id: Optional[str] = None
    actor_name: str
    action: str
    result: str
    details: dict = {}
    timestamp: str


class AuditLogResponse(BaseModel):
    """Paginated security audit log list."""

    items: List[AuditLogItem]
    total: int


class MessageResponse(BaseModel):
    """Generic operation acknowledgement."""

    message: str
    success: bool = True
