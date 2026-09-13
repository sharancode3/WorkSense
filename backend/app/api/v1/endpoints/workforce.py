"""FastAPI REST routes for Stage 3 Core Workforce Data Layer."""

import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query

from app.api.v1.dependencies import get_current_access_context
from app.core.errors import ForbiddenError
from app.schemas.auth import AccessContext
from app.schemas.workforce import (
    AttendanceSummaryCreate,
    AttendanceSummaryResponse,
    CandidateConversionPreviewResponse,
    CandidateConversionRequest,
    CandidateConversionResponse,
    CandidateProfileCreate,
    CandidateProfileResponse,
    CandidateProfileUpdate,
    CandidateTwinResponse,
    DataQualitySummaryResponse,
    DepartmentCreate,
    DepartmentResponse,
    DepartmentTreeItem,
    DepartmentUpdate,
    EmployeeProfileCreate,
    EmployeeProfileResponse,
    EmployeeProfileUpdate,
    EmployeeTwinResponse,
    EvidenceItemCreate,
    EvidenceItemResponse,
    FeedbackCreate,
    FeedbackResponse,
    GoalCreate,
    GoalResponse,
    GoalUpdate,
    JobRoleCreate,
    JobRoleResponse,
    JobRoleUpdate,
    PersonSkillCreate,
    PersonSkillResponse,
    PolicyDocumentCreate,
    PolicyDocumentResponse,
    PolicyVersionCreate,
    PolicyVersionResponse,
    RoleSkillRequirementCreate,
    RoleSkillRequirementDTO,
    SkillCreate,
    SkillGraphResponse,
    SkillRelationshipCreate,
    SkillRelationshipDTO,
    SkillResponse,
    SourceCreate,
    SourceResponse,
)
from app.services.workforce_service import workforce_service

router = APIRouter(prefix="/workforce", tags=["Workforce Data Layer"])
logger = logging.getLogger("worksense.workforce.api")


def _require_org(ctx: AccessContext) -> str:
    """Helper ensuring caller has an active tenant organization context."""
    if not ctx.active_organization:
        raise ForbiddenError("An active organization context is required for workforce operations")
    if ctx.membership_status == "suspended":
        raise ForbiddenError("Your membership in this organization is suspended")
    return ctx.active_organization.id


# ====================================================================
# 1. Departments & Hierarchy
# ====================================================================

@router.get("/departments", response_model=List[DepartmentResponse])
async def list_departments(
    active_only: bool = Query(False),
    ctx: AccessContext = Depends(get_current_access_context),
) -> List[DepartmentResponse]:
    org_id = _require_org(ctx)
    return workforce_service.list_departments(org_id, active_only=active_only)


@router.post("/departments", response_model=DepartmentResponse, status_code=201)
async def create_department(
    data: DepartmentCreate,
    ctx: AccessContext = Depends(get_current_access_context),
) -> DepartmentResponse:
    org_id = _require_org(ctx)
    if not any(r in ("administrator", "hr") for r in ctx.active_roles):
        raise ForbiddenError("Only Administrators and HR can create departments")
    return workforce_service.create_department(org_id, data, actor_id=ctx.user.id)


@router.get("/departments/tree", response_model=List[DepartmentTreeItem])
async def get_department_tree(
    ctx: AccessContext = Depends(get_current_access_context),
) -> List[DepartmentTreeItem]:
    org_id = _require_org(ctx)
    return workforce_service.get_department_tree(org_id)


@router.get("/departments/{dept_id}", response_model=DepartmentResponse)
async def get_department(
    dept_id: str,
    ctx: AccessContext = Depends(get_current_access_context),
) -> DepartmentResponse:
    org_id = _require_org(ctx)
    return workforce_service.get_department(org_id, dept_id)


@router.patch("/departments/{dept_id}", response_model=DepartmentResponse)
async def update_department(
    dept_id: str,
    data: DepartmentUpdate,
    ctx: AccessContext = Depends(get_current_access_context),
) -> DepartmentResponse:
    org_id = _require_org(ctx)
    if not any(r in ("administrator", "hr") for r in ctx.active_roles):
        raise ForbiddenError("Only Administrators and HR can update departments")
    return workforce_service.update_department(org_id, dept_id, data, actor_id=ctx.user.id)


# ====================================================================
# 2. Job Roles & Requirements
# ====================================================================

