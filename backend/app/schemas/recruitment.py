"""Pydantic schemas for Stage 4: Recruitment and Interview Intelligence."""

from typing import Any, Dict, List, Literal, Optional, Union
from pydantic import BaseModel, Field


# ====================================================================
# 1. Job Opening & Requirements Schemas
# ====================================================================

class JobRequirementSkillItem(BaseModel):
    skill_id: str
    skill_name: str
    min_proficiency: int = Field(default=1, ge=1, le=5)
    weight: float = Field(default=1.0, ge=0.0, le=1.0)
    importance: Literal["required", "preferred"] = "required"


class JobRequirementWeights(BaseModel):
    required_skills: float = Field(default=0.45, ge=0.0, le=1.0)
    preferred_skills: float = Field(default=0.20, ge=0.0, le=1.0)
    evidence_strength: float = Field(default=0.20, ge=0.0, le=1.0)
    experience_alignment: float = Field(default=0.15, ge=0.0, le=1.0)


class JobOpeningCreate(BaseModel):
    department_id: str
    job_role_id: str
    requisition_code: str = Field(..., min_length=3, max_length=50)
    title: str = Field(..., min_length=3, max_length=150)
    location: str = "Remote"
    employment_type: Literal["full_time", "part_time", "contract"] = "full_time"
    target_headcount: int = Field(default=1, ge=1)
    responsibilities: str = Field(..., min_length=10)
    required_skills: List[JobRequirementSkillItem] = Field(default_factory=list)
    preferred_skills: List[JobRequirementSkillItem] = Field(default_factory=list)
    min_years_experience: float = Field(default=0.0, ge=0.0)
    weights: JobRequirementWeights = Field(default_factory=JobRequirementWeights)


class JobRequirementVersionResponse(BaseModel):
    id: str
    job_opening_id: str
    version_number: int
    responsibilities: str
    required_skills: List[JobRequirementSkillItem]
    preferred_skills: List[JobRequirementSkillItem]
    min_years_experience: float
    weights: Dict[str, float]
    quality_audit_flags: List[str]
    is_active: bool
    created_at: str


class JobOpeningResponse(BaseModel):
    id: str
    organization_id: str
    department_id: str
    department_name: Optional[str] = None
    job_role_id: str
    job_role_title: Optional[str] = None
    requisition_code: str
    title: str
    location: str
    employment_type: str
    target_headcount: int
    hiring_manager_profile_id: Optional[str] = None
    recruiter_profile_id: Optional[str] = None
    status: Literal["draft", "active", "paused", "closed"]
    current_requirement_version: int
    active_requirement: Optional[JobRequirementVersionResponse] = None
    candidate_count: int = 0
    created_at: str
    updated_at: str


# ====================================================================
# 2. Resume Ingestion & Parsing Schemas
# ====================================================================

class ResumeDocumentResponse(BaseModel):
    id: str
    organization_id: str
    candidate_id: str
    candidate_name: Optional[str] = None
    job_opening_id: Optional[str] = None
    file_name: str
    file_size_bytes: int
    mime_type: str
    sha256_hash: str
    page_count: int
    parser_name: str
    is_ocr_required: bool
    parsing_status: Literal["uploaded", "parsing", "extracted", "ocr_required", "failed"]
    error_message: Optional[str] = None
    uploaded_at: str


class WorkExperienceEntry(BaseModel):
    company: str
    title: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_current: bool = False
    responsibilities: List[str] = Field(default_factory=list)
    demonstrated_skills: List[str] = Field(default_factory=list)


class ProjectEntry(BaseModel):
    name: str
    description: str
    technologies: List[str] = Field(default_factory=list)
    role: Optional[str] = None
    link: Optional[str] = None


class ExtractedSkillItem(BaseModel):
    name: str
    category: Optional[str] = None
    source_context: str
    page_number: Optional[int] = 1


class ResumeExtractionDTO(BaseModel):
    """Schema expected from Qwen for structured resume evidence extraction."""
    summary: str
    work_experiences: List[WorkExperienceEntry] = Field(default_factory=list)
    projects: List[ProjectEntry] = Field(default_factory=list)
    education: List[Dict[str, Any]] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    extracted_skills: List[ExtractedSkillItem] = Field(default_factory=list)
    total_years_experience: float = 0.0


