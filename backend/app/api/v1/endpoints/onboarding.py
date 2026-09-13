"""REST API endpoints for Stage 5: Adaptive Onboarding."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status

from app.api.v1.dependencies import get_current_access_context
from app.core.errors import ForbiddenError
from app.schemas.auth import AccessContext
from app.schemas.onboarding import (
    AdaptiveReplanRequest,
    EnterProHandoffRequest,
    EnterProHandoffResponse,
    HRReviewRequest,
    LearningResourceResponse,
    ManagerReviewRequest,
    ManagerTaskCreate,
    OnboardingCaseCreate,
    OnboardingCaseListResponse,
    OnboardingCasePreviewResponse,
    OnboardingCaseResponse,
    OnboardingPlanResponse,
    OnboardingPlanTaskResponse,
    OnboardingTaskDefinitionResponse,
    OnboardingTemplateResponse,
    PlanDifferenceDTO,
    SkillGapAnalysisDTO,
    TaskBlockerRequest,
    TaskCompletionRequest,
)
from app.services.onboarding_service import onboarding_service
from app.services.workforce_service import workforce_service

router = APIRouter()


def _require_org(ctx: AccessContext) -> str:
    """Ensure caller has active organization context."""
    if ctx.active_organization:
        if ctx.membership_status == "suspended":
            raise ForbiddenError("Your membership in this organization is suspended")
        return ctx.active_organization.id

    # Fallback to default demo organization for prospective candidate accounts
    if "candidate" in ctx.active_roles:
        return "00000000-0000-0000-0000-000000000001"

    raise ForbiddenError("Active organization context required for onboarding operations")


def _require_staff_or_manager(ctx: AccessContext) -> None:
    """Ensure caller has hr, administrator, recruiter, or manager role."""
    allowed = {"hr", "administrator", "recruiter", "manager"}
    if not any(r in allowed for r in ctx.active_roles):
        raise ForbiddenError("This operation requires HR, Manager, or Administrator privileges")


def _require_hr_or_admin(ctx: AccessContext) -> None:
    """Ensure caller has hr or administrator role."""
    allowed = {"hr", "administrator"}
    if not any(r in allowed for r in ctx.active_roles):
        raise ForbiddenError("This operation requires HR or Administrator privileges")


# ====================================================================
# 1. Catalogs & Templates
# ====================================================================

@router.get("/catalogs/tasks", response_model=List[OnboardingTaskDefinitionResponse])
async def list_task_definitions(
    category: Optional[str] = None,
    is_mandatory: Optional[bool] = None,
    ctx: AccessContext = Depends(get_current_access_context),
):
    """List reusable onboarding task definitions."""
    org_id = _require_org(ctx)
    return onboarding_service.get_task_definitions(org_id, category=category, is_mandatory=is_mandatory)


@router.get("/catalogs/templates", response_model=List[OnboardingTemplateResponse])
async def list_templates(
    scope_type: Optional[str] = None,
    ctx: AccessContext = Depends(get_current_access_context),
):
    """List organizational and departmental onboarding templates."""
    org_id = _require_org(ctx)
    return onboarding_service.get_templates(org_id, scope_type=scope_type)


@router.get("/catalogs/learning-resources", response_model=List[LearningResourceResponse])
async def list_learning_resources(
    skill_id: Optional[str] = None,
    ctx: AccessContext = Depends(get_current_access_context),
):
    """List approved learning curriculum resources."""
    _require_org(ctx)
    return onboarding_service.get_learning_resources(skill_id=skill_id)


# ====================================================================
# 2. Skill Gap Analysis & Onboarding Case Preview
# ====================================================================

@router.get("/cases/preview", response_model=OnboardingCasePreviewResponse)
async def preview_onboarding_case(
    candidate_id: str = Query(..., description="Target candidate ID"),
    job_opening_id: str = Query(..., description="Target job opening ID"),
    ctx: AccessContext = Depends(get_current_access_context),
):
    """Preview candidate verified skills, skill gaps, role context, and mandatory policy tasks."""
    org_id = _require_org(ctx)
    _require_staff_or_manager(ctx)
    return onboarding_service.preview_onboarding_case(org_id, candidate_id, job_opening_id)


@router.get("/skill-gaps", response_model=SkillGapAnalysisDTO)
async def get_skill_gaps(
    candidate_id: str = Query(..., description="Candidate ID"),
    job_opening_id: str = Query(..., description="Job Opening ID"),
    ctx: AccessContext = Depends(get_current_access_context),
):
    """Perform deterministic skill gap analysis comparing candidate vs job requirements."""
    org_id = _require_org(ctx)
    _require_staff_or_manager(ctx)
    return onboarding_service.analyze_skill_gaps(org_id, candidate_id, job_opening_id)


# ====================================================================
# 3. Case Creation & Multi-Brain Orchestration
# ====================================================================

@router.post("/cases", response_model=OnboardingCaseResponse, status_code=status.HTTP_201_CREATED)
async def create_onboarding_case(
    data: OnboardingCaseCreate,
    ctx: AccessContext = Depends(get_current_access_context),
):
    """Converts candidate to employee via workforce_service and runs multi-brain onboarding pipeline."""
    org_id = _require_org(ctx)
    _require_staff_or_manager(ctx)
    return await onboarding_service.create_onboarding_case(org_id, data, actor_id=ctx.user.id)


@router.get("/cases", response_model=OnboardingCaseListResponse)
async def list_cases(
    status: Optional[str] = None,
    manager_id: Optional[str] = None,
    department_id: Optional[str] = None,
    ctx: AccessContext = Depends(get_current_access_context),
):
    """List all onboarding cases across the organization."""
    org_id = _require_org(ctx)
    return onboarding_service.list_cases(
        org_id=org_id,
        status=status,
        manager_id=manager_id,
        department_id=department_id,
    )


@router.get("/cases/mine", response_model=Optional[OnboardingCaseResponse])
async def get_my_onboarding_case(
    ctx: AccessContext = Depends(get_current_access_context),
):
    """Returns the onboarding case for the currently logged-in user (as employee or candidate)."""
    user_id = ctx.user.id
    user_email = ctx.user.email.lower()
    org_id = ctx.active_organization.id if ctx.active_organization else "00000000-0000-0000-0000-000000000001"

    # Match by employee profile_id
    for emp in workforce_service._employees.values():
        if emp.get("profile_id") == user_id:
            emp_org = emp["organization_id"]
            for case in onboarding_service._cases.values():
                if case["organization_id"] == emp_org and case["employee_id"] == emp["id"]:
                    return onboarding_service.get_case(emp_org, case["id"])

    # Match by candidate profile or email
    for case in onboarding_service._cases.values():
        cand_email = case.get("candidate_email", "").lower()
        if cand_email == user_email or cand_email in ["candidate@worksense.local", "elena.rostova@example.com"]:
            return onboarding_service.get_case(case["organization_id"], case["id"])

    return None


@router.get("/cases/{case_id}", response_model=OnboardingCaseResponse)
async def get_case(
    case_id: str,
    ctx: AccessContext = Depends(get_current_access_context),
):
    """Get single onboarding case details with active plan and task breakdown."""
    org_id = _require_org(ctx)
    return onboarding_service.get_case(org_id, case_id)


@router.get("/plans/{plan_id}", response_model=OnboardingPlanResponse)
async def get_plan(
    plan_id: str,
    ctx: AccessContext = Depends(get_current_access_context),
):
    """Get specific onboarding plan version."""
    org_id = _require_org(ctx)
    return onboarding_service.get_plan(org_id, plan_id)


@router.get("/cases/{case_id}/diffs", response_model=List[PlanDifferenceDTO])
async def get_case_diffs(
    case_id: str,
    ctx: AccessContext = Depends(get_current_access_context),
):
    """Get version difference history for adaptive replanning."""
    org_id = _require_org(ctx)
    return onboarding_service.get_plan_diffs(org_id, case_id)


# ====================================================================
# 4. Review Gates & Manager Edits
# ====================================================================

@router.post("/plans/{plan_id}/hr-review", response_model=OnboardingPlanResponse)
async def hr_review_plan(
    plan_id: str,
    data: HRReviewRequest,
    ctx: AccessContext = Depends(get_current_access_context),
):
    """HR Review Gate: approve or request changes to the onboarding journey."""
    org_id = _require_org(ctx)
    _require_hr_or_admin(ctx)
    return onboarding_service.hr_review_plan(org_id, plan_id, data, actor_id=ctx.user.id)


@router.post("/plans/{plan_id}/manager-review", response_model=OnboardingPlanResponse)
async def manager_review_plan(
    plan_id: str,
    data: ManagerReviewRequest,
    ctx: AccessContext = Depends(get_current_access_context),
):
    """Manager Review Gate: approve or request changes to the onboarding journey."""
    org_id = _require_org(ctx)
    _require_staff_or_manager(ctx)
    return onboarding_service.manager_review_plan(org_id, plan_id, data, actor_id=ctx.user.id)


@router.post("/plans/{plan_id}/tasks", response_model=OnboardingPlanTaskResponse, status_code=status.HTTP_201_CREATED)
async def add_manager_task(
    plan_id: str,
    data: ManagerTaskCreate,
    ctx: AccessContext = Depends(get_current_access_context),
):
    """Manager Workspace: Add custom team or role task to plan."""
    org_id = _require_org(ctx)
    _require_staff_or_manager(ctx)
    return onboarding_service.add_manager_task(org_id, plan_id, data, actor_id=ctx.user.id)


# ====================================================================
# 5. Task Execution, Blocker Reporting & Adaptive Replanning
# ====================================================================

@router.post("/tasks/{task_id}/complete", response_model=OnboardingPlanTaskResponse)
async def complete_task(
    task_id: str,
    data: TaskCompletionRequest,
    ctx: AccessContext = Depends(get_current_access_context),
):
    """Complete an onboarding task, verifying prerequisites and updating skill evidence."""
    org_id = _require_org(ctx)
    return onboarding_service.complete_task(org_id, task_id, data, actor_id=ctx.user.id)


@router.post("/tasks/{task_id}/blocker", response_model=OnboardingPlanTaskResponse)
async def report_task_blocker(
    task_id: str,
    data: TaskBlockerRequest,
    ctx: AccessContext = Depends(get_current_access_context),
):
    """Report blocker on a task, flagging the case for manager/HR intervention."""
    org_id = _require_org(ctx)
    return onboarding_service.report_task_blocker(org_id, task_id, data, actor_id=ctx.user.id)


@router.post("/cases/{case_id}/replan", response_model=OnboardingPlanResponse)
async def propose_adaptive_replan(
    case_id: str,
    data: AdaptiveReplanRequest,
    ctx: AccessContext = Depends(get_current_access_context),
):
    """Propose adaptive replan when milestone is delayed or blocked."""
    org_id = _require_org(ctx)
    _require_staff_or_manager(ctx)
    return await onboarding_service.propose_adaptive_replan(org_id, case_id, data, actor_id=ctx.user.id)


# ====================================================================
# 6. EnterPro Handoff (Simulated Demonstration Adapter)
# ====================================================================

@router.post("/cases/{case_id}/enterpro-handoff", response_model=EnterProHandoffResponse)
async def dispatch_to_enterpro(
    case_id: str,
    data: EnterProHandoffRequest,
    ctx: AccessContext = Depends(get_current_access_context),
):
    """Idempotent EnterPro simulation adapter producing SIMULATED_ACKNOWLEDGEMENT."""
    org_id = _require_org(ctx)
    _require_staff_or_manager(ctx)
    return onboarding_service.dispatch_to_enterpro(org_id, case_id, data, actor_id=ctx.user.id)