@router.get("/job-roles", response_model=List[JobRoleResponse])
async def list_job_roles(
    department_id: Optional[str] = Query(None),
    active_only: bool = Query(True),
    ctx: AccessContext = Depends(get_current_access_context),
) -> List[JobRoleResponse]:
    org_id = _require_org(ctx)
    return workforce_service.list_job_roles(org_id, department_id=department_id, active_only=active_only)


@router.post("/job-roles", response_model=JobRoleResponse, status_code=201)
async def create_job_role(
    data: JobRoleCreate,
    ctx: AccessContext = Depends(get_current_access_context),
) -> JobRoleResponse:
    org_id = _require_org(ctx)
    if not any(r in ("administrator", "hr", "recruiter") for r in ctx.active_roles):
        raise ForbiddenError("Only Administrators, HR, and Recruiters can create job roles")
    return workforce_service.create_job_role(org_id, data, actor_id=ctx.user.id)


@router.get("/job-roles/{role_id}", response_model=JobRoleResponse)
async def get_job_role(
    role_id: str,
    ctx: AccessContext = Depends(get_current_access_context),
) -> JobRoleResponse:
    org_id = _require_org(ctx)
    return workforce_service.get_job_role(org_id, role_id)


@router.patch("/job-roles/{role_id}", response_model=JobRoleResponse)
async def update_job_role(
    role_id: str,
    data: JobRoleUpdate,
    ctx: AccessContext = Depends(get_current_access_context),
) -> JobRoleResponse:
    org_id = _require_org(ctx)
    if not any(r in ("administrator", "hr", "recruiter") for r in ctx.active_roles):
        raise ForbiddenError("Only Administrators, HR, and Recruiters can update job roles")
    return workforce_service.update_job_role(org_id, role_id, data, actor_id=ctx.user.id)


@router.post("/job-roles/{role_id}/skills", response_model=RoleSkillRequirementDTO)
async def add_skill_to_role(
    role_id: str,
    data: RoleSkillRequirementCreate,
    ctx: AccessContext = Depends(get_current_access_context),
) -> RoleSkillRequirementDTO:
    org_id = _require_org(ctx)
    if not any(r in ("administrator", "hr", "recruiter") for r in ctx.active_roles):
        raise ForbiddenError("Only Administrators, HR, and Recruiters can assign role skill requirements")
    return workforce_service.add_skill_to_role(org_id, role_id, data, actor_id=ctx.user.id)


# ====================================================================
# 3. Skills & Relational Skill Graph
# ====================================================================

@router.get("/skills", response_model=List[SkillResponse])
async def list_skills(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    ctx: AccessContext = Depends(get_current_access_context),
) -> List[SkillResponse]:
    return workforce_service.list_skills(category=category, search=search)


@router.post("/skills", response_model=SkillResponse, status_code=201)
async def create_skill(
    data: SkillCreate,
    ctx: AccessContext = Depends(get_current_access_context),
) -> SkillResponse:
    if not any(r in ("administrator", "hr") for r in ctx.active_roles):
        raise ForbiddenError("Only Administrators and HR can create canonical skills")
    return workforce_service.create_skill(data, actor_id=ctx.user.id)


@router.get("/skills/graph", response_model=SkillGraphResponse)
async def get_skill_graph(
    query: Optional[str] = Query(None),
    focused_skill_id: Optional[str] = Query(None),
    ctx: AccessContext = Depends(get_current_access_context),
) -> SkillGraphResponse:
    return workforce_service.get_skill_graph(query=query, focused_skill_id=focused_skill_id)


@router.get("/skills/{skill_id}", response_model=SkillResponse)
async def get_skill(
    skill_id: str,
    ctx: AccessContext = Depends(get_current_access_context),
) -> SkillResponse:
    return workforce_service.get_skill(skill_id)


@router.post("/skills/{skill_id}/relationships", response_model=SkillRelationshipDTO)
async def add_skill_relationship(
    skill_id: str,
    data: SkillRelationshipCreate,
    ctx: AccessContext = Depends(get_current_access_context),
) -> SkillRelationshipDTO:
    if not any(r in ("administrator", "hr") for r in ctx.active_roles):
        raise ForbiddenError("Only Administrators and HR can define skill graph relationships")
    return workforce_service.add_skill_relationship(skill_id, data, actor_id=ctx.user.id)


# ====================================================================
# 4. Sources & Evidence Ledger
# ====================================================================

@router.get("/sources", response_model=List[SourceResponse])
async def list_sources(
    ctx: AccessContext = Depends(get_current_access_context),
) -> List[SourceResponse]:
    org_id = _require_org(ctx)
    return workforce_service.list_sources(org_id)


