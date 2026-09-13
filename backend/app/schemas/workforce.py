"""Pydantic v2 schemas for Stage 3 Core Workforce Data Layer."""

from datetime import date
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


# ====================================================================
# 1. Department Schemas
# ====================================================================

class DepartmentCreate(BaseModel):
    code: str = Field(..., min_length=2, max_length=20, pattern=r"^[A-Z0-9_-]+$")
    name: str = Field(..., min_length=2, max_length=150)
    description: Optional[str] = None
    parent_department_id: Optional[str] = None
    head_profile_id: Optional[str] = None
    is_active: bool = True


class DepartmentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    description: Optional[str] = None
    parent_department_id: Optional[str] = None
    head_profile_id: Optional[str] = None
    is_active: Optional[bool] = None


class DepartmentResponse(BaseModel):
    id: str
    organization_id: str
    code: str
    name: str
    description: Optional[str] = None
    parent_department_id: Optional[str] = None
    parent_department_name: Optional[str] = None
    head_profile_id: Optional[str] = None
    head_profile_name: Optional[str] = None
    employee_count: int = 0
    role_count: int = 0
    is_active: bool
    created_at: str
    updated_at: str


class DepartmentTreeItem(BaseModel):
    id: str
    code: str
    name: str
    description: Optional[str] = None
    head_profile_name: Optional[str] = None
    employee_count: int = 0
    children: List["DepartmentTreeItem"] = Field(default_factory=list)


# ====================================================================
# 2. Skill Taxonomy & Relational Graph Schemas
# ====================================================================

class SkillAliasDTO(BaseModel):
    id: str
    alias: str


class SkillRelationshipDTO(BaseModel):
    id: str
    target_skill_id: str
    target_skill_name: str
    relationship_type: Literal["ADJACENT_TO", "PREREQUISITE_OF", "TRANSFERABLE_TO", "SPECIALIZATION_OF"]
    similarity_weight: float
    is_bidirectional: bool


class SkillRelationshipCreate(BaseModel):
    target_skill_id: str
    relationship_type: Literal["ADJACENT_TO", "PREREQUISITE_OF", "TRANSFERABLE_TO", "SPECIALIZATION_OF"]
    similarity_weight: float = Field(default=0.500, ge=0.0, le=1.0)
    is_bidirectional: bool = False


class SkillCreate(BaseModel):
    code: str = Field(..., min_length=2, max_length=100)
    name: str = Field(..., min_length=2, max_length=150)
    category: str = Field(..., min_length=2, max_length=100)
    description: str
    aliases: List[str] = Field(default_factory=list)


class SkillResponse(BaseModel):
    id: str
    code: str
    name: str
    category: str
    description: str
    aliases: List[str] = Field(default_factory=list)
    relationships: List[SkillRelationshipDTO] = Field(default_factory=list)
    is_active: bool
    created_at: str
    updated_at: str


class SkillGraphNode(BaseModel):
    id: str
    label: str
    category: str
    node_type: Literal["skill", "role", "person"]
    proficiency_level: Optional[int] = None
    confidence_band: Optional[str] = None


class SkillGraphEdge(BaseModel):
    id: str
    source: str
    target: str
    relationship_type: str
    weight: float
    label: str


class SkillGraphResponse(BaseModel):
    nodes: List[SkillGraphNode]
    edges: List[SkillGraphEdge]
    total_nodes: int
    total_edges: int


# ====================================================================
# 3. Job Role & Requirements Schemas
# ====================================================================

class RoleSkillRequirementCreate(BaseModel):
    skill_id: str
    is_required: bool = True
    min_proficiency: int = Field(default=1, ge=1, le=5)
    importance_weight: float = Field(default=1.0, ge=0.0, le=1.0)
    demand_classification: Literal["current", "future"] = "current"


class RoleSkillRequirementDTO(BaseModel):
    id: str
    skill_id: str
    skill_name: str
    skill_code: str
    skill_category: str
    is_required: bool
    min_proficiency: int
    importance_weight: float
    demand_classification: str


class JobRoleCreate(BaseModel):
    department_id: str
    code: str = Field(..., min_length=2, max_length=50)
    title: str = Field(..., min_length=2, max_length=150)
    role_family: str
    seniority_level: str = Field(..., pattern=r"^L[1-6]$")
    summary: str
    responsibilities: Optional[str] = None
    skills: List[RoleSkillRequirementCreate] = Field(default_factory=list)


class JobRoleUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=150)
    role_family: Optional[str] = None
    seniority_level: Optional[str] = Field(None, pattern=r"^L[1-6]$")
    summary: Optional[str] = None
    responsibilities: Optional[str] = None
    is_active: Optional[bool] = None


