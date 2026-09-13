/**
 * Stage 3: Core Workforce Data Layer TypeScript Definitions
 */

export interface Department {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  parent_department_id?: string | null;
  head_profile_id?: string | null;
  head_name?: string | null;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
  children?: Department[];
}

export interface DepartmentListResponse {
  items: Department[];
  total: number;
}

export interface RoleSkillRequirement {
  id: string;
  job_role_id: string;
  skill_id: string;
  skill_name: string;
  skill_category: string;
  minimum_level: number;
  importance: "required" | "preferred" | "nice_to_have";
}

export interface JobRole {
  id: string;
  organization_id: string;
  department_id: string;
  department_name?: string | null;
  title: string;
  code: string;
  level: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
  required_skills?: RoleSkillRequirement[];
}

export interface JobRoleListResponse {
  items: JobRole[];
  total: number;
}

export interface SkillRelationshipDTO {
  id: string;
  target_skill_id: string;
  target_skill_name: string;
  relationship_type: "ADJACENT_TO" | "PREREQUISITE_OF" | "TRANSFERABLE_TO" | "SPECIALIZATION_OF";
  similarity_weight: number;
  is_bidirectional: boolean;
}

export interface Skill {
  id: string;
  code: string;
  name: string;
  category: string;
  description?: string | null;
  aliases?: string[];
  relationships?: SkillRelationshipDTO[];
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SkillListResponse {
  items: Skill[];
  total: number;
}

export interface SkillGraphNode {
  id: string;
  label: string;
  category: string;
  node_type: "skill" | "role" | "person";
  proficiency_level?: number | null;
  confidence_band?: string | null;
}

export interface SkillGraphEdge {
  id: string;
  source: string;
  target: string;
  relationship_type: string;
  weight: number;
  label: string;
}

export interface SkillGraphResponse {
  nodes: SkillGraphNode[];
  edges: SkillGraphEdge[];
  total_nodes: number;
  total_edges: number;
}

export interface Source {
  id: string;
  organization_id?: string | null;
  name: string;
  source_type: "resume" | "github" | "assessment" | "interview" | "performance_review" | "manual";
  trust_score: number;
  created_at?: string;
}

export interface EvidenceItem {
  id: string;
  source_id: string;
  source_name: string;
  source_type: string;
  uri?: string | null;
  raw_payload_snippet?: string | null;
  extracted_claim?: string | null;
  observed_at: string;
  created_at?: string;
}

export interface PersonSkill {
  id: string;
  person_id: string;
  person_type: "candidate" | "employee";
  skill_id: string;
  skill_name: string;
  skill_category: string;
  proficiency_level: number;
  verification_status: "unverified" | "self_reported" | "verified" | "disputed";
  confidence_score: number;
  evidence_count: number;
}

export interface TimelineEvent {
  id: string;
  event_type: string;
  title: string;
  description: string;
  occurred_at: string;
  actor_name?: string | null;
}

export interface CandidateProfile {
  id: string;
  organization_id?: string | null;
  full_name: string;
  email: string;
  phone?: string | null;
  status: "new" | "screening" | "interviewing" | "offered" | "offer_accepted" | "converted" | "rejected";
  applied_role_id?: string | null;
  applied_role_title?: string | null;
  created_at?: string;
  record_status?: string | null;
  lifecycle_state?: string | null;
}

export interface CandidateListResponse {
  items: CandidateProfile[];
  total: number;
}

export interface CandidateTwin {
  candidate: CandidateProfile;
  skills: PersonSkill[];
  evidence: EvidenceItem[];
  completeness_score: number;
  timeline: TimelineEvent[];
}

export interface Employee {
  id: string;
  organization_id: string;
  profile_id: string;
  email: string;
  full_name: string;
  employee_code: string;
  department_id: string;
  department_name?: string | null;
  job_role_id: string;
  job_role_title?: string | null;
  employment_type: string;
  status: "active" | "suspended" | "terminated" | "on_leave";
  joined_at: string;
  created_at?: string;
}

export interface EmployeeListResponse {
  items: Employee[];
  total: number;
}

export interface Goal {
  id: string;
  employee_id: string;
  title: string;
  description?: string | null;
  status: "not_started" | "in_progress" | "completed" | "cancelled";
  progress_percentage: number;
  target_date?: string | null;
  weight: number;
  created_at?: string;
}

export interface FeedbackRecord {
  id: string;
  recipient_employee_id: string;
  recipient_name?: string;
  author_profile_id?: string | null;
  author_name?: string | null;
  feedback_type: "peer_praise" | "manager_1on1" | "performance_review" | "coaching";
  content: string;
  visibility: "public" | "manager_and_hr" | "private_to_recipient";
  rating?: number | null;
  created_at?: string;
}

export interface AttendanceSummary {
  employee_id: string;
  total_recorded_days: number;
  present_days: number;
  remote_days: number;
  sick_leave_days: number;
  vacation_days: number;
  late_check_ins: number;
  attendance_rate: number;
}

export interface EmployeeTwin {
  employee: Employee;
  manager?: {
    id: string;
    profile_id: string;
    full_name: string;
    email: string;
  } | null;
  direct_reports: Array<{
    id: string;
    profile_id: string;
    full_name: string;
    email: string;
    employee_code: string;
    job_role_title?: string | null;
  }>;
  skills: PersonSkill[];
  evidence: EvidenceItem[];
  goals: Goal[];
  feedback: FeedbackRecord[];
  attendance?: AttendanceSummary | null;
  assignment_history: Array<{
    id: string;
    department_name: string;
    job_role_title: string;
    start_date: string;
    end_date?: string | null;
    is_primary: boolean;
  }>;
}

export interface CandidateConversionPayload {
  department_id: string;
  job_role_id: string;
  manager_employee_id?: string | null;
  employee_code: string;
  start_date: string;
}

export interface CandidateConversionResponse {
  success: boolean;
  message: string;
  conversion_id: string;
  candidate_id: string;
  employee_id: string;
  employee_code: string;
  carried_skill_count: number;
  carried_evidence_count: number;
}

export interface PolicyVersion {
  id: string;
  policy_id: string;
  version_number: string;
  document_url: string;
  summary: string;
  effective_date: string;
  status: "draft" | "active" | "superseded" | "archived";
  content?: string | null;
  uploaded_by_id?: string | null;
  uploaded_by_name?: string | null;
  created_at: string;
}

export interface PolicyDocument {
  id: string;
  organization_id: string;
  title: string;
  category: string;
  description?: string | null;
  active_version?: PolicyVersion | null;
  versions?: PolicyVersion[];
  created_at: string;
  updated_at: string;
}

export interface PolicyListResponse {
  items: PolicyDocument[];
  total: number;
}

export interface DataQualityIssue {
  id: string;
  organization_id: string;
  rule_id: string;
  rule_name: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  entity_type: string;
  entity_id: string;
  description: string;
  suggested_action: string;
  status: "open" | "investigating" | "resolved" | "dismissed";
  detected_at: string;
  resolved_at?: string | null;
  resolved_by_id?: string | null;
  resolution_notes?: string | null;
}

export interface DataQualityAuditResponse {
  scanned_at: string;
  total: number;
  critical_count: number;
  warning_count: number;
  info_count: number;
  issues: DataQualityIssue[];
}