@router.post("/sources", response_model=SourceResponse, status_code=201)
async def create_source(
    data: SourceCreate,
    ctx: AccessContext = Depends(get_current_access_context),
) -> SourceResponse:
    org_id = _require_org(ctx)
    return workforce_service.create_source(org_id, data)


@router.post("/evidence", response_model=EvidenceItemResponse, status_code=201)
async def create_evidence(
    data: EvidenceItemCreate,
    ctx: AccessContext = Depends(get_current_access_context),
) -> EvidenceItemResponse:
    org_id = _require_org(ctx)
    return workforce_service.create_evidence_item(org_id, data, actor_id=ctx.user.id)


@router.get("/evidence/person/{person_id}", response_model=List[EvidenceItemResponse])
async def list_evidence_for_person(
    person_id: str,
    ctx: AccessContext = Depends(get_current_access_context),
) -> List[EvidenceItemResponse]:
    org_id = _require_org(ctx)
    return workforce_service.list_evidence_for_person(org_id, person_id)


# ====================================================================
# 5. Candidate Profiles & Candidate Twin
# ====================================================================

@router.get("/candidates", response_model=List[CandidateProfileResponse])
async def list_candidates(
    status: Optional[str] = Query(None),
    role_id: Optional[str] = Query(None),
    ctx: AccessContext = Depends(get_current_access_context),
) -> List[CandidateProfileResponse]:
    org_id = _require_org(ctx)
    if "candidate" in ctx.active_roles and len(ctx.active_roles) == 1:
        raise ForbiddenError("Candidates cannot view the general candidate directory")
    return workforce_service.list_candidates(org_id, status=status, role_id=role_id)


@router.post("/candidates", response_model=CandidateProfileResponse, status_code=201)
async def create_candidate(
    data: CandidateProfileCreate,
    ctx: AccessContext = Depends(get_current_access_context),
) -> CandidateProfileResponse:
    org_id = _require_org(ctx)
    return workforce_service.create_candidate_profile(org_id, data, actor_id=ctx.user.id)


@router.get("/candidates/{cand_id}", response_model=CandidateProfileResponse)
async def get_candidate(
    cand_id: str,
    ctx: AccessContext = Depends(get_current_access_context),
) -> CandidateProfileResponse:
    org_id = _require_org(ctx)
    return workforce_service.get_candidate(org_id, cand_id)


@router.patch("/candidates/{cand_id}", response_model=CandidateProfileResponse)
async def update_candidate(
    cand_id: str,
    data: CandidateProfileUpdate,
    ctx: AccessContext = Depends(get_current_access_context),
) -> CandidateProfileResponse:
    org_id = _require_org(ctx)
    return workforce_service.update_candidate(org_id, cand_id, data, actor_id=ctx.user.id)


@router.get("/candidates/{cand_id}/twin", response_model=CandidateTwinResponse)
async def get_candidate_twin(
    cand_id: str,
    ctx: AccessContext = Depends(get_current_access_context),
) -> CandidateTwinResponse:
    org_id = _require_org(ctx)
    # If candidate role, verify self-access
    if "candidate" in ctx.active_roles and len(ctx.active_roles) == 1:
        cand = workforce_service.get_candidate(org_id, cand_id)
        if cand.profile_id != ctx.user.id and cand.email.lower() != ctx.user.email.lower():
            raise ForbiddenError("You may only access your own candidate twin")
    return workforce_service.get_candidate_twin(org_id, cand_id)


@router.get("/candidates/{cand_id}/convert/preview", response_model=CandidateConversionPreviewResponse)
async def preview_candidate_conversion(
    cand_id: str,
    ctx: AccessContext = Depends(get_current_access_context),
) -> CandidateConversionPreviewResponse:
    org_id = _require_org(ctx)
    if not any(r in ("recruiter", "hr", "administrator") for r in ctx.active_roles):
        raise ForbiddenError("Only Recruiters, HR, and Administrators can initiate candidate conversion")
    return workforce_service.preview_conversion(org_id, cand_id)


@router.post("/candidates/{cand_id}/convert", response_model=CandidateConversionResponse)
async def convert_candidate(
    cand_id: str,
    data: CandidateConversionRequest,
    ctx: AccessContext = Depends(get_current_access_context),
) -> CandidateConversionResponse:
    org_id = _require_org(ctx)
    if not any(r in ("recruiter", "hr", "administrator") for r in ctx.active_roles):
        raise ForbiddenError("Only Recruiters, HR, and Administrators can execute candidate conversion")
    return workforce_service.convert_candidate_to_employee(org_id, cand_id, data, actor_id=ctx.user.id)


