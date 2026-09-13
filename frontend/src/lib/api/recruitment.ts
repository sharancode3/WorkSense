import { apiClient } from "./client";
import {
  CandidateApplication,
  CandidateMatchEvaluation,
  CandidateRankingListResponse,
  InterviewInsight,
  InterviewKit,
  InterviewQuestionItem,
  InterviewResponseRecord,
  InterviewSession,
  JobOpening,
  JobOpeningCreatePayload,
  JobRequirementSkillItem,
  JobRequirementVersion,
  JobRequirementWeights,
  MultiBrainRun,
  RecruitmentDecision,
  ResumeDocument,
  ResumeExtraction,
  SkillNormalizationItem,
} from "@/types/recruitment";

// ====================================================================
// 1. Job Openings & Requirements
// ====================================================================

export async function listJobOpeningsApi(status?: string): Promise<JobOpening[]> {
  return apiClient<JobOpening[]>("/api/v1/recruitment/jobs", {
    method: "GET",
    params: { status },
  });
}

export async function getJobOpeningApi(id: string): Promise<JobOpening> {
  return apiClient<JobOpening>(`/api/v1/recruitment/jobs/${id}`, {
    method: "GET",
  });
}

export async function createJobOpeningApi(payload: JobOpeningCreatePayload): Promise<JobOpening> {
  return apiClient<JobOpening>("/api/v1/recruitment/jobs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateJobRequirementsApi(
  jobId: string,
  payload: {
    responsibilities: string;
    required_skills: JobRequirementSkillItem[];
    preferred_skills: JobRequirementSkillItem[];
    min_years_experience: number;
    weights: JobRequirementWeights;
  }
): Promise<JobRequirementVersion> {
  const formData = new FormData();
  formData.append("responsibilities", payload.responsibilities);
  formData.append("min_years_experience", String(payload.min_years_experience));
  formData.append("required_skills_json", JSON.stringify(payload.required_skills));
  formData.append("preferred_skills_json", JSON.stringify(payload.preferred_skills));
  formData.append("weights_json", JSON.stringify(payload.weights));

  return apiClient<JobRequirementVersion>(`/api/v1/recruitment/jobs/${jobId}/requirements`, {
    method: "POST",
    body: formData,
  });
}

// ====================================================================
// 2. Resume Ingestion & Extraction
// ====================================================================

export async function uploadResumeApi(formData: FormData): Promise<ResumeDocument> {
  return apiClient<ResumeDocument>("/api/v1/recruitment/resumes/upload", {
    method: "POST",
    body: formData,
  });
}

export async function extractResumeEvidenceApi(resumeId: string): Promise<ResumeExtraction> {
  return apiClient<ResumeExtraction>(`/api/v1/recruitment/resumes/${resumeId}/extract`, {
    method: "POST",
  });
}

export async function listCandidateSkillNormalizationsApi(
  candidateId: string
): Promise<SkillNormalizationItem[]> {
  return apiClient<SkillNormalizationItem[]>(`/api/v1/recruitment/candidates/${candidateId}/skills/normalizations`, {
    method: "GET",
  });
}

// ====================================================================
// 3. Match Calculation & Rankings
// ====================================================================

export async function calculateCandidateMatchApi(
  jobId: string,
  candidateId: string
): Promise<CandidateMatchEvaluation> {
  return apiClient<CandidateMatchEvaluation>(
    `/api/v1/recruitment/jobs/${jobId}/candidates/${candidateId}/match`,
    {
      method: "POST",
    }
  );
}

export async function getCandidateRankingsApi(jobId: string): Promise<CandidateRankingListResponse> {
  return apiClient<CandidateRankingListResponse>(`/api/v1/recruitment/jobs/${jobId}/rankings`, {
    method: "GET",
  });
}

// ====================================================================
// 4. Interview Kits & Sessions
// ====================================================================

export async function generateInterviewKitApi(payload: {
  job_opening_id: string;
  candidate_id?: string | null;
  title: string;
  stage?: string;
  focus_competencies?: string[];
}): Promise<InterviewKit> {
  return apiClient<InterviewKit>("/api/v1/recruitment/interviews/kits", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listInterviewKitsApi(jobOpeningId: string): Promise<InterviewKit[]> {
  return apiClient<InterviewKit[]>("/api/v1/recruitment/interviews/kits", {
    method: "GET",
    params: { job_opening_id: jobOpeningId },
  });
}

export async function getInterviewKitApi(kitId: string): Promise<InterviewKit> {
  return apiClient<InterviewKit>(`/api/v1/recruitment/interviews/kits/${kitId}`, {
    method: "GET",
  });
}

export async function updateInterviewKitApi(
  kitId: string,
  payload: { questions: InterviewQuestionItem[]; title?: string }
): Promise<InterviewKit> {
  return apiClient<InterviewKit>(`/api/v1/recruitment/interviews/kits/${kitId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function approveInterviewKitApi(kitId: string): Promise<InterviewKit> {
  return apiClient<InterviewKit>(`/api/v1/recruitment/interviews/kits/${kitId}/approve`, {
    method: "POST",
  });
}

export async function listInterviewSessionsApi(jobOpeningId: string): Promise<InterviewSession[]> {
  return apiClient<InterviewSession[]>("/api/v1/recruitment/interviews/sessions", {
    method: "GET",
    params: { job_opening_id: jobOpeningId },
  });
}

export async function getInterviewSessionApi(sessionId: string): Promise<InterviewSession> {
  return apiClient<InterviewSession>(`/api/v1/recruitment/interviews/sessions/${sessionId}`, {
    method: "GET",
  });
}

export async function createInterviewSessionApi(payload: {
  interview_kit_id: string;
  candidate_id: string;
  scheduled_at: string;
  notes?: string;
}): Promise<InterviewSession> {
  return apiClient<InterviewSession>("/api/v1/recruitment/interviews/sessions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function recordInterviewResponseApi(
  sessionId: string,
  payload: {
    question_index: number;
    question_text: string;
    competency: string;
    candidate_response_text: string;
    interviewer_notes?: string;
  }
): Promise<InterviewResponseRecord> {
  return apiClient<InterviewResponseRecord>(`/api/v1/recruitment/interviews/sessions/${sessionId}/responses`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function completeInterviewApi(sessionId: string): Promise<InterviewInsight> {
  return apiClient<InterviewInsight>(`/api/v1/recruitment/interviews/sessions/${sessionId}/complete`, {
    method: "POST",
  });
}

export async function getInterviewInsightsApi(sessionId: string): Promise<InterviewInsight> {
  return apiClient<InterviewInsight>(`/api/v1/recruitment/interviews/sessions/${sessionId}/insights`, {
    method: "GET",
  });
}

// ====================================================================
// 5. Accountable Human Decision Gate
// ====================================================================

export async function recordRecruitmentDecisionApi(
  jobId: string,
  candidateId: string,
  payload: {
    decision: string;
    rationale: string;
    is_override: boolean;
    override_reason?: string | null;
    candidate_facing_status?: string;
  }
): Promise<RecruitmentDecision> {
  return apiClient<RecruitmentDecision>(`/api/v1/recruitment/jobs/${jobId}/candidates/${candidateId}/decision`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ====================================================================
// 6. Multi-Brain Telemetry
// ====================================================================

export async function listMultiBrainRunsApi(): Promise<MultiBrainRun[]> {
  return apiClient<MultiBrainRun[]>("/api/v1/recruitment/telemetry/runs", {
    method: "GET",
  });
}

// ====================================================================
// 7. Candidate Privacy Shield
// ====================================================================

export async function getMyApplicationsApi(): Promise<CandidateApplication[]> {
  return apiClient<CandidateApplication[]>("/api/v1/recruitment/candidates/me/applications", {
    method: "GET",
  });
}
