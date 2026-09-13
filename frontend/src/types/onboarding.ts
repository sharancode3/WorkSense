/**
 * Stage 5: Adaptive Onboarding TypeScript Definitions
 */

export type TaskCategory =
  | "compliance"
  | "it_setup"
  | "security"
  | "learning"
  | "team_integration"
  | "milestone_review";

export type TaskScope = "organization" | "department" | "role" | "work_mode";

export type TaskOwnerRole = "employee" | "manager" | "hr" | "it_admin" | "buddy";

export type TaskVerificationType =
  | "self_attestation"
  | "system_check"
  | "manager_approval"
  | "hr_approval"
  | "artifact_upload";

export type OnboardingPhase =
  | "preboarding"
  | "day_1"
  | "week_1"
  | "day_30"
  | "day_60"
  | "day_90";

export type PlanStatus =
  | "draft"
  | "hr_review"
  | "manager_review"
  | "approved"
  | "active"
  | "superseded"
  | "completed";

export type ReviewStatus = "pending" | "approved" | "rejected" | "changes_requested";

export type TaskStatus = "pending" | "in_progress" | "completed" | "blocked" | "waived";

export type CaseStatus =
  | "initiated"
  | "planning"
  | "in_review"
  | "approved"
  | "in_progress"
  | "blocked"
  | "completed"
  | "cancelled";

export interface OnboardingTaskDefinition {
  id: string;
  organization_id: string;
  code: string;
  title: string;
  description: string;
  category: TaskCategory;
  scope: TaskScope;
  is_mandatory: boolean;
  estimated_minutes: number;
  default_owner_role: TaskOwnerRole;
  verification_type: TaskVerificationType;
  is_active: boolean;
  created_at: string;
}

export interface OnboardingTemplateTaskItem {
  task_definition_id: string;
  code: string;
  title: string;
  category: TaskCategory;
  phase: OnboardingPhase;
  is_mandatory: boolean;
  sort_order: number;
  relative_day_offset: number;
  verification_type: TaskVerificationType;
}

export interface OnboardingTemplate {
  id: string;
  organization_id: string;
  name: string;
  scope_type: TaskScope;
  scope_id?: string | null;
  version: number;
  description?: string | null;
  is_active: boolean;
  tasks: OnboardingTemplateTaskItem[];
  created_at: string;
}

export interface LearningResource {
  id: string;
  skill_id: string;
  skill_name: string;
  title: string;
  provider: string;
  resource_type: "course" | "documentation" | "lab" | "book" | "video" | "certification";
  url: string;
  estimated_minutes: number;
  target_proficiency: number;
  prerequisites: string[];
}

export interface SkillGapItem {
  skill_id: string;
  skill_name: string;
  required_level: number;
  candidate_level: number;
  gap_size: number;
  importance: "required" | "preferred";
  recommended_resources: LearningResource[];
}

export interface SkillGapAnalysis {
  role_title: string;
  required_skills_count: number;
  gap_count: number;
  gaps: SkillGapItem[];
  strong_skills: string[];
  summary: string;
}

export interface PlanCriticReview {
  passed: boolean;
  rule_checks: Record<string, boolean>;
  workload_pacing_score: number;
  policy_compliance: boolean;
  concerns: string[];
  recommendations: string[];
}

export interface OnboardingPlanTask {
  id: string;
  plan_id: string;
  task_code: string;
  title: string;
  description: string;
  category: TaskCategory;
  phase: OnboardingPhase;
  is_mandatory: boolean;
  owner_role: TaskOwnerRole;
  assignee_id?: string | null;
  assignee_name?: string | null;
  verification_type: TaskVerificationType;
  status: TaskStatus;
  scheduled_day_offset: number;
  due_date?: string | null;
  completed_at?: string | null;
  blocker_reason?: string | null;
  blocker_reported_at?: string | null;
  resolution_notes?: string | null;
  evidence_url?: string | null;
  ai_personalization_source?: string | null;
  ai_reasoning?: string | null;
  dependencies: string[];
}