# ====================================================================
# 6. Employee Profiles & Temporal Employee Twin
# ====================================================================

@router.get("/employees", response_model=List[EmployeeProfileResponse])
async def list_employees(
    department_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    ctx: AccessContext = Depends(get_current_access_context),
) -> List[EmployeeProfileResponse]:
    org_id = _require_org(ctx)
    if "candidate" in ctx.active_roles and len(ctx.active_roles) == 1:
        raise ForbiddenError("Candidates cannot view internal employees")
    return workforce_service.list_employees(org_id, department_id=department_id, status=status)


@router.post("/employees", response_model=EmployeeProfileResponse, status_code=201)
async def create_employee(
    data: EmployeeProfileCreate,
    ctx: AccessContext = Depends(get_current_access_context),
) -> EmployeeProfileResponse:
    org_id = _require_org(ctx)
    if not any(r in ("hr", "administrator") for r in ctx.active_roles):
        raise ForbiddenError("Only HR and Administrators can create employee records directly")
    return workforce_service.create_employee_profile(org_id, data, actor_id=ctx.user.id)


@router.get("/employees/{emp_id}", response_model=EmployeeProfileResponse)
async def get_employee(
    emp_id: str,
    ctx: AccessContext = Depends(get_current_access_context),
) -> EmployeeProfileResponse:
    org_id = _require_org(ctx)
    return workforce_service.get_employee(org_id, emp_id)


@router.patch("/employees/{emp_id}", response_model=EmployeeProfileResponse)
async def update_employee(
    emp_id: str,
    data: EmployeeProfileUpdate,
    ctx: AccessContext = Depends(get_current_access_context),
) -> EmployeeProfileResponse:
    org_id = _require_org(ctx)
    if not any(r in ("hr", "administrator") for r in ctx.active_roles):
        raise ForbiddenError("Only HR and Administrators can update employment details")
    return workforce_service.update_employee(org_id, emp_id, data, actor_id=ctx.user.id)


@router.get("/employees/{emp_id}/twin", response_model=EmployeeTwinResponse)
async def get_employee_twin(
    emp_id: str,
    ctx: AccessContext = Depends(get_current_access_context),
) -> EmployeeTwinResponse:
    org_id = _require_org(ctx)
    return workforce_service.get_employee_twin(org_id, emp_id, caller_profile_id=ctx.user.id, caller_roles=ctx.active_roles)


# ====================================================================
# 7. Person Skills
# ====================================================================

@router.post("/person-skills", response_model=PersonSkillResponse, status_code=201)
async def add_person_skill(
    data: PersonSkillCreate,
    ctx: AccessContext = Depends(get_current_access_context),
) -> PersonSkillResponse:
    org_id = _require_org(ctx)
    return workforce_service.add_person_skill(org_id, data, actor_id=ctx.user.id)


# ====================================================================
# 8. Goals, Feedback, Attendance
# ====================================================================

@router.get("/goals/employee/{emp_id}", response_model=List[GoalResponse])
async def list_goals(
    emp_id: str,
    ctx: AccessContext = Depends(get_current_access_context),
) -> List[GoalResponse]:
    org_id = _require_org(ctx)
    return workforce_service.list_goals_for_employee(org_id, emp_id, caller_profile_id=ctx.user.id, caller_roles=ctx.active_roles)


@router.post("/goals", response_model=GoalResponse, status_code=201)
async def create_goal(
    data: GoalCreate,
    ctx: AccessContext = Depends(get_current_access_context),
) -> GoalResponse:
    org_id = _require_org(ctx)
    return workforce_service.create_goal(org_id, data, creator_profile_id=ctx.user.id)


@router.patch("/goals/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: str,
    data: GoalUpdate,
    ctx: AccessContext = Depends(get_current_access_context),
) -> GoalResponse:
    org_id = _require_org(ctx)
    return workforce_service.update_goal(org_id, goal_id, data, actor_id=ctx.user.id)


@router.get("/feedback/employee/{emp_id}", response_model=List[FeedbackResponse])
async def list_feedback(
    emp_id: str,
    ctx: AccessContext = Depends(get_current_access_context),
) -> List[FeedbackResponse]:
    org_id = _require_org(ctx)
    return workforce_service.list_feedback_for_employee(
        org_id, emp_id, caller_profile_id=ctx.user.id, caller_roles=ctx.active_roles
    )


