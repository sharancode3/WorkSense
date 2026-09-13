import { apiClient } from "./client";
import {
  AdaptiveReplanPayload,
  EnterProHandoffPayload,
  EnterProHandoffResponse,
  HRReviewPayload,
  LearningResource,
  ManagerReviewPayload,
  ManagerTaskCreatePayload,
  OnboardingCase,
  OnboardingCaseCreatePayload,
  OnboardingCasePreview,
  OnboardingPlan,
  OnboardingPlanTask,
  OnboardingTaskDefinition,
  OnboardingTemplate,
  PlanDifference,
  SkillGapAnalysis,
  TaskBlockerPayload,
  TaskCompletionPayload,
} from "@/types/onboarding";

// ====================================================================
// 1. Catalogs & Templates
// ====================================================================

export async function listOnboardingTaskDefinitionsApi(
  category?: string,
  isMandatory?: boolean
): Promise<OnboardingTaskDefinition[]> {
  return apiClient<OnboardingTaskDefinition[]>("/api/v1/onboarding/catalogs/tasks", {
    method: "GET",
    params: {
      category,
      is_mandatory: isMandatory,
    },
  });
}

export async function listOnboardingTemplatesApi(
  scopeType?: string
): Promise<OnboardingTemplate[]> {
  return apiClient<OnboardingTemplate[]>("/api/v1/onboarding/catalogs/templates", {
    method: "GET",
    params: { scope_type: scopeType },
  });
}

export async function listLearningResourcesApi(
  skillId?: string
): Promise<LearningResource[]> {
  return apiClient<LearningResource[]>("/api/v1/onboarding/catalogs/learning-resources", {
    method: "GET",
    params: { skill_id: skillId },
  });
}

// ====================================================================
// 2. Skill Gaps & Preview
// ====================================================================

export async function previewOnboardingCaseApi(
  candidateId: string,
  jobOpeningId: string
): Promise<OnboardingCasePreview> {
  return apiClient<OnboardingCasePreview>("/api/v1/onboarding/cases/preview", {
    method: "GET",
    params: {
      candidate_id: candidateId,
      job_opening_id: jobOpeningId,
    },
  });
}

export async function analyzeSkillGapsApi(
  candidateId: string,
  jobOpeningId: string
): Promise<SkillGapAnalysis> {
  return apiClient<SkillGapAnalysis>("/api/v1/onboarding/skill-gaps", {
    method: "GET",
    params: {
      candidate_id: candidateId,
      job_opening_id: jobOpeningId,
    },
  });
}

// ====================================================================
// 3. Cases & Multi-Brain Journey Orchestration
// ====================================================================

export async function createOnboardingCaseApi(
  payload: OnboardingCaseCreatePayload
): Promise<OnboardingCase> {
  return apiClient<OnboardingCase>("/api/v1/onboarding/cases", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listOnboardingCasesApi(filters?: {
  status?: string;
  managerId?: string;
  departmentId?: string;
}): Promise<{ cases: OnboardingCase[]; total: number }> {
  return apiClient<{ cases: OnboardingCase[]; total: number }>("/api/v1/onboarding/cases", {
    method: "GET",
    params: {
      status: filters?.status,
      manager_id: filters?.managerId,
      department_id: filters?.departmentId,
    },
  });
}

export async function getMyOnboardingCaseApi(): Promise<OnboardingCase | null> {
  return apiClient<OnboardingCase | null>("/api/v1/onboarding/cases/mine", {
    method: "GET",
  });
}

export async function getOnboardingCaseApi(id: string): Promise<OnboardingCase> {
  return apiClient<OnboardingCase>(`/api/v1/onboarding/cases/${id}`, {
    method: "GET",
  });
}

export async function getOnboardingPlanApi(id: string): Promise<OnboardingPlan> {
  return apiClient<OnboardingPlan>(`/api/v1/onboarding/plans/${id}`, {
    method: "GET",
  });
}

export async function getOnboardingCaseDiffsApi(caseId: string): Promise<PlanDifference[]> {
  return apiClient<PlanDifference[]>(`/api/v1/onboarding/cases/${caseId}/diffs`, {
    method: "GET",
  });
}

// ====================================================================
// 4. Human Review Gates & Manager Edits
// ====================================================================

export async function hrReviewPlanApi(
  planId: string,
  payload: HRReviewPayload
): Promise<OnboardingPlan> {
  return apiClient<OnboardingPlan>(`/api/v1/onboarding/plans/${planId}/hr-review`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function managerReviewPlanApi(
  planId: string,
  payload: ManagerReviewPayload
): Promise<OnboardingPlan> {
  return apiClient<OnboardingPlan>(`/api/v1/onboarding/plans/${planId}/manager-review`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function addManagerTaskApi(
  planId: string,
  payload: ManagerTaskCreatePayload
): Promise<OnboardingPlanTask> {
  return apiClient<OnboardingPlanTask>(`/api/v1/onboarding/plans/${planId}/tasks`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ====================================================================
// 5. Task Execution, Blocker Reporting & Adaptive Replanning
// ====================================================================

export async function completeOnboardingTaskApi(
  taskId: string,
  payload: TaskCompletionPayload
): Promise<OnboardingPlanTask> {
  return apiClient<OnboardingPlanTask>(`/api/v1/onboarding/tasks/${taskId}/complete`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function reportTaskBlockerApi(
  taskId: string,
  payload: TaskBlockerPayload
): Promise<OnboardingPlanTask> {
  return apiClient<OnboardingPlanTask>(`/api/v1/onboarding/tasks/${taskId}/blocker`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function proposeAdaptiveReplanApi(
  caseId: string,
  payload: AdaptiveReplanPayload
): Promise<OnboardingPlan> {
  return apiClient<OnboardingPlan>(`/api/v1/onboarding/cases/${caseId}/replan`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ====================================================================
// 6. EnterPro Handoff (Simulated Demonstration Adapter)
// ====================================================================

export async function dispatchToEnterProApi(
  caseId: string,
  payload: EnterProHandoffPayload
): Promise<EnterProHandoffResponse> {
  return apiClient<EnterProHandoffResponse>(`/api/v1/onboarding/cases/${caseId}/enterpro-handoff`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
