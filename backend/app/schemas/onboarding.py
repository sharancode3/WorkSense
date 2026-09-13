"""Pydantic schemas for Stage 5: Adaptive Onboarding."""

from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


# ====================================================================
# 1. Task Definitions & Templates
# ====================================================================

TaskCategory = Literal[
    "compliance",
    "it_setup",
    "security",
    "learning",
    "team_integration",
    "milestone_review",
]

TaskScope = Literal["organization", "department", "role", "work_mode"]

TaskOwnerRole = Literal["employee", "manager", "hr", "it_admin", "buddy"]

TaskVerificationType = Literal[
    "self_attestation",
    "system_check",
    "manager_approval",
    "hr_approval",
    "artifact_upload",
]

OnboardingPhase = Literal[
    "preboarding",
    "day_1",
    "week_1",
    "day_30",
    "day_60",
    "day_90",
]


class OnboardingTaskDefinitionCreate(BaseModel):
    code: str = Field(..., min_length=3, max_length=50)
    title: str = Field(..., min_length=3, max_length=150)
    description: str = Field(..., min_length=10)
    category: TaskCategory
    scope: TaskScope
    is_mandatory: bool = True
    estimated_minutes: int = Field(default=30, ge=5)
    default_owner_role: TaskOwnerRole = "employee"
    verification_type: TaskVerificationType = "self_attestation"
    is_active: bool = True


class OnboardingTaskDefinitionResponse(BaseModel):
    id: str
    organization_id: str
    code: str
    title: str
    description: str
    category: TaskCategory
    scope: TaskScope
    is_mandatory: bool
    estimated_minutes: int
    default_owner_role: TaskOwnerRole
    verification_type: TaskVerificationType
    is_active: bool
    created_at: str


class OnboardingTemplateTaskItem(BaseModel):
    task_definition_id: str
    code: str
    title: str
    category: TaskCategory
    phase: OnboardingPhase
    is_mandatory: bool
    sort_order: int
    relative_day_offset: int
    verification_type: TaskVerificationType


class OnboardingTemplateResponse(BaseModel):
    id: str
    organization_id: str
    name: str
    scope_type: TaskScope
    scope_id: Optional[str] = None
    version: int
    description: Optional[str] = None
    is_active: bool
    tasks: List[OnboardingTemplateTaskItem] = Field(default_factory=list)
    created_at: str


# ====================================================================
# 2. Learning Resources & Skill Gaps
# ====================================================================

class LearningResourceResponse(BaseModel):
    id: str
    skill_id: str
    skill_name: str
    title: str
    provider: str
    resource_type: Literal["course", "documentation", "lab", "book", "video", "certification"]
    url: str
    estimated_minutes: int
    target_proficiency: int
    prerequisites: List[str] = Field(default_factory=list)


class SkillGapItem(BaseModel):
    skill_id: str
    skill_name: str
    required_level: int
    candidate_level: int
    gap_size: int
    importance: Literal["required", "preferred"] = "required"
    recommended_resources: List[LearningResourceResponse] = Field(default_factory=list)


class SkillGapAnalysisDTO(BaseModel):
    role_title: str
    required_skills_count: int
    gap_count: int
    gaps: List[SkillGapItem] = Field(default_factory=list)
    strong_skills: List[str] = Field(default_factory=list)
    summary: str


# ====================================================================
# 3. Multi-Brain Qwen Intelligence DTOs
# ====================================================================

class PersonalizedJourneyDTO(BaseModel):
    rationale: str
    suggested_learning_tasks: List[Dict[str, Any]] = Field(default_factory=list)
    milestone_pacing_strategy: str
    focus_areas: List[str] = Field(default_factory=list)


class PlanCriticReviewDTO(BaseModel):
    passed: bool
    rule_checks: Dict[str, bool] = Field(default_factory=dict)
    workload_pacing_score: float = Field(default=1.0, ge=0.0, le=1.0)
    policy_compliance: bool = True
    concerns: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)


class PlanAdaptationDTO(BaseModel):
    reasoning: str
    suggested_date_shifts: Dict[str, int] = Field(default_factory=dict)
    priority_changes: Dict[str, str] = Field(default_factory=dict)
    risk_assessment: str


# ====================================================================
# 4. Onboarding Plan & Task DTOs
# ====================================================================

PlanStatus = Literal[
    "draft",
    "hr_review",
    "manager_review",
    "approved",
    "active",
    "superseded",
    "completed",
]

ReviewStatus = Literal["pending", "approved", "rejected", "changes_requested"]

TaskStatus = Literal["pending", "in_progress", "completed", "blocked", "waived"]


class OnboardingTaskDependencyDTO(BaseModel):
    id: str
    task_id: str
    depends_on_task_id: str
    dependency_type: Literal["hard_block", "soft_prerequisite"] = "hard_block"


class OnboardingPlanTaskResponse(BaseModel):
    id: str
    plan_id: str
    task_code: str
    title: str
    description: str
    category: TaskCategory
    phase: OnboardingPhase
    is_mandatory: bool
    owner_role: TaskOwnerRole
    assignee_id: Optional[str] = None
    assignee_name: Optional[str] = None
    verification_type: TaskVerificationType
    status: TaskStatus
    scheduled_day_offset: int
    due_date: Optional[str] = None
    completed_at: Optional[str] = None
    blocker_reason: Optional[str] = None
    blocker_reported_at: Optional[str] = None
    resolution_notes: Optional[str] = None
    evidence_url: Optional[str] = None
    ai_personalization_source: Optional[str] = None
    ai_reasoning: Optional[str] = None
    dependencies: List[str] = Field(default_factory=list)