export interface OnboardingPlan {
  id: string;
  case_id: string;
  version_number: number;
  status: PlanStatus;
  is_active: boolean;
  ai_generation_metadata?: Record<string, any> | null;
  critic_review?: PlanCriticReview | null;
  hr_review_status: ReviewStatus;
  hr_reviewer_id?: string | null;
  hr_reviewed_at?: string | null;
  hr_notes?: string | null;
  manager_review_status: ReviewStatus;
  manager_reviewer_id?: string | null;
  manager_reviewed_at?: string | null;
  manager_notes?: string | null;
  tasks: OnboardingPlanTask[];
  created_at: string;
  updated_at: string;
}

export interface PlanDifference {
  id: string;
  case_id: string;
  from_plan_id: string;
  to_plan_id: string;
  adaptation_trigger:
    | "manager_edit"
    | "task_blocked"
    | "timeline_shift"
    | "hr_request"
    | "skill_reassessment";
  summary: string;
  task_diff: {
    shifted_tasks?: Array<{
      title: string;
      old_due_date: string;
      new_due_date: string;
      shift_days: number;
    }>;
    unblocked_tasks?: string[];
    [key: string]: any;
  };
  created_at: string;
}

export interface OnboardingCase {
  id: string;
  organization_id: string;
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  employee_id: string;
  employee_code: string;
  job_opening_id?: string | null;
  job_title: string;
  department_id: string;
  department_name: string;
  job_role_id: string;
  role_title: string;
  manager_employee_id?: string | null;
  manager_name?: string | null;
  hire_date: string;
  work_location: string;
  status: CaseStatus;
  current_plan_id?: string | null;
  active_plan?: OnboardingPlan | null;
  progress_percent: number;
  completed_tasks_count: number;
  total_tasks_count: number;
  blocked_tasks_count: number;
  enterpro_handoff_status?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OnboardingCasePreview {
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  job_opening_id: string;
  job_title: string;
  department_id: string;
  department_name: string;
  job_role_id: string;
  role_title: string;
  is_eligible: boolean;
  eligibility_message: string;
  recruitment_decision?: string | null;
  verified_skills: Array<{
    skill_id: string;
    name: string;
    category: string;
    proficiency_level: number;
    reliability: string;
  }>;
  skill_gaps: SkillGapItem[];
  mandatory_task_count: number;
}

export interface OnboardingCaseCreatePayload {
  candidate_id: string;
  job_opening_id: string;
  department_id: string;
  job_role_id: string;
  employee_code: string;
  hire_date: string;
  manager_employee_id?: string;
  work_location?: string;
  employment_type?: "full_time" | "part_time" | "contract";
}

export interface HRReviewPayload {
  decision: "approve" | "changes_requested" | "reject";
  notes?: string;
}

export interface ManagerReviewPayload {
  decision: "approve" | "changes_requested" | "reject";
  notes?: string;
}

export interface ManagerTaskCreatePayload {
  title: string;
  description: string;
  category?: TaskCategory;
  phase?: OnboardingPhase;
  scheduled_day_offset?: number;
  verification_type?: TaskVerificationType;
  owner_role?: TaskOwnerRole;
  reasoning?: string;
}

export interface TaskCompletionPayload {
  evidence_url?: string;
  notes?: string;
}

export interface TaskBlockerPayload {
  blocker_reason: string;
}

export interface AdaptiveReplanPayload {
  trigger?: "task_blocked" | "timeline_shift" | "hr_request" | "manager_edit" | "skill_reassessment";
  trigger_task_id?: string;
  explanation: string;
  suggested_day_shift?: number;
}

export interface EnterProHandoffPayload {
  correlation_id?: string;
  notes?: string;
}

export interface EnterProHandoffResponse {
  id: string;
  case_id: string;
  correlation_id: string;
  status: "SIMULATED_ACKNOWLEDGEMENT" | "PENDING" | "FAILED";
  simulated_external_workflow_id: string;
  dispatched_tasks_count: number;
  acknowledged_at: string;
  disclaimer: string;
}