class JobRoleResponse(BaseModel):
    id: str
    organization_id: str
    department_id: str
    department_name: Optional[str] = None
    code: str
    title: str
    role_family: str
    seniority_level: str
    summary: str
    responsibilities: Optional[str] = None
    required_skills: List[RoleSkillRequirementDTO] = Field(default_factory=list)
    preferred_skills: List[RoleSkillRequirementDTO] = Field(default_factory=list)
    active_employees_count: int = 0
    active_candidates_count: int = 0
    is_active: bool
    created_at: str
    updated_at: str


# ====================================================================
# 4. Sources & Evidence Schemas
# ====================================================================

class SourceCreate(BaseModel):
    source_type: Literal[
        "candidate_self_entry", "employee_self_entry", "recruiter_entry",
        "manager_entry", "hr_entry", "csv_import", "hris_export",
        "attendance_import", "policy_document", "demo_seed"
    ]
    name: str
    external_reference: Optional[str] = None
    reliability_status: Literal["verified", "self_reported", "unverified", "imported"] = "unverified"
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SourceResponse(BaseModel):
    id: str
    organization_id: str
    source_type: str
    name: str
    external_reference: Optional[str] = None
    reliability_status: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: str


class EvidenceItemCreate(BaseModel):
    subject_person_id: str
    source_id: Optional[str] = None
    claim_summary: str
    source_type: str
    source_uri: str
    observed_at: Optional[str] = None
    effective_at: Optional[str] = None
    confidence_score: float = Field(default=0.500, ge=0.0, le=1.0)
    verification_status: Literal["verified", "unverified", "disputed", "superseded", "rejected"] = "unverified"
    visibility: Literal["public_workforce", "manager_and_hr", "hr_only", "confidential_admin"] = "public_workforce"
    target_entity_type: Optional[Literal["person_skill", "goal", "feedback", "attendance", "policy_version", "conversion"]] = None
    target_entity_id: Optional[str] = None


class EvidenceItemResponse(BaseModel):
    id: str
    organization_id: str
    subject_person_id: str
    source_id: Optional[str] = None
    source_name: Optional[str] = None
    claim_summary: str
    source_type: str
    source_uri: str
    observed_at: str
    effective_at: str
    confidence_score: float
    verification_status: str
    verified_by: Optional[str] = None
    verified_at: Optional[str] = None
    visibility: str
    is_stale: bool
    created_at: str


# ====================================================================
# 5. Person Skills
# ====================================================================

class PersonSkillCreate(BaseModel):
    person_id: str
    skill_id: str
    proficiency_level: int = Field(..., ge=1, le=5)
    verification_source: Literal["interview_verified", "manager_verified", "production_pr", "self_declared", "assessment"]
    last_demonstrated_at: Optional[str] = None
    evidence_id: Optional[str] = None


class PersonSkillUpdate(BaseModel):
    proficiency_level: Optional[int] = Field(None, ge=1, le=5)
    verification_source: Optional[str] = None
    is_stale: Optional[bool] = None


class PersonSkillResponse(BaseModel):
    id: str
    organization_id: str
    person_id: str
    skill_id: str
    skill_name: str
    skill_code: str
    skill_category: str
    proficiency_level: int
    confidence_band: Literal["high", "moderate", "limited", "insufficient"]
    verification_source: str
    is_stale: bool
    last_demonstrated_at: str
    evidence_items: List[EvidenceItemResponse] = Field(default_factory=list)
    created_at: str
    updated_at: str


# ====================================================================
# 6. Candidate Profile & Candidate Twin
# ====================================================================