class ResumeExtractionResponse(BaseModel):
    id: str
    resume_id: str
    candidate_id: str
    model_version: str
    prompt_version: str
    summary: Optional[str] = None
    work_experiences: List[WorkExperienceEntry]
    projects: List[ProjectEntry]
    education: List[Dict[str, Any]]
    certifications: List[str]
    extracted_skills: List[ExtractedSkillItem]
    review_status: Literal["pending_review", "accepted", "corrected", "rejected"]
    reviewed_by: Optional[str] = None
    created_at: str


# ====================================================================
# 3. Skill Normalization Schemas
# ====================================================================

class SkillNormalizationItem(BaseModel):
    id: str
    raw_phrase: str
    canonical_skill_id: Optional[str] = None
    canonical_skill_name: Optional[str] = None
    canonical_skill_code: Optional[str] = None
    match_method: Literal["exact_canonical", "exact_alias", "graph_adjacent", "controlled_fuzzy", "ambiguous", "unresolved"]
    confidence: float
    review_status: Literal["pending", "confirmed", "overridden", "rejected"]
    created_at: str


class SkillNormalizationUpdateRequest(BaseModel):
    canonical_skill_id: str
    review_status: Literal["confirmed", "overridden", "rejected"] = "confirmed"


# ====================================================================
# 4. Transparent Match & Ranking Schemas
# ====================================================================

class CriterionScoreDetail(BaseModel):
    criterion_name: str
    weight: float
    raw_score: float  # 0.0 to 100.0
    weighted_contribution: float  # raw_score * weight
    evidence_citations: List[str] = Field(default_factory=list)
    notes: Optional[str] = None


class CandidateMatchEvaluationResponse(BaseModel):
    id: str
    job_opening_id: str
    requirement_version_id: str
    candidate_id: str
    candidate_name: str
    candidate_email: str
    rank_position: int
    overall_match_score: float  # 0 to 100
    required_skill_coverage: float  # 0 to 100
    preferred_skill_coverage: float  # 0 to 100
    evidence_strength_score: float  # 0 to 100
    experience_alignment_score: float  # 0 to 100
    criterion_breakdown: Dict[str, CriterionScoreDetail]
    qwen_explanation: Optional[str] = None
    explanation_grounding_status: Literal["grounded", "unverified", "failed_grounding", "degraded_mode"]
    is_stale: bool
    calculated_at: str


class CandidateRankingListResponse(BaseModel):
    job_opening_id: str
    job_title: str
    requirement_version: int
    candidates: List[CandidateMatchEvaluationResponse]
    total_evaluated: int


class CandidateExplanationDTO(BaseModel):
    """Schema expected from Qwen for ranking rationale synthesis."""
    comparative_rationale: str
    exact_skills_validated: List[str]
    adjacent_skills_credited: List[Dict[str, Any]] = Field(default_factory=list)
    missing_critical_skills: List[str] = Field(default_factory=list)
    evidence_citations: List[Union[str, Dict[str, Any]]] = Field(default_factory=list)
    confidence_band: Literal["high", "moderate", "limited", "insufficient"] = "moderate"
    needs_human_review: bool = True


# ====================================================================
# 5. Interview Kits & Rubrics Schemas
# ====================================================================

class RubricLevel(BaseModel):
    level: int  # 1 to 5
    title: str
    description: str


class InterviewQuestionItem(BaseModel):
    question_index: int
    competency: str
    question_type: Literal["opening", "competency", "situational", "evidence_validation", "follow_up"]
    question_text: str
    why_asking: str
    expected_evidence: str
    rubric: List[RubricLevel]
    follow_up_prompts: List[str] = Field(default_factory=list)
    interviewer_notes: Optional[str] = None


class InterviewKitCreate(BaseModel):
    job_opening_id: str
    candidate_id: Optional[str] = None
    title: str
    stage: str = "technical_round_1"
    focus_competencies: Optional[List[str]] = None


class InterviewKitUpdate(BaseModel):
    title: Optional[str] = None
    questions: List[InterviewQuestionItem]