@router.post("/feedback", response_model=FeedbackResponse, status_code=201)
async def create_feedback(
    data: FeedbackCreate,
    ctx: AccessContext = Depends(get_current_access_context),
) -> FeedbackResponse:
    org_id = _require_org(ctx)
    return workforce_service.create_feedback(org_id, data, author_profile_id=ctx.user.id)


@router.get("/attendance/employee/{emp_id}", response_model=List[AttendanceSummaryResponse])
async def list_attendance(
    emp_id: str,
    ctx: AccessContext = Depends(get_current_access_context),
) -> List[AttendanceSummaryResponse]:
    org_id = _require_org(ctx)
    return [
        AttendanceSummaryResponse(**att)
        for att in workforce_service._attendance_summaries.values()
        if att["organization_id"] == org_id and att["employee_id"] == emp_id
    ]


@router.post("/attendance", response_model=AttendanceSummaryResponse, status_code=201)
async def create_attendance(
    data: AttendanceSummaryCreate,
    ctx: AccessContext = Depends(get_current_access_context),
) -> AttendanceSummaryResponse:
    org_id = _require_org(ctx)
    if not any(r in ("hr", "administrator") for r in ctx.active_roles):
        raise ForbiddenError("Only HR and Administrators can import attendance records")
    return workforce_service.create_attendance_summary(org_id, data, actor_id=ctx.user.id)


# ====================================================================
# 9. Policy Library
# ====================================================================

@router.get("/policies", response_model=List[PolicyDocumentResponse])
async def list_policies(
    category: Optional[str] = Query(None),
    ctx: AccessContext = Depends(get_current_access_context),
) -> List[PolicyDocumentResponse]:
    org_id = _require_org(ctx)
    return workforce_service.list_policy_documents(org_id, category=category)


@router.post("/policies", response_model=PolicyDocumentResponse, status_code=201)
async def create_policy(
    data: PolicyDocumentCreate,
    ctx: AccessContext = Depends(get_current_access_context),
) -> PolicyDocumentResponse:
    org_id = _require_org(ctx)
    if not any(r in ("hr", "administrator") for r in ctx.active_roles):
        raise ForbiddenError("Only HR and Administrators can create policy documents")
    return workforce_service.create_policy_document(org_id, data, actor_id=ctx.user.id)


@router.get("/policies/{policy_id}", response_model=PolicyDocumentResponse)
async def get_policy(
    policy_id: str,
    ctx: AccessContext = Depends(get_current_access_context),
) -> PolicyDocumentResponse:
    org_id = _require_org(ctx)
    return workforce_service.get_policy_document(org_id, policy_id)


@router.post("/policies/{policy_id}/versions", response_model=PolicyVersionResponse, status_code=201)
async def create_policy_version(
    policy_id: str,
    data: PolicyVersionCreate,
    ctx: AccessContext = Depends(get_current_access_context),
) -> PolicyVersionResponse:
    org_id = _require_org(ctx)
    if not any(r in ("hr", "administrator") for r in ctx.active_roles):
        raise ForbiddenError("Only HR and Administrators can publish policy versions")
    return workforce_service.create_policy_version(org_id, policy_id, data, actor_id=ctx.user.id)


# ====================================================================
# 10. Rules-Based Data Quality Engine
# ====================================================================

@router.get("/data-quality", response_model=DataQualitySummaryResponse)
async def get_data_quality_summary(
    ctx: AccessContext = Depends(get_current_access_context),
) -> DataQualitySummaryResponse:
    org_id = _require_org(ctx)
    if not any(r in ("hr", "administrator") for r in ctx.active_roles):
        raise ForbiddenError("Only HR and Administrators can access the Data Quality Engine")
    return workforce_service.audit_data_quality(org_id)


@router.post("/data-quality/{issue_id}/resolve")
async def resolve_data_quality_issue(
    issue_id: str,
    ctx: AccessContext = Depends(get_current_access_context),
) -> Dict[str, Any]:
    org_id = _require_org(ctx)
    if not any(r in ("hr", "administrator") for r in ctx.active_roles):
        raise ForbiddenError("Only HR and Administrators can resolve data quality issues")
    return workforce_service.resolve_data_quality_issue(org_id, issue_id, actor_id=ctx.user.id)