class OnboardingPlanResponse(BaseModel):
    id: str
    case_id: str
    version_number: int
    status: PlanStatus
    is_active: bool
    ai_generation_metadata: Optional[Dict[str, Any]] = None
    critic_review: Optional[PlanCriticReviewDTO] = None
    hr_review_status: ReviewStatus = "pending"
    hr_reviewer_id: Optional[str] = None
    hr_reviewed_at: Optional[str] = None
    hr_notes: Optional[str] = None
    manager_review_status: ReviewStatus = "pending"
    manager_reviewer_id: Optional[str] = None
    manager_reviewed_at: Optional[str] = None
    manager_notes: Optional[str] = None
    tasks: List[OnboardingPlanTaskResponse] = Field(default_factory=list)
    created_at: str
    updated_at: str


class PlanDifferenceDTO(BaseModel):
    id: str
    case_id: str
    from_plan_id: str
    to_plan_id: str
    adaptation_trigger: Literal[
        "manager_edit",
        "task_blocked",
        "timeline_shift",
        "hr_request",
        "skill_reassessment",
    ]
    summary: str
    task_diff: Dict[str, Any] = Field(default_factory=dict)
    created_at: str


# ====================================================================
# 5. Onboarding Case DTOs
# ====================================================================

CaseStatus = Literal[
    "initiated",
    "planning",
    "in_review",
    "approved",
    "in_progress",
    "blocked",
    "completed",
    "cancelled",
]


class OnboardingCaseCreate(BaseModel):
    candidate_id: str
    job_opening_id: str
    department_id: str
    job_role_id: str
    employee_code: str = Field(..., min_length=3, max_length=20)
    hire_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    manager_employee_id: Optional[str] = None
    work_location: str = "Remote"
    employment_type: Literal["full_time", "part_time", "contract"] = "full_time"


class OnboardingCasePreviewResponse(BaseModel):
    candidate_id: str
    candidate_name: str
    candidate_email: str
    job_opening_id: str
    job_title: str
    department_id: str
    department_name: str
    job_role_id: str
    role_title: str
    is_eligible: bool
    eligibility_message: str
    recruitment_decision: Optional[str] = None
    verified_skills: List[Dict[str, Any]] = Field(default_factory=list)
    skill_gaps: List[SkillGapItem] = Field(default_factory=list)
    mandatory_task_count: int = 0


class OnboardingCaseResponse(BaseModel):
    id: str
    organization_id: str
    candidate_id: str
    candidate_name: str
    candidate_email: str
    employee_id: str
    employee_code: str
    job_opening_id: Optional[str] = None
    job_title: str
    department_id: str
    department_name: str
    job_role_id: str
    role_title: str
    manager_employee_id: Optional[str] = None
    manager_name: Optional[str] = None
    hire_date: str
    work_location: str
    status: CaseStatus
    current_plan_id: Optional[str] = None
    active_plan: Optional[OnboardingPlanResponse] = None
    progress_percent: float = 0.0
    completed_tasks_count: int = 0
    total_tasks_count: int = 0
    blocked_tasks_count: int = 0
    enterpro_handoff_status: Optional[str] = None
    created_at: str
    updated_at: str


class OnboardingCaseListResponse(BaseModel):
    cases: List[OnboardingCaseResponse]
    total: int


# ====================================================================
# 6. Review Gates & Manager Edits
# ====================================================================

class HRReviewRequest(BaseModel):
    decision: Literal["approve", "changes_requested", "reject"]
    notes: Optional[str] = None


class ManagerReviewRequest(BaseModel):
    decision: Literal["approve", "changes_requested", "reject"]
    notes: Optional[str] = None


class ManagerTaskCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)
    description: str = Field(..., min_length=10)
    category: TaskCategory = "team_integration"
    phase: OnboardingPhase = "week_1"
    scheduled_day_offset: int = Field(default=3, ge=0, le=90)
    verification_type: TaskVerificationType = "manager_approval"
    owner_role: TaskOwnerRole = "employee"
    reasoning: Optional[str] = "Manager assigned 1:1 onboarding milestone"


# ====================================================================
# 7. Task Execution, Blockers, & Adaptive Replanning
# ====================================================================

class TaskCompletionRequest(BaseModel):
    evidence_url: Optional[str] = None
    notes: Optional[str] = None


class TaskBlockerRequest(BaseModel):
    blocker_reason: str = Field(..., min_length=5)


class AdaptiveReplanRequest(BaseModel):
    trigger: Literal[
        "task_blocked",
        "timeline_shift",
        "hr_request",
        "manager_edit",
        "skill_reassessment",
    ] = "task_blocked"
    trigger_task_id: Optional[str] = None
    explanation: str = Field(..., min_length=5)
    suggested_day_shift: int = Field(default=3, ge=1, le=30)


# ====================================================================
# 8. EnterPro Handoff
# ====================================================================

class EnterProHandoffRequest(BaseModel):
    correlation_id: Optional[str] = None
    notes: Optional[str] = None


class EnterProHandoffResponse(BaseModel):
    id: str
    case_id: str
    correlation_id: str
    status: Literal["SIMULATED_ACKNOWLEDGEMENT", "PENDING", "FAILED"]
    simulated_external_workflow_id: str
    dispatched_tasks_count: int
    acknowledged_at: str
    disclaimer: str
