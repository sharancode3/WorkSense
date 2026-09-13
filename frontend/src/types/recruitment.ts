/**
 * Stage 4: Recruitment & Interview Intelligence TypeScript Definitions
 */

export interface JobRequirementSkillItem {
  skill_id: string;
  skill_name: string;
  min_proficiency: number;
  weight: number;
  importance: "required" | "preferred";
}

export interface JobRequirementWeights {
  required_skills: number;
  preferred_skills: number;
  evidence_strength: number;
  experience_alignment: number;
}

export interface JobRequirementVersion {
  id: string;
  job_opening_id: string;
  version_number: number;
  responsibilities: string;
  required_skills: JobRequirementSkillItem[];
  preferred_skills: JobRequirementSkillItem[];
  min_years_experience: number;
  weights: JobRequirementWeights;
  quality_audit_flags: string[];
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export interface JobOpening {
  id: string;
  organization_id: string;
  department_id: string;
  department_name?: string | null;
  job_role_id: string;
  job_role_title?: string | null;
  requisition_code: string;
  title: string;
  location: string;
  employment_type: string;
  target_headcount: number;
  hiring_manager_profile_id?: string | null;
  recruiter_profile_id?: string | null;
  status: "active" | "draft" | "paused" | "closed" | "fulfilled";
  current_requirement_version: number;
  active_requirement?: JobRequirementVersion | null;
  candidate_count: number;
  created_at: string;
  updated_at: string;
}

export interface JobOpeningCreatePayload {
  department_id: string;
  job_role_id: string;
  requisition_code: string;
  title: string;
  location?: string;
  employment_type?: string;
  target_headcount?: number;
  responsibilities: string;
  required_skills: JobRequirementSkillItem[];
  preferred_skills?: JobRequirementSkillItem[];
  min_years_experience?: number;
  weights?: Partial<JobRequirementWeights>;
}

export interface ResumeDocument {
  id: string;
  organization_id: string;
  candidate_id: string;
  candidate_name?: string | null;
  job_opening_id?: string | null;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  sha256_hash: string;
  page_count: number;
  parser_name: string;
  is_ocr_required: boolean;
  parsing_status: "uploaded" | "parsing" | "extracted" | "ocr_required" | "failed";
  error_message?: string | null;
  uploaded_at: string;
}

export interface ExtractedSkillItem {
  name: string;
  category?: string | null;
  source_context: string;
  page_number?: number | null;
}

export interface WorkExperienceEntry {
  company: string;
  title: string;
  start_date?: string | null;
  end_date?: string | null;
  is_current: boolean;
  responsibilities: string[];
  demonstrated_skills: string[];
}

export interface ProjectEntry {
  name: string;
  description: string;
  technologies: string[];
  role?: string | null;
  link?: string | null;
}

export interface ResumeExtraction {
  id: string;
  resume_id: string;
  candidate_id: string;
  model_version: string;
  prompt_version: string;
  summary: string;
  work_experiences: WorkExperienceEntry[];
  projects: ProjectEntry[];
  education: Array<Record<string, unknown>>;
  certifications: string[];
  extracted_skills: ExtractedSkillItem[];
  total_years_experience: number;
  extraction_status: "raw_extracted" | "verified" | "rejected";
  reviewed_by?: string | null;
  created_at: string;
}

export interface SkillNormalizationItem {
  id: string;
  organization_id: string;
  candidate_id: string;
  raw_phrase: string;
  canonical_skill_id?: string | null;
  canonical_skill_name?: string | null;
  canonical_skill_category?: string | null;
  match_method: "exact_canonical" | "exact_alias" | "graph_adjacent" | "controlled_fuzzy" | "ambiguous" | "unresolved";
  confidence: number;
  review_status: "pending" | "confirmed" | "overridden" | "rejected";
  reviewed_by?: string | null;
  created_at: string;
}

export interface CriterionScoreDetail {
  criterion_name: string;
  weight: number;
  raw_score: number;
  weighted_contribution: number;
  evidence_citations: string[];
  notes?: string | null;
}

export interface CandidateMatchEvaluation {
  id: string;
  job_opening_id: string;
  requirement_version_id: string;
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  rank_position: number;
  overall_match_score: number;
  required_skill_coverage: number;
  preferred_skill_coverage: number;
  evidence_strength_score: number;
  experience_alignment_score: number;
  criterion_breakdown: Record<string, CriterionScoreDetail>;
  qwen_explanation?: string | null;
  explanation_grounding_status: "grounded" | "unverified" | "failed_grounding" | "degraded_mode";
  is_stale: boolean;
  calculated_at: string;
}

export interface CandidateRankingListResponse {
  job_opening_id: string;
  job_title: string;
  requirement_version: number;
  candidates: CandidateMatchEvaluation[];
  total_evaluated: number;
}

export interface RubricLevel {
  level: number;
  title: string;
  description: string;
}

export interface InterviewQuestionItem {
  question_index: number;
  competency: string;
  question_type: "opening" | "competency" | "situational" | "evidence_validation" | "follow_up";
  question_text: string;
  why_asking: string;
  expected_evidence: string;
  rubric: RubricLevel[];
  follow_up_prompts: string[];
  interviewer_notes?: string | null;
}

export interface InterviewKit {
  id: string;
  organization_id: string;
  job_opening_id: string;
  candidate_id?: string | null;
  candidate_name?: string | null;
  title: string;
  stage: string;
  questions: InterviewQuestionItem[];
  status: "draft" | "approved" | "archived";
  approved_by?: string | null;
  approved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface InterviewResponseRecord {
  id: string;
  question_index: number;
  question_text: string;
  competency: string;
  candidate_response_text: string;
  interviewer_notes?: string | null;
  recorded_at: string;
}

export interface InterviewSession {
  id: string;
  organization_id: string;
  interview_kit_id: string;
  candidate_id: string;
  candidate_name: string;
  interviewer_profile_id: string;
  interviewer_name?: string | null;
  scheduled_at: string;
  session_status: "scheduled" | "in_progress" | "completed" | "cancelled";
  completed_at?: string | null;
  notes?: string | null;
  responses: InterviewResponseRecord[];
  created_at: string;
}

export interface RubricAssessmentItem {
  competency: string;
  assessed_level: number;
  evidence_demonstrated: string;
  evidence_missing?: string | null;
}

export interface InterviewInsight {
  id: string;
  interview_session_id: string;
  candidate_id: string;
  summary: string;
  rubric_analysis: RubricAssessmentItem[];
  demonstrated_strengths: string[];
  evidence_gaps: string[];
  confidence_band: "high" | "moderate" | "limited" | "insufficient";
  follow_up_recommendations: string[];
  review_status: "ai_analyzed" | "human_approved" | "human_overridden";
  reviewed_by?: string | null;
  created_at: string;
}

export interface RecruitmentDecision {
  id: string;
  organization_id: string;
  job_opening_id: string;
  candidate_id: string;
  decided_by: string;
  decided_by_name?: string | null;
  decision: "advance" | "shortlist" | "hold" | "request_info" | "schedule_interview" | "offer" | "reject" | "withdrawn";
  ai_recommendation?: string | null;
  is_override: boolean;
  override_reason?: string | null;
  rationale: string;
  candidate_facing_status: string;
  created_at: string;
}

export interface MultiBrainRun {
  id: string;
  organization_id: string;
  role_name: string;
  model_name: string;
  prompt_version: string;
  input_ref?: string | null;
  output_summary?: string | null;
  duration_ms: number;
  status: "completed" | "failed" | "degraded_fallback";
  created_at: string;
}

export interface CandidateApplication {
  application_id: string;
  job_id?: string | null;
  job_title: string;
  location: string;
  status: string;
  applied_at: string;
}