class CandidateProfileCreate(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: str
    phone: Optional[str] = None
    location: Optional[str] = None
    current_title: Optional[str] = None
    years_experience: float = Field(default=0.0, ge=0.0)
    education_summary: Optional[str] = None
    summary: Optional[str] = None
    target_role_id: Optional[str] = None


class CandidateProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    current_title: Optional[str] = None
    years_experience: Optional[float] = None
    education_summary: Optional[str] = None
    summary: Optional[str] = None
    target_role_id: Optional[str] = None
    record_status: Optional[Literal["active", "shortlisted", "offered", "converted", "archived", "withdrawn"]] = None


class CandidateProfileResponse(BaseModel):
    id: str
    organization_id: str
    profile_id: Optional[str] = None
    first_name: str
    last_name: str
    full_name: str
    email: str
    phone: Optional[str] = None
    location: Optional[str] = None
    current_title: Optional[str] = None
    years_experience: float
    education_summary: Optional[str] = None
    summary: Optional[str] = None
    target_role_id: Optional[str] = None
    target_role_title: Optional[str] = None
    consent_given: bool
    record_status: str
    created_at: str
    updated_at: str


class TimelineEvent(BaseModel):
    event_id: str
    title: str
    event_type: str
    effective_date: str
    actor_name: Optional[str] = None
    description: str
    source_reference: Optional[str] = None


class CandidateTwinResponse(BaseModel):
    candidate: CandidateProfileResponse
    target_role: Optional[JobRoleResponse] = None
    skills: List[PersonSkillResponse] = Field(default_factory=list)
    evidence_items: List[EvidenceItemResponse] = Field(default_factory=list)
    profile_completeness_pct: int
    data_freshness: str
    is_eligible_for_conversion: bool
    conversion_status: str
    timeline: List[TimelineEvent] = Field(default_factory=list)


# ====================================================================
# 7. Candidate-to-Employee Conversion
# ====================================================================

class CandidateConversionPreviewResponse(BaseModel):
    candidate_id: str
    candidate_name: str
    candidate_email: str
    target_role_id: Optional[str] = None
    target_role_title: Optional[str] = None
    suggested_department_id: Optional[str] = None
    suggested_department_name: Optional[str] = None
    skills_to_carry_forward: List[str] = Field(default_factory=list)
    evidence_items_to_carry_forward: int = 0
    recruitment_restricted_notes_count: int = 0
    is_eligible: bool
    eligibility_message: str


class CandidateConversionRequest(BaseModel):
    department_id: str
    job_role_id: str
    manager_employee_id: Optional[str] = None
    employee_code: str = Field(..., min_length=3, max_length=50)
    hire_date: date = Field(default_factory=date.today)
    work_location: str = "Remote"
    employment_type: Literal["full_time", "part_time", "contract"] = "full_time"


class CandidateConversionResponse(BaseModel):
    success: bool
    message: str
    conversion_id: str
    candidate_id: str
    employee_id: str
    employee_code: str
    hire_date: str
    carried_skill_count: int
    carried_evidence_count: int


# ====================================================================
# 8. Employee Profile & Temporal Employee Twin
# ====================================================================

class EmployeeProfileCreate(BaseModel):
    profile_id: str
    candidate_id: Optional[str] = None
    employee_code: str
    hire_date: date
    department_id: str
    job_role_id: str
    work_location: str = "Remote"
    employment_type: Literal["full_time", "part_time", "contract"] = "full_time"
    manager_employee_id: Optional[str] = None


class EmployeeProfileUpdate(BaseModel):
    department_id: Optional[str] = None
    job_role_id: Optional[str] = None
    employment_status: Optional[Literal["probation", "active", "leave", "terminated", "suspended"]] = None
    work_location: Optional[str] = None
    employment_type: Optional[Literal["full_time", "part_time", "contract"]] = None
    manager_employee_id: Optional[str] = None


class ManagerRelationshipResponse(BaseModel):
    id: str
    manager_employee_id: str
    manager_name: str
    manager_title: str
    relationship_type: str
    effective_start_date: str
    is_current: bool


class EmployeeProfileResponse(BaseModel):
    id: str
    organization_id: str
    profile_id: str
    full_name: str
    work_email: str
    avatar_url: Optional[str] = None
    candidate_id: Optional[str] = None
    employee_code: str
    hire_date: str
    department_id: str
    department_name: str
    job_role_id: str
    job_role_title: str
    seniority_level: str
    employment_status: str
    work_location: str
    employment_type: str
    current_manager: Optional[ManagerRelationshipResponse] = None
    created_at: str
    updated_at: str

    def __getitem__(self, item: str) -> Any:
        return getattr(self, item)

    def get(self, item: str, default: Any = None) -> Any:
        return getattr(self, item, default)


# ====================================================================
# 9. Goals, Feedback, Attendance
# ====================================================================

class GoalCreate(BaseModel):
    employee_id: str
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = None
    goal_type: Literal["individual", "departmental", "strategic"] = "individual"
    priority: Literal["low", "medium", "high", "urgent"] = "medium"
    due_date: date
    start_date: date = Field(default_factory=date.today)
    progress_percentage: int = Field(default=0, ge=0, le=100)
    visibility: Literal["employee_visible", "manager_and_employee", "hr_only"] = "employee_visible"
    related_job_role_id: Optional[str] = None
    related_skill_id: Optional[str] = None


class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[Literal["draft", "active", "completed", "cancelled", "overdue"]] = None
    progress_percentage: Optional[int] = Field(None, ge=0, le=100)
    due_date: Optional[date] = None


class GoalResponse(BaseModel):
    id: str
    organization_id: str
    employee_id: str
    title: str
    description: Optional[str] = None
    goal_type: str
    priority: str
    status: str
    start_date: str
    due_date: str
    progress_percentage: int
    creator_name: str
    visibility: str
    related_skill_name: Optional[str] = None
    completed_at: Optional[str] = None
    created_at: str
    updated_at: str


class FeedbackCreate(BaseModel):
    subject_employee_id: str
    feedback_type: Literal["peer", "manager_1on1", "quarterly_checkin", "project_retrospective"]
    visibility: Literal["employee_visible", "manager_and_employee", "hr_restricted", "confidential_hr"] = "employee_visible"
    structured_strengths: List[str] = Field(default_factory=list)
    development_areas: List[str] = Field(default_factory=list)
    related_goal_id: Optional[str] = None
    related_skill_id: Optional[str] = None


class FeedbackResponse(BaseModel):
    id: str
    organization_id: str
    subject_employee_id: str
    author_name: str
    feedback_type: str
    feedback_date: str
    visibility: str
    visibility_explanation: str
    structured_strengths: List[str]
    development_areas: List[str]
    acknowledged_by_subject: bool
    created_at: str


class AttendanceSummaryCreate(BaseModel):
    employee_id: str
    period_start: date
    period_end: date
    scheduled_workdays: int = 20
    present_days: int = 20
    approved_leave_days: int = 0
    unapproved_absence_days: int = 0
    remote_days: int = 0
    onsite_days: int = 20
    late_occurrences: int = 0
    source_system: str = "hris_attendance_sync"
    data_quality_status: Literal["verified", "provisional", "stale", "incomplete"] = "verified"


class AttendanceSummaryResponse(BaseModel):
    id: str
    organization_id: str
    employee_id: str
    period_start: str
    period_end: str
    scheduled_workdays: int
    present_days: int
    approved_leave_days: int
    unapproved_absence_days: int
    remote_days: int
    onsite_days: int
    late_occurrences: int
    source_system: str
    freshness_timestamp: str
    data_quality_status: str


class EmployeeTwinResponse(BaseModel):
    employee: EmployeeProfileResponse
    candidate_lineage: Optional[CandidateProfileResponse] = None
    skills: List[PersonSkillResponse] = Field(default_factory=list)
    evidence_items: List[EvidenceItemResponse] = Field(default_factory=list)
    goals: List[GoalResponse] = Field(default_factory=list)
    feedback: List[FeedbackResponse] = Field(default_factory=list)
    attendance_summaries: List[AttendanceSummaryResponse] = Field(default_factory=list)
    data_freshness: str
    timeline: List[TimelineEvent] = Field(default_factory=list)


# ====================================================================
# 10. Policy Library & Versions
# ====================================================================

class PolicyDocumentCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    policy_code: str = Field(..., min_length=2, max_length=50)
    category: Literal["remote_work", "probation", "benefits", "code_of_conduct", "travel", "general"]
    description: Optional[str] = None
    access_classification: Literal["all_employees", "managers_and_hr", "hr_restricted"] = "all_employees"


class PolicyVersionCreate(BaseModel):
    version_number: str
    effective_date: date
    review_date: Optional[date] = None
    expiry_date: Optional[date] = None
    file_name: str
    file_size_bytes: int = 0
    storage_path: str
    sha256_hash: str
    supersede_previous: bool = True


class PolicyVersionResponse(BaseModel):
    id: str
    policy_document_id: str
    version_number: str
    status: str
    effective_date: str
    review_date: Optional[str] = None
    expiry_date: Optional[str] = None
    file_name: str
    file_size_bytes: int
    mime_type: str
    storage_path: str
    sha256_hash: str
    superseded_by_version_id: Optional[str] = None
    uploaded_by_name: str
    created_at: str


class PolicyDocumentResponse(BaseModel):
    id: str
    organization_id: str
    title: str
    policy_code: str
    category: str
    description: Optional[str] = None
    access_classification: str
    active_version: Optional[PolicyVersionResponse] = None
    all_versions: List[PolicyVersionResponse] = Field(default_factory=list)
    created_at: str
    updated_at: str


# ====================================================================
# 11. Data Quality Registry
# ====================================================================

class DataQualityIssueResponse(BaseModel):
    id: str
    organization_id: str
    issue_type: str
    entity_type: str
    entity_id: str
    entity_name: str
    severity: Literal["critical", "warning", "info"]
    explanation: str
    suggested_action: str
    is_resolved: bool
    created_at: str


class DataQualitySummaryResponse(BaseModel):
    total_issues: int
    critical_count: int
    warning_count: int
    info_count: int
    issues: List[DataQualityIssueResponse]
