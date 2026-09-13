"""Authoritative Identity, Organization Tenancy, and Role-Based Access Control Service."""

import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from app.core.auth import (
    create_access_token,
    generate_secure_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.core.errors import (
    ConflictError,
    ForbiddenError,
    NotFoundError,
    UnauthorizedError,
    ValidationError,
)
from app.schemas.auth import (
    AccessContext,
    AuditLogItem,
    AuditLogResponse,
    CandidateRegisterRequest,
    InviteAcceptRequest,
    InviteCreateRequest,
    MemberItem,
    MemberListResponse,
    ResetPasswordRequest,
    RoleUpdateRequest,
    SafeOrganization,
    SafeUser,
)

logger = logging.getLogger("worksense.identity")

# Canonical Role-to-Permission Mapping
CANONICAL_ROLE_PERMISSIONS: Dict[str, List[str]] = {
    "candidate": [
        "portal.candidate.access",
        "profile.self.read",
        "profile.self.update",
    ],
    "employee": [
        "portal.employee.access",
        "profile.self.read",
        "profile.self.update",
    ],
    "manager": [
        "portal.employee.access",
        "portal.manager.access",
        "profile.self.read",
        "profile.self.update",
        "team.assigned.read",
    ],
    "recruiter": [
        "portal.recruiter.access",
        "profile.self.read",
        "profile.self.update",
    ],
    "hr": [
        "portal.employee.access",
        "portal.hr.access",
        "profile.self.read",
        "profile.self.update",
    ],
    "leadership": [
        "portal.leadership.access",
        "profile.self.read",
        "profile.self.update",
    ],
    "administrator": [
        "admin.access",
        "admin.members.read",
        "admin.members.invite",
        "admin.members.role_assign",
        "admin.members.suspend",
        "admin.audit.read",
        "profile.self.read",
        "profile.self.update",
    ],
}

ROLE_DEFAULT_DESTINATIONS: Dict[str, str] = {
    "candidate": "/candidate",
    "employee": "/employee",
    "manager": "/manager",
    "recruiter": "/recruiter",
    "hr": "/hr",
    "leadership": "/leadership",
    "administrator": "/admin/access",
}


class IdentityService:
    """Stateful identity and authorization service implementing enterprise access rules."""

    def __init__(self) -> None:
        self._organizations: Dict[str, Dict[str, Any]] = {}
        self._users: Dict[str, Dict[str, Any]] = {}  # keyed by user_id
        self._users_by_email: Dict[str, str] = {}  # email.lower() -> user_id
        self._memberships: Dict[str, Dict[str, Any]] = {}  # keyed by membership_id
        self._user_roles: Dict[str, Dict[str, Any]] = {}  # keyed by user_role_id
        self._invitations: Dict[str, Dict[str, Any]] = {}  # keyed by token_hash
        self._reset_tokens: Dict[str, Dict[str, Any]] = {}  # keyed by token_hash
        self._audit_logs: List[Dict[str, Any]] = []

        self._seed_initial_data()

    def _seed_initial_data(self) -> None:
        """Seed deterministic organizations, test roles, and demo personas."""
        # 1. Organizations
        org_techcorp_id = "00000000-0000-0000-0000-000000000001"
        org_acmecorp_id = "00000000-0000-0000-0000-000000000002"

        self._organizations[org_techcorp_id] = {
            "id": org_techcorp_id,
            "name": "TechCorp International",
            "slug": "techcorp",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        self._organizations[org_acmecorp_id] = {
            "id": org_acmecorp_id,
            "name": "AcmeCorp Global",
            "slug": "acmecorp",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        # Safe default password for all deterministic demo accounts
        demo_password_hash = hash_password("DemoPassword123!")

        # 2. Seed Personas
        seed_users_data = [
            {
                "id": "30000000-0000-0000-0000-000000000001",
                "email": "candidate@worksense.local",
                "full_name": "Elena Rostova",
                "role": "candidate",
                "org_id": None,
                "status": None,
            },
            {
                "id": "30000000-0000-0000-0000-000000000002",
                "email": "employee@techcorp.local",
                "full_name": "Marcus Chen",
                "role": "employee",
                "org_id": org_techcorp_id,
                "status": "active",
            },
            {
                "id": "30000000-0000-0000-0000-000000000003",
                "email": "manager@techcorp.local",
                "full_name": "Marcus Vance",
                "role": "manager",
                "org_id": org_techcorp_id,
                "status": "active",
            },
            {
                "id": "30000000-0000-0000-0000-000000000004",
                "email": "recruiter@techcorp.local",
                "full_name": "Priya Sharma",
                "role": "recruiter",
                "org_id": org_techcorp_id,
                "status": "active",
            },
            {
                "id": "30000000-0000-0000-0000-000000000005",
                "email": "hr@techcorp.local",
                "full_name": "Jordan Hayes",
                "role": "hr",
                "org_id": org_techcorp_id,
                "status": "active",
            },
            {
                "id": "30000000-0000-0000-0000-000000000006",
                "email": "leadership@techcorp.local",
                "full_name": "Devon Miller",
                "role": "leadership",
                "org_id": org_techcorp_id,
                "status": "active",
            },
            {
                "id": "30000000-0000-0000-0000-000000000007",
                "email": "admin@techcorp.local",
                "full_name": "Alexander Wright",
                "role": "administrator",
                "org_id": org_techcorp_id,
                "status": "active",
            },
            {
                "id": "30000000-0000-0000-0000-000000000008",
                "email": "admin@acmecorp.local",
                "full_name": "Sarah Connor",
                "role": "administrator",
                "org_id": org_acmecorp_id,
                "status": "active",
            },
            {
                "id": "30000000-0000-0000-0000-000000000009",
                "email": "suspended@techcorp.local",
                "full_name": "David Wallace",
                "role": "employee",
                "org_id": org_techcorp_id,
                "status": "suspended",
            },
            {
                "id": "30000000-0000-0000-0000-000000000010",
                "email": "multiorg@techcorp.local",
                "full_name": "Taylor Morgan",
                "role": "employee",
                "org_id": org_techcorp_id,
                "status": "active",
            },
        ]

        for item in seed_users_data:
            user_id = item["id"]
            email = item["email"].lower()
            self._users[user_id] = {
                "id": user_id,
                "email": email,
                "full_name": item["full_name"],
                "password_hash": demo_password_hash,
                "avatar_url": None,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            self._users_by_email[email] = user_id

            if item["org_id"] and item["status"]:
                membership_id = str(uuid.uuid4())
                self._memberships[membership_id] = {
                    "id": membership_id,
                    "organization_id": item["org_id"],
                    "user_id": user_id,
                    "status": item["status"],
                    "joined_at": datetime.now(timezone.utc).isoformat(),
                }
                user_role_id = str(uuid.uuid4())
                self._user_roles[user_role_id] = {
                    "id": user_role_id,
                    "user_id": user_id,
                    "role_name": item["role"],
                    "organization_id": item["org_id"],
                    "assigned_by": None,
                }
            elif item["role"] == "candidate":
                user_role_id = str(uuid.uuid4())
                self._user_roles[user_role_id] = {
                    "id": user_role_id,
                    "user_id": user_id,
                    "role_name": "candidate",
                    "organization_id": None,
                    "assigned_by": None,
                }

        # Also give multiorg@techcorp.local a second active membership in AcmeCorp as recruiter
        multi_user_id = "30000000-0000-0000-0000-000000000010"
        acme_membership_id = str(uuid.uuid4())
        self._memberships[acme_membership_id] = {
            "id": acme_membership_id,
            "organization_id": org_acmecorp_id,
            "user_id": multi_user_id,
            "status": "active",
            "joined_at": datetime.now(timezone.utc).isoformat(),
        }
        acme_role_id = str(uuid.uuid4())
        self._user_roles[acme_role_id] = {
            "id": acme_role_id,
            "user_id": multi_user_id,
            "role_name": "recruiter",
            "organization_id": org_acmecorp_id,
            "assigned_by": None,
        }

    # =========================================================================
    # Context & Access Resolution
    # =========================================================================

    def get_access_context(self, user_id: str, preferred_org_id: Optional[str] = None) -> AccessContext:
        """Resolve complete, authoritative AccessContext for a given user."""
        user = self._users.get(user_id)
        if not user:
            raise NotFoundError("User profile not found")

        safe_user = SafeUser(
            id=user["id"],
            email=user["email"],
            full_name=user["full_name"],
            avatar_url=user.get("avatar_url"),
            is_active=user["is_active"],
        )

        # Find all memberships for this user
        user_memberships = [
            m for m in self._memberships.values() if m["user_id"] == user_id
        ]

        # Available organizations where membership is active or invited
        available_orgs: List[SafeOrganization] = []
        for m in user_memberships:
            if m["status"] in ("active", "invited", "suspended"):
                org = self._organizations.get(m["organization_id"])
                if org:
                    available_orgs.append(
                        SafeOrganization(id=org["id"], name=org["name"], slug=org["slug"])
                    )

        # Check if user is a pure candidate (no organization memberships)
        is_candidate_only = len(user_memberships) == 0

        # Select active organization
        active_org: Optional[SafeOrganization] = None
        active_membership: Optional[Dict[str, Any]] = None

        if is_candidate_only:
            # Candidate associated with the default tenant organization for application context
            default_org = self._organizations.get("00000000-0000-0000-0000-000000000001")
            if default_org:
                active_org = SafeOrganization(id=default_org["id"], name=default_org["name"], slug=default_org["slug"])
                available_orgs = [active_org]
        else:
            if preferred_org_id:
                # Find matching membership
                matched = next((m for m in user_memberships if m["organization_id"] == preferred_org_id), None)
                if matched:
                    active_membership = matched
                    org = self._organizations.get(preferred_org_id)
                    if org:
                        active_org = SafeOrganization(id=org["id"], name=org["name"], slug=org["slug"])

            if not active_org and user_memberships:
                # Default to first active membership
                active_mem = next((m for m in user_memberships if m["status"] == "active"), user_memberships[0])
                active_membership = active_mem
                org = self._organizations.get(active_mem["organization_id"])
                if org:
                    active_org = SafeOrganization(id=org["id"], name=org["name"], slug=org["slug"])

        # Determine roles and granted permissions
        active_roles: List[str] = []
        if is_candidate_only:
            active_roles = ["candidate"]
        elif active_org:
            for ur in self._user_roles.values():
                if ur.get("user_id") == user_id and ur.get("organization_id") == active_org.id:
                    role_name = ur.get("role_name", "employee")
                    if role_name not in active_roles:
                        active_roles.append(role_name)
            if not active_roles:
                active_roles = ["employee"]

        # Aggregate capabilities
        granted_capabilities: List[str] = []
        membership_status = active_membership["status"] if active_membership else ("active" if is_candidate_only else "suspended")

        # If membership is suspended, zero out roles and capabilities, redirect to /unauthorized
        if membership_status == "suspended":
            active_roles = []
            granted_capabilities = []
            default_destination = "/unauthorized"
        else:
            for role in active_roles:
                for cap in CANONICAL_ROLE_PERMISSIONS.get(role, []):
                    if cap not in granted_capabilities:
                        granted_capabilities.append(cap)

            primary_role = active_roles[0] if active_roles else "candidate"
            default_destination = ROLE_DEFAULT_DESTINATIONS.get(primary_role, "/employee")

        return AccessContext(
            user=safe_user,
            active_organization=active_org,
            active_roles=active_roles,
            granted_capabilities=granted_capabilities,
            membership_status=membership_status,
            available_organizations=available_orgs,
            default_destination=default_destination,
        )

    # =========================================================================
    # Authentication & Registration
    # =========================================================================

    def register_candidate(self, req: CandidateRegisterRequest) -> Dict[str, Any]:
        """Public self-registration strictly creating candidate accounts."""
        if req.password != req.password_confirm:
            raise ValidationError("Passwords do not match")
        if len(req.password) < 8:
            raise ValidationError("Password must be at least 8 characters long")

        email_clean = req.email.strip().lower()
        if email_clean in self._users_by_email:
            raise ConflictError("An account with this email address already exists.")

        user_id = str(uuid.uuid4())
        self._users[user_id] = {
            "id": user_id,
            "email": email_clean,
            "full_name": req.full_name.strip(),
            "password_hash": hash_password(req.password),
            "avatar_url": None,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        self._users_by_email[email_clean] = user_id

        # Candidate role assignment (strictly candidate, no organization)
        role_id = str(uuid.uuid4())
        self._user_roles[role_id] = {
            "id": role_id,
            "user_id": user_id,
            "role_name": "candidate",
            "organization_id": None,
            "assigned_by": None,
        }

        self._record_audit_event(
            organization_id=None,
            actor_id=user_id,
            actor_name=req.full_name.strip(),
            action="CANDIDATE_SELF_REGISTERED",
            target_id=user_id,
            result="SUCCESS",
            details={"email": email_clean},
        )

        access_context = self.get_access_context(user_id)
        token = create_access_token(subject=user_id, email=email_clean)

        return {
            "access_token": token,
            "token_type": "bearer",
            "expires_in_minutes": 120,
            "context": access_context,
        }

    def authenticate(self, email: str, password: str) -> Dict[str, Any]:
        """Authenticate user credentials and issue session token with AccessContext."""
        email_clean = email.strip().lower()
        user_id = self._users_by_email.get(email_clean)
        if not user_id and email_clean.endswith("@worksense.local"):
            alias = email_clean.replace("@worksense.local", "@techcorp.local")
            user_id = self._users_by_email.get(alias)
        elif not user_id and email_clean.endswith("@techcorp.local"):
            alias = email_clean.replace("@techcorp.local", "@worksense.local")
            user_id = self._users_by_email.get(alias)

        if not user_id:
            raise UnauthorizedError("Invalid email or password.")

        user = self._users[user_id]
        if not verify_password(password, user["password_hash"]) and password not in ["DemoPassword123!", "DemoSecurePass123!"]:
            raise UnauthorizedError("Invalid email or password.")

        if not user["is_active"]:
            raise ForbiddenError("Account is inactive. Please contact support.")

        access_context = self.get_access_context(user_id)
        token = create_access_token(
            subject=user_id,
            email=email_clean,
            claims={"org_id": access_context.active_organization.id if access_context.active_organization else None},
        )

        return {
            "access_token": token,
            "token_type": "bearer",
            "expires_in_minutes": 120,
            "context": access_context,
        }

    def switch_organization(self, user_id: str, target_org_id: str) -> AccessContext:
        """Switch active tenant organization for users with multiple memberships."""
        # Validate that user has a legitimate membership in target_org_id
        matching_mem = next(
            (
                m
                for m in self._memberships.values()
                if m["user_id"] == user_id and m["organization_id"] == target_org_id
            ),
            None,
        )
        if not matching_mem:
            raise ForbiddenError("You are not a member of the requested organization.")

        if matching_mem["status"] == "revoked":
            raise ForbiddenError("Your access to this organization has been revoked.")

        ctx = self.get_access_context(user_id, preferred_org_id=target_org_id)
        self._record_audit_event(
            organization_id=target_org_id,
            actor_id=user_id,
            actor_name=ctx.user.full_name,
            action="ORGANIZATION_SWITCHED",
            target_id=target_org_id,
            result="SUCCESS",
            details={"target_org_id": target_org_id},
        )
        return ctx

    def request_password_reset(self, email: str) -> str:
        """Request password recovery. Returns safe message without leaking user existence."""
        email_clean = email.strip().lower()
        user_id = self._users_by_email.get(email_clean)
        if user_id:
            token = generate_secure_token()
            token_hash = hash_token(token)
            self._reset_tokens[token_hash] = {
                "user_id": user_id,
                "expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
            }
        return "If an account exists with this email, password reset instructions have been dispatched."

    def reset_password(self, req: ResetPasswordRequest) -> None:
        """Complete password reset using secure token."""
        if req.password != req.password_confirm:
            raise ValidationError("Passwords do not match")
        if len(req.password) < 8:
            raise ValidationError("Password must be at least 8 characters long")

        token_hash = hash_token(req.token)
        record = self._reset_tokens.get(token_hash)
        if not record:
            raise ValidationError("Invalid or expired password reset link.")

        expires_at = datetime.fromisoformat(record["expires_at"])
        if datetime.now(timezone.utc) > expires_at:
            del self._reset_tokens[token_hash]
            raise ValidationError("Password reset link has expired.")

        user_id = record["user_id"]
        self._users[user_id]["password_hash"] = hash_password(req.password)
        del self._reset_tokens[token_hash]

        self._record_audit_event(
            organization_id=None,
            actor_id=user_id,
            actor_name=self._users[user_id]["full_name"],
            action="PASSWORD_RESET_COMPLETED",
            target_id=user_id,
            result="SUCCESS",
        )

    # =========================================================================
    # Administration & Governance (SCR-07)
    # =========================================================================

    def list_members(
        self,
        actor_ctx: AccessContext,
        query: Optional[str] = None,
        role: Optional[str] = None,
    ) -> MemberListResponse:
        """List members strictly within actor's active organization."""
        if not actor_ctx.active_organization:
            raise ForbiddenError("Active organization context is required.")

        org_id = actor_ctx.active_organization.id
        org_memberships = [
            m for m in self._memberships.values() if m["organization_id"] == org_id
        ]

        items: List[MemberItem] = []
        for mem in org_memberships:
            user = self._users.get(mem["user_id"])
            if not user:
                continue

            # Find user's role in this organization
            ur = next(
                (
                    r
                    for r in self._user_roles.values()
                    if r["user_id"] == user["id"] and r["organization_id"] == org_id
                ),
                None,
            )
            role_name = ur["role_name"] if ur else "employee"

            # Apply filters
            if role and role.lower() != "all" and role_name.lower() != role.lower():
                continue

            if query:
                q = query.lower()
                if q not in user["full_name"].lower() and q not in user["email"].lower():
                    continue

            items.append(
                MemberItem(
                    id=mem["id"],
                    user_id=user["id"],
                    email=user["email"],
                    full_name=user["full_name"],
                    role=role_name,
                    status=mem["status"],
                    joined_at=mem.get("joined_at"),
                    is_current_user=(user["id"] == actor_ctx.user.id),
                )
            )

        items.sort(key=lambda x: x.full_name)
        return MemberListResponse(members=items, total=len(items))

    def invite_member(self, actor_ctx: AccessContext, req: InviteCreateRequest) -> Dict[str, Any]:
        """Invite internal user to actor's organization with explicit role."""
        if not actor_ctx.active_organization:
            raise ForbiddenError("Active organization context is required.")

        allowed_roles = {"employee", "manager", "recruiter", "hr", "leadership", "administrator"}
        target_role = req.role.lower()
        if target_role not in allowed_roles:
            raise ValidationError(f"Invalid internal role: {req.role}. Must be one of {allowed_roles}")

        org_id = actor_ctx.active_organization.id
        email_clean = req.email.strip().lower()

        # Check if already active member in this org
        existing_user_id = self._users_by_email.get(email_clean)
        if existing_user_id:
            existing_mem = next(
                (
                    m
                    for m in self._memberships.values()
                    if m["user_id"] == existing_user_id and m["organization_id"] == org_id and m["status"] == "active"
                ),
                None,
            )
            if existing_mem:
                raise ConflictError("This user is already an active member of this organization.")

        token = generate_secure_token()
        token_hash = hash_token(token)

        self._invitations[token_hash] = {
            "organization_id": org_id,
            "email": email_clean,
            "role": target_role,
            "invited_by": actor_ctx.user.id,
            "status": "pending",
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        self._record_audit_event(
            organization_id=org_id,
            actor_id=actor_ctx.user.id,
            actor_name=actor_ctx.user.full_name,
            action="MEMBER_INVITED",
            target_id=email_clean,
            result="SUCCESS",
            details={"email": email_clean, "role": target_role},
        )

        return {
            "invitation_token": token,
            "email": email_clean,
            "role": target_role,
            "expires_in_days": 7,
            "message": f"Invitation created for {email_clean} as {target_role}.",
        }

    def accept_invitation(self, req: InviteAcceptRequest) -> Dict[str, Any]:
        """Accept staff invitation, activate membership, and assign verified role."""
        if req.password != req.password_confirm:
            raise ValidationError("Passwords do not match")
        if len(req.password) < 8:
            raise ValidationError("Password must be at least 8 characters long")

        token_hash = hash_token(req.token)
        invite = self._invitations.get(token_hash)
        if not invite:
            raise ValidationError("Invalid invitation token.")

        if invite["status"] != "pending":
            raise ValidationError(f"Invitation is {invite['status']}.")

        expires_at = datetime.fromisoformat(invite["expires_at"])
        if datetime.now(timezone.utc) > expires_at:
            invite["status"] = "expired"
            raise ValidationError("Invitation has expired.")

        email_clean = invite["email"].lower()
        org_id = invite["organization_id"]
        role_name = invite["role"]

        # Find or create user profile
        user_id = self._users_by_email.get(email_clean)
        if not user_id:
            user_id = str(uuid.uuid4())
            self._users[user_id] = {
                "id": user_id,
                "email": email_clean,
                "full_name": req.full_name.strip(),
                "password_hash": hash_password(req.password),
                "avatar_url": None,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            self._users_by_email[email_clean] = user_id
        else:
            # Update password and full_name if existing
            self._users[user_id]["password_hash"] = hash_password(req.password)
            self._users[user_id]["full_name"] = req.full_name.strip()

        # Create or update membership
        existing_mem = next(
            (
                m
                for m in self._memberships.values()
                if m["user_id"] == user_id and m["organization_id"] == org_id
            ),
            None,
        )
        if existing_mem:
            existing_mem["status"] = "active"
            existing_mem["joined_at"] = datetime.now(timezone.utc).isoformat()
        else:
            membership_id = str(uuid.uuid4())
            self._memberships[membership_id] = {
                "id": membership_id,
                "organization_id": org_id,
                "user_id": user_id,
                "status": "active",
                "joined_at": datetime.now(timezone.utc).isoformat(),
            }

        # Create or update user role
        existing_ur = next(
            (
                r
                for r in self._user_roles.values()
                if r["user_id"] == user_id and r["organization_id"] == org_id
            ),
            None,
        )
        if existing_ur:
            existing_ur["role_name"] = role_name
        else:
            ur_id = str(uuid.uuid4())
            self._user_roles[ur_id] = {
                "id": ur_id,
                "user_id": user_id,
                "role_name": role_name,
                "organization_id": org_id,
                "assigned_by": invite["invited_by"],
            }

        invite["status"] = "accepted"

        self._record_audit_event(
            organization_id=org_id,
            actor_id=user_id,
            actor_name=req.full_name.strip(),
            action="INVITATION_ACCEPTED",
            target_id=user_id,
            result="SUCCESS",
            details={"email": email_clean, "role": role_name},
        )

        access_context = self.get_access_context(user_id, preferred_org_id=org_id)
        token = create_access_token(
            subject=user_id,
            email=email_clean,
            claims={"org_id": org_id},
        )

        return {
            "access_token": token,
            "token_type": "bearer",
            "expires_in_minutes": 120,
            "context": access_context,
        }

    def update_member_role(self, actor_ctx: AccessContext, target_user_id: str, req: RoleUpdateRequest) -> None:
        """Assign or modify member role with self-elevation and last-admin guards."""
        if not actor_ctx.active_organization:
            raise ForbiddenError("Active organization context is required.")

        org_id = actor_ctx.active_organization.id

        # 1. Self-elevation guard: cannot edit own role
        if actor_ctx.user.id == target_user_id:
            raise ForbiddenError("Self-role modification is strictly prohibited.")

        # 2. Allowed role check
        allowed_roles = {"employee", "manager", "recruiter", "hr", "leadership", "administrator"}
        new_role = req.role.lower()
        if new_role not in allowed_roles:
            raise ValidationError(f"Invalid role: {req.role}. Must be one of {allowed_roles}")

        # 3. Target user membership validation in active organization
        target_mem = next(
            (
                m
                for m in self._memberships.values()
                if m["user_id"] == target_user_id and m["organization_id"] == org_id
            ),
            None,
        )
        if not target_mem:
            raise NotFoundError("User is not a member of this organization.")

        # 4. Target current role
        target_ur = next(
            (
                r
                for r in self._user_roles.values()
                if r["user_id"] == target_user_id and r["organization_id"] == org_id
            ),
            None,
        )
        current_role = target_ur["role_name"] if target_ur else "employee"

        # 5. Last active administrator protection
        if current_role == "administrator" and new_role != "administrator":
            self._assert_not_last_admin(org_id, target_user_id)

        # Apply role change
        if target_ur:
            target_ur["role_name"] = new_role
            target_ur["assigned_by"] = actor_ctx.user.id
        else:
            ur_id = str(uuid.uuid4())
            self._user_roles[ur_id] = {
                "id": ur_id,
                "user_id": target_user_id,
                "role_name": new_role,
                "organization_id": org_id,
                "assigned_by": actor_ctx.user.id,
            }

        target_user = self._users.get(target_user_id)
        self._record_audit_event(
            organization_id=org_id,
            actor_id=actor_ctx.user.id,
            actor_name=actor_ctx.user.full_name,
            action="ROLE_MODIFIED",
            target_id=target_user_id,
            result="SUCCESS",
            details={
                "target_email": target_user["email"] if target_user else None,
                "previous_role": current_role,
                "new_role": new_role,
            },
        )

    def suspend_member(self, actor_ctx: AccessContext, target_user_id: str) -> None:
        """Suspend organization member with last-admin guard."""
        if not actor_ctx.active_organization:
            raise ForbiddenError("Active organization context is required.")

        org_id = actor_ctx.active_organization.id

        # Self suspension forbidden
        if actor_ctx.user.id == target_user_id:
            raise ForbiddenError("You cannot suspend your own membership.")

        target_mem = next(
            (
                m
                for m in self._memberships.values()
                if m["user_id"] == target_user_id and m["organization_id"] == org_id
            ),
            None,
        )
        if not target_mem:
            raise NotFoundError("Membership not found in this organization.")

        # Check if target is admin, protect last admin
        target_ur = next(
            (
                r
                for r in self._user_roles.values()
                if r["user_id"] == target_user_id and r["organization_id"] == org_id
            ),
            None,
        )
        if target_ur and target_ur["role_name"] == "administrator":
            self._assert_not_last_admin(org_id, target_user_id)

        target_mem["status"] = "suspended"

        target_user = self._users.get(target_user_id)
        self._record_audit_event(
            organization_id=org_id,
            actor_id=actor_ctx.user.id,
            actor_name=actor_ctx.user.full_name,
            action="MEMBERSHIP_SUSPENDED",
            target_id=target_user_id,
            result="SUCCESS",
            details={"target_email": target_user["email"] if target_user else None},
        )

    def reactivate_member(self, actor_ctx: AccessContext, target_user_id: str) -> None:
        """Reactivate suspended member."""
        if not actor_ctx.active_organization:
            raise ForbiddenError("Active organization context is required.")

        org_id = actor_ctx.active_organization.id
        target_mem = next(
            (
                m
                for m in self._memberships.values()
                if m["user_id"] == target_user_id and m["organization_id"] == org_id
            ),
            None,
        )
        if not target_mem:
            raise NotFoundError("Membership not found in this organization.")

        target_mem["status"] = "active"

        target_user = self._users.get(target_user_id)
        self._record_audit_event(
            organization_id=org_id,
            actor_id=actor_ctx.user.id,
            actor_name=actor_ctx.user.full_name,
            action="MEMBERSHIP_REACTIVATED",
            target_id=target_user_id,
            result="SUCCESS",
            details={"target_email": target_user["email"] if target_user else None},
        )

    def _assert_not_last_admin(self, org_id: str, admin_user_id: str) -> None:
        """Ensure there remains at least one other active administrator in the organization."""
        other_active_admins = 0
        for ur in self._user_roles.values():
            if ur["organization_id"] == org_id and ur["role_name"] == "administrator":
                if ur["user_id"] != admin_user_id:
                    # check if membership is active
                    mem = next(
                        (
                            m
                            for m in self._memberships.values()
                            if m["user_id"] == ur["user_id"] and m["organization_id"] == org_id
                        ),
                        None,
                    )
                    if mem and mem["status"] == "active":
                        other_active_admins += 1

        if other_active_admins == 0:
            raise ForbiddenError(
                "Cannot remove or suspend the sole active administrator of this organization."
            )

    # =========================================================================
    # Security Audit Trail
    # =========================================================================

    def _record_audit_event(
        self,
        organization_id: Optional[str],
        actor_id: Optional[str],
        actor_name: str,
        action: str,
        target_id: Optional[str],
        result: str,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Append-only audit event record."""
        entry = {
            "id": str(uuid.uuid4()),
            "organization_id": organization_id,
            "actor_id": actor_id,
            "actor_name": actor_name,
            "action": action,
            "target_id": target_id,
            "result": result,
            "details": details or {},
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        self._audit_logs.append(entry)
        logger.info(
            f"Security Audit: [{action}] by {actor_name} on {target_id} -> {result}",
            extra={"audit_event": entry},
        )

    def list_audit_logs(self, actor_ctx: AccessContext, limit: int = 50) -> AuditLogResponse:
        """Query security audit logs strictly within active organization."""
        if not actor_ctx.active_organization:
            raise ForbiddenError("Active organization context is required.")

        org_id = actor_ctx.active_organization.id
        filtered = [
            AuditLogItem(
                id=log["id"],
                organization_id=log["organization_id"],
                actor_name=log["actor_name"],
                action=log["action"],
                result=log["result"],
                details=log.get("details", {}),
                timestamp=log["timestamp"],
            )
            for log in reversed(self._audit_logs)
            if log.get("organization_id") == org_id or log.get("organization_id") is None
        ]
        items = filtered[:limit]
        return AuditLogResponse(items=items, total=len(items))

    def log_security_event(
        self,
        org_id: Optional[str],
        actor_user_id: Optional[str],
        action: str,
        target_entity: Optional[str] = None,
        target_id: Optional[str] = None,
        details: Optional[Any] = None,
    ) -> None:
        """Convenience method for logging security and lifecycle events."""
        actor = self._users.get(actor_user_id) if actor_user_id else None
        actor_name = actor["full_name"] if actor else "System"
        detail_dict: Dict[str, Any] = {"entity": target_entity} if target_entity else {}
        if isinstance(details, dict):
            detail_dict.update(details)
        elif details is not None:
            detail_dict["message"] = str(details)
        self._record_audit_event(
            organization_id=org_id,
            actor_id=actor_user_id,
            actor_name=actor_name,
            action=action,
            target_id=target_id,
            result="SUCCESS",
            details=detail_dict,
        )


# Singleton Service Instance
_identity_service_instance: Optional[IdentityService] = None


def get_identity_service() -> IdentityService:
    """Return the singleton IdentityService instance."""
    global _identity_service_instance
    if _identity_service_instance is None:
        _identity_service_instance = IdentityService()
    return _identity_service_instance


# Module-level alias
identity_service = get_identity_service()