class InterviewKitResponse(BaseModel):
    id: str
    organization_id: str
    job_opening_id: str
    candidate_id: Optional[str] = None
    candidate_name: Optional[str] = None
    title: str
    stage: str
    questions: List[InterviewQuestionItem]
    status: Literal["draft", "approved", "archived"]
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    created_at: str
    updated_at: str


class InterviewKitDTO(BaseModel):
    """Schema expected from Qwen Interview Architect."""
    title: str
    stage: str
    questions: List[InterviewQuestionItem]


# ====================================================================
# 6. Interview Session & Response Schemas
# ====================================================================

class InterviewSessionCreate(BaseModel):
    interview_kit_id: str
    candidate_id: str
    scheduled_at: str
    notes: Optional[str] = None


class InterviewResponseRecordRequest(BaseModel):
    question_index: int
    question_text: str
    competency: str
    candidate_response_text: str
    interviewer_notes: Optional[str] = None


class InterviewResponseRecord(BaseModel):
    id: str
    question_index: int
    question_text: str
    competency: str
    candidate_response_text: str
    interviewer_notes: Optional[str] = None
    recorded_at: str


class InterviewSessionResponse(BaseModel):
    id: str
    organization_id: str
    interview_kit_id: str
    candidate_id: str
    candidate_name: str
    interviewer_profile_id: str
    interviewer_name: Optional[str] = None
    scheduled_at: str
    session_status: Literal["scheduled", "in_progress", "completed", "cancelled"]
    completed_at: Optional[str] = None
    notes: Optional[str] = None
    responses: List[InterviewResponseRecord] = Field(default_factory=list)
    created_at: str


# ====================================================================
# 7. Structured Interview Insights Schemas
# ====================================================================

class RubricAssessmentItem(BaseModel):
    competency: str
    assessed_level: int = Field(ge=1, le=5)
    evidence_demonstrated: str
    evidence_missing: Optional[str] = None


class InterviewInsightDTO(BaseModel):
    """Schema expected from Qwen Interview Evidence Analyst."""
    summary: str
    rubric_analysis: List[RubricAssessmentItem]
    demonstrated_strengths: List[str]
    evidence_gaps: List[str]
    confidence_band: Literal["high", "moderate", "limited", "insufficient"]
    follow_up_recommendations: List[str]


class InterviewInsightResponse(BaseModel):
    id: str
    interview_session_id: str
    candidate_id: str
    summary: str
    rubric_analysis: List[RubricAssessmentItem]
    demonstrated_strengths: List[str]
    evidence_gaps: List[str]
    confidence_band: Literal["high", "moderate", "limited", "insufficient"]
    follow_up_recommendations: List[str]
    review_status: Literal["ai_analyzed", "human_approved", "human_overridden"]
    reviewed_by: Optional[str] = None
    created_at: str


# ====================================================================
# 8. Human Decision Gate Schemas
# ====================================================================

class RecruitmentDecisionCreate(BaseModel):
    decision: Literal["advance", "shortlist", "hold", "request_info", "schedule_interview", "offer", "reject", "withdrawn"]
    rationale: str = Field(..., min_length=5)
    is_override: bool = False
    override_reason: Optional[str] = None
    candidate_facing_status: str = "Under Review"


class RecruitmentDecisionResponse(BaseModel):
    id: str
    organization_id: str
    job_opening_id: str
    candidate_id: str
    decided_by: str
    decided_by_name: Optional[str] = None
    decision: str
    ai_recommendation: Optional[str] = None
    is_override: bool
    override_reason: Optional[str] = None
    rationale: str
    evidence_references: List[str]
    candidate_facing_status: str
    created_at: str


# ====================================================================
# 9. Multi-Brain Telemetry & Evaluation Schemas
# ====================================================================

class MultiBrainRunResponse(BaseModel):
    id: str
    organization_id: str
    role_name: str
    model_name: str
    prompt_version: str
    input_reference: str
    output_summary: Optional[str] = None
    duration_ms: int
    status: Literal["completed", "failed", "needs_review", "degraded_fallback"]
    error_details: Optional[str] = None
    created_at: str


class CandidateApplicationResponse(BaseModel):
    application_id: str
    job_id: Optional[str] = None
    job_title: str
    location: str
    status: str
    applied_at: str
