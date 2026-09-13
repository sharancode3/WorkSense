import { apiClient } from "./client";
import {
  AttendanceSummary,
  CandidateConversionPayload,
  CandidateConversionResponse,
  CandidateProfile,
  CandidateTwin,
  DataQualityAuditResponse,
  Department,
  Employee,
  EmployeeTwin,
  FeedbackRecord,
  Goal,
  JobRole,
  PolicyDocument,
  PolicyVersion,
  RoleSkillRequirement,
  Skill,
  SkillGraphResponse,
  Source,
  EvidenceItem,
} from "@/types/workforce";

// ====================================================================
// Departments & Hierarchy
// ====================================================================

export async function listDepartmentsApi(activeOnly: boolean = false): Promise<Department[]> {
  return apiClient<Department[]>("/api/v1/workforce/departments", {
    method: "GET",
    params: { active_only: activeOnly },
  });
}

export async function getDepartmentTreeApi(): Promise<Department[]> {
  return apiClient<Department[]>("/api/v1/workforce/departments/tree", {
    method: "GET",
  });
}

export async function createDepartmentApi(payload: {
  code: string;
  name: string;
  description?: string;
  parent_department_id?: string | null;
  head_profile_id?: string | null;
}): Promise<Department> {
  return apiClient<Department>("/api/v1/workforce/departments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateDepartmentApi(deptId: string, payload: Partial<Department>): Promise<Department> {
  return apiClient<Department>(`/api/v1/workforce/departments/${deptId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// ====================================================================
// Job Roles & Requirements
// ====================================================================

export async function listJobRolesApi(departmentId?: string): Promise<JobRole[]> {
  return apiClient<JobRole[]>("/api/v1/workforce/job-roles", {
    method: "GET",
    params: departmentId ? { department_id: departmentId } : undefined,
  });
}

export async function getJobRoleApi(roleId: string): Promise<JobRole> {
  return apiClient<JobRole>(`/api/v1/workforce/job-roles/${roleId}`, {
    method: "GET",
  });
}

export async function createJobRoleApi(payload: {
  department_id: string;
  code: string;
  title: string;
  role_family: string;
  seniority_level: string;
  summary: string;
  responsibilities?: string;
  skills?: Array<{
    skill_id: string;
    is_required: boolean;
    min_proficiency: number;
    importance_weight: number;
    demand_classification: "current" | "future";
  }>;
}): Promise<JobRole> {
  return apiClient<JobRole>("/api/v1/workforce/job-roles", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function addSkillToRoleApi(
  roleId: string,
  payload: {
    skill_id: string;
    is_required: boolean;
    min_proficiency: number;
    importance_weight: number;
    demand_classification: "current" | "future";
  }
): Promise<RoleSkillRequirement> {
  return apiClient<RoleSkillRequirement>(`/api/v1/workforce/job-roles/${roleId}/skills`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ====================================================================
// Skills & Relational Skill Graph
// ====================================================================

export async function listSkillsApi(params?: { category?: string; search?: string }): Promise<Skill[]> {
  return apiClient<Skill[]>("/api/v1/workforce/skills", {
    method: "GET",
    params,
  });
}

export async function getSkillApi(skillId: string): Promise<Skill> {
  return apiClient<Skill>(`/api/v1/workforce/skills/${skillId}`, {
    method: "GET",
  });
}

export async function getSkillGraphApi(params?: { query?: string; focused_skill_id?: string }): Promise<SkillGraphResponse> {
  return apiClient<SkillGraphResponse>("/api/v1/workforce/skills/graph", {
    method: "GET",
    params,
  });
}

export async function createSkillApi(payload: {
  code: string;
  name: string;
  category: string;
  description: string;
  aliases?: string[];
}): Promise<Skill> {
  return apiClient<Skill>("/api/v1/workforce/skills", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function addSkillRelationshipApi(
  skillId: string,
  payload: {
    target_skill_id: string;
    relationship_type: "ADJACENT_TO" | "PREREQUISITE_OF" | "TRANSFERABLE_TO" | "SPECIALIZATION_OF";
    similarity_weight: number;
    is_bidirectional?: boolean;
  }
): Promise<{ id: string }> {
  return apiClient<{ id: string }>(`/api/v1/workforce/skills/${skillId}/relationships`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ====================================================================
// Sources & Evidence Ledger
// ====================================================================

export async function listSourcesApi(): Promise<Source[]> {
  return apiClient<Source[]>("/api/v1/workforce/sources", {
    method: "GET",
  });
}

export async function listEvidenceForPersonApi(personId: string): Promise<EvidenceItem[]> {
  return apiClient<EvidenceItem[]>(`/api/v1/workforce/evidence/person/${personId}`, {
    method: "GET",
  });
}

// ====================================================================
// Candidates & Candidate Twin
// ====================================================================

export async function listCandidatesApi(params?: { status?: string; role_id?: string }): Promise<CandidateProfile[]> {
  return apiClient<CandidateProfile[]>("/api/v1/workforce/candidates", {
    method: "GET",
    params,
  });
}

export async function getCandidateApi(candId: string): Promise<CandidateProfile> {
  return apiClient<CandidateProfile>(`/api/v1/workforce/candidates/${candId}`, {
    method: "GET",
  });
}

export async function getCandidateTwinApi(candId: string): Promise<CandidateTwin> {
  return apiClient<CandidateTwin>(`/api/v1/workforce/candidates/${candId}/twin`, {
    method: "GET",
  });
}

export async function previewCandidateConversionApi(candId: string): Promise<{
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  target_role_id?: string | null;
  target_role_title?: string | null;
  suggested_department_id?: string | null;
  suggested_department_name?: string | null;
  skills_to_carry_forward: string[];
  evidence_items_to_carry_forward: number;
  is_eligible: boolean;
  eligibility_message: string;
}> {
  return apiClient<{
    candidate_id: string;
    candidate_name: string;
    candidate_email: string;
    target_role_id?: string | null;
    target_role_title?: string | null;
    suggested_department_id?: string | null;
    suggested_department_name?: string | null;
    skills_to_carry_forward: string[];
    evidence_items_to_carry_forward: number;
    is_eligible: boolean;
    eligibility_message: string;
  }>(`/api/v1/workforce/candidates/${candId}/convert/preview`, {
    method: "GET",
  });
}

export async function convertCandidateApi(
  candId: string,
  payload: CandidateConversionPayload
): Promise<CandidateConversionResponse> {
  return apiClient<CandidateConversionResponse>(`/api/v1/workforce/candidates/${candId}/convert`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ====================================================================
// Employees & Employee Twin
// ====================================================================

export async function listEmployeesApi(params?: { department_id?: string; status?: string }): Promise<Employee[]> {
  return apiClient<Employee[]>("/api/v1/workforce/employees", {
    method: "GET",
    params,
  });
}

export async function getEmployeeApi(empId: string): Promise<Employee> {
  return apiClient<Employee>(`/api/v1/workforce/employees/${empId}`, {
    method: "GET",
  });
}

export async function getEmployeeTwinApi(empId: string): Promise<EmployeeTwin> {
  return apiClient<EmployeeTwin>(`/api/v1/workforce/employees/${empId}/twin`, {
    method: "GET",
  });
}

// ====================================================================
// Goals, Feedback, Attendance
// ====================================================================

export async function listGoalsForEmployeeApi(empId: string): Promise<Goal[]> {
  return apiClient<Goal[]>(`/api/v1/workforce/goals/employee/${empId}`, {
    method: "GET",
  });
}

export async function createGoalApi(payload: {
  employee_id: string;
  title: string;
  description?: string;
  due_date: string;
  priority?: "low" | "medium" | "high" | "urgent";
  visibility?: "employee_visible" | "manager_and_employee" | "hr_only";
}): Promise<Goal> {
  return apiClient<Goal>("/api/v1/workforce/goals", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateGoalApi(goalId: string, payload: { progress_percentage?: number; status?: string }): Promise<Goal> {
  return apiClient<Goal>(`/api/v1/workforce/goals/${goalId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function listFeedbackForEmployeeApi(empId: string): Promise<FeedbackRecord[]> {
  return apiClient<FeedbackRecord[]>(`/api/v1/workforce/feedback/employee/${empId}`, {
    method: "GET",
  });
}

export async function createFeedbackApi(payload: {
  subject_employee_id: string;
  feedback_type: "peer" | "manager_1on1" | "quarterly_checkin" | "project_retrospective";
  visibility: "employee_visible" | "manager_and_employee" | "hr_restricted" | "confidential_hr";
  structured_strengths?: string[];
  development_areas?: string[];
}): Promise<FeedbackRecord> {
  return apiClient<FeedbackRecord>("/api/v1/workforce/feedback", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listAttendanceForEmployeeApi(empId: string): Promise<AttendanceSummary[]> {
  return apiClient<AttendanceSummary[]>(`/api/v1/workforce/attendance/employee/${empId}`, {
    method: "GET",
  });
}

// ====================================================================
// Policy Library
// ====================================================================

export async function listPoliciesApi(category?: string): Promise<PolicyDocument[]> {
  return apiClient<PolicyDocument[]>("/api/v1/workforce/policies", {
    method: "GET",
    params: category ? { category } : undefined,
  });
}

export async function getPolicyApi(policyId: string): Promise<PolicyDocument> {
  return apiClient<PolicyDocument>(`/api/v1/workforce/policies/${policyId}`, {
    method: "GET",
  });
}

export async function createPolicyApi(payload: {
  title: string;
  policy_code: string;
  category: string;
  description?: string;
}): Promise<PolicyDocument> {
  return apiClient<PolicyDocument>("/api/v1/workforce/policies", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createPolicyVersionApi(
  policyId: string,
  payload: {
    version_number: string;
    effective_date: string;
    file_name: string;
    file_size_bytes?: number;
    storage_path: string;
    sha256_hash: string;
    supersede_previous?: boolean;
  }
): Promise<PolicyVersion> {
  return apiClient<PolicyVersion>(`/api/v1/workforce/policies/${policyId}/versions`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ====================================================================
// Data Quality Engine
// ====================================================================

export async function getDataQualitySummaryApi(): Promise<DataQualityAuditResponse> {
  return apiClient<DataQualityAuditResponse>("/api/v1/workforce/data-quality", {
    method: "GET",
  });
}

export async function resolveDataQualityIssueApi(issueId: string): Promise<{ success: boolean; message: string }> {
  return apiClient<{ success: boolean; message: string }>(`/api/v1/workforce/data-quality/${issueId}/resolve`, {
    method: "POST",
  });
}
