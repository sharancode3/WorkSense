-- WorkSense Stage 4: Recruitment & Interview Intelligence Migration
-- Migration: 20260913000003_recruitment_and_interviews.sql
-- Description: Establishes job requirements, resume documents & extractions, skill normalizations,
--              deterministic candidate rankings, interview kits & rubrics, interview sessions,
--              structured interview insights, accountable human decisions, and multi-brain audit telemetry.

-- ====================================================================
-- 1. Job Openings & Requirements Versioning
-- ====================================================================

CREATE TABLE IF NOT EXISTS job_openings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    job_role_id UUID NOT NULL REFERENCES job_roles(id) ON DELETE RESTRICT,
    requisition_code TEXT NOT NULL,
    title TEXT NOT NULL,
    location TEXT NOT NULL DEFAULT 'Remote',
    employment_type TEXT NOT NULL DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contract')),
    target_headcount INT NOT NULL DEFAULT 1 CHECK (target_headcount >= 1),
    hiring_manager_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    recruiter_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'closed')),
    current_requirement_version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_job_opening_code UNIQUE (organization_id, requisition_code)
);

CREATE INDEX IF NOT EXISTS idx_job_openings_org ON job_openings(organization_id);
CREATE INDEX IF NOT EXISTS idx_job_openings_dept ON job_openings(department_id);
CREATE INDEX IF NOT EXISTS idx_job_openings_status ON job_openings(status);

CREATE TABLE IF NOT EXISTS job_requirement_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_opening_id UUID NOT NULL REFERENCES job_openings(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    responsibilities TEXT NOT NULL,
    required_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    preferred_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    min_years_experience NUMERIC(4,1) NOT NULL DEFAULT 0.0 CHECK (min_years_experience >= 0.0),
    weights JSONB NOT NULL DEFAULT '{"required_skills": 0.45, "preferred_skills": 0.20, "evidence_strength": 0.20, "experience_alignment": 0.15}'::jsonb,
    quality_audit_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_job_req_version UNIQUE (job_opening_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_job_req_ver_job ON job_requirement_versions(job_opening_id);

-- ====================================================================
-- 2. Resume Documents & Text Extractions
-- ====================================================================

CREATE TABLE IF NOT EXISTS candidate_resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    job_opening_id UUID REFERENCES job_openings(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    sha256_hash TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    extracted_text TEXT,
    page_count INT NOT NULL DEFAULT 1,
    parser_name TEXT NOT NULL DEFAULT 'pypdf',
    is_ocr_required BOOLEAN NOT NULL DEFAULT false,
    parsing_status TEXT NOT NULL DEFAULT 'uploaded' CHECK (parsing_status IN ('uploaded', 'parsing', 'extracted', 'ocr_required', 'failed')),
    error_message TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resumes_org_cand ON candidate_resumes(organization_id, candidate_id);

CREATE TABLE IF NOT EXISTS resume_extractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID NOT NULL REFERENCES candidate_resumes(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    model_version TEXT NOT NULL,
    prompt_version TEXT NOT NULL,
    summary TEXT,
    work_experiences JSONB NOT NULL DEFAULT '[]'::jsonb,
    projects JSONB NOT NULL DEFAULT '[]'::jsonb,
    education JSONB NOT NULL DEFAULT '[]'::jsonb,
    certifications JSONB NOT NULL DEFAULT '[]'::jsonb,
    extracted_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    raw_entities JSONB NOT NULL DEFAULT '{}'::jsonb,
    review_status TEXT NOT NULL DEFAULT 'pending_review' CHECK (review_status IN ('pending_review', 'accepted', 'corrected', 'rejected')),
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resume_extractions_cand ON resume_extractions(candidate_id);

-- ====================================================================
-- 3. Skill Normalization Ledger
-- ====================================================================

CREATE TABLE IF NOT EXISTS skill_normalizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    raw_phrase TEXT NOT NULL,
    canonical_skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
    match_method TEXT NOT NULL CHECK (match_method IN ('exact_canonical', 'exact_alias', 'graph_adjacent', 'controlled_fuzzy', 'ambiguous', 'unresolved')),
    confidence NUMERIC(4,3) NOT NULL DEFAULT 0.500 CHECK (confidence >= 0.0 AND confidence <= 1.0),
    review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'confirmed', 'overridden', 'rejected')),
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_skill_norm_org_cand ON skill_normalizations(organization_id, candidate_id);

-- ====================================================================
-- 4. Transparent Candidate Match Evaluations & Rankings
-- ====================================================================

CREATE TABLE IF NOT EXISTS candidate_match_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    job_opening_id UUID NOT NULL REFERENCES job_openings(id) ON DELETE CASCADE,
    requirement_version_id UUID NOT NULL REFERENCES job_requirement_versions(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    rank_position INT NOT NULL DEFAULT 1,
    overall_match_score NUMERIC(5,2) NOT NULL CHECK (overall_match_score >= 0.0 AND overall_match_score <= 100.0),
    required_skill_coverage NUMERIC(5,2) NOT NULL CHECK (required_skill_coverage >= 0.0 AND required_skill_coverage <= 100.0),
    preferred_skill_coverage NUMERIC(5,2) NOT NULL CHECK (preferred_skill_coverage >= 0.0 AND preferred_skill_coverage <= 100.0),
    evidence_strength_score NUMERIC(5,2) NOT NULL CHECK (evidence_strength_score >= 0.0 AND evidence_strength_score <= 100.0),
    experience_alignment_score NUMERIC(5,2) NOT NULL CHECK (experience_alignment_score >= 0.0 AND experience_alignment_score <= 100.0),
    criterion_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    qwen_explanation TEXT,
    explanation_grounding_status TEXT NOT NULL DEFAULT 'unverified' CHECK (explanation_grounding_status IN ('grounded', 'unverified', 'failed_grounding', 'degraded_mode')),
    is_stale BOOLEAN NOT NULL DEFAULT false,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_match_eval UNIQUE (job_opening_id, requirement_version_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_match_eval_job_rank ON candidate_match_evaluations(job_opening_id, rank_position);

-- ====================================================================
-- 5. Structured Interview Kits & Observable Rubrics
-- ====================================================================

CREATE TABLE IF NOT EXISTS interview_kits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    job_opening_id UUID NOT NULL REFERENCES job_openings(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES candidate_profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    stage TEXT NOT NULL DEFAULT 'technical_round_1',
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'archived')),
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interview_kits_job ON interview_kits(job_opening_id);

-- ====================================================================
-- 6. Interview Sessions & Recorded Responses
-- ====================================================================

CREATE TABLE IF NOT EXISTS interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    interview_kit_id UUID NOT NULL REFERENCES interview_kits(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    interviewer_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    session_status TEXT NOT NULL DEFAULT 'scheduled' CHECK (session_status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_int_sess_org_cand ON interview_sessions(organization_id, candidate_id);

CREATE TABLE IF NOT EXISTS interview_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    question_index INT NOT NULL,
    question_text TEXT NOT NULL,
    competency TEXT NOT NULL,
    candidate_response_text TEXT NOT NULL,
    interviewer_notes TEXT,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_int_resp_sess ON interview_responses(interview_session_id);

-- ====================================================================
-- 7. Structured Interview Insights
-- ====================================================================

CREATE TABLE IF NOT EXISTS interview_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interview_session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    rubric_analysis JSONB NOT NULL DEFAULT '[]'::jsonb,
    demonstrated_strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
    evidence_gaps JSONB NOT NULL DEFAULT '[]'::jsonb,
    confidence_band TEXT NOT NULL DEFAULT 'moderate' CHECK (confidence_band IN ('high', 'moderate', 'limited', 'insufficient')),
    follow_up_recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
    review_status TEXT NOT NULL DEFAULT 'ai_analyzed' CHECK (review_status IN ('ai_analyzed', 'human_approved', 'human_overridden')),
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_int_insights_sess ON interview_insights(interview_session_id);

-- ====================================================================
-- 8. Accountable Human Decision Gate
-- ====================================================================

CREATE TABLE IF NOT EXISTS recruitment_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    job_opening_id UUID NOT NULL REFERENCES job_openings(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    decided_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    decision TEXT NOT NULL CHECK (decision IN ('advance', 'shortlist', 'hold', 'request_info', 'schedule_interview', 'offer', 'reject', 'withdrawn')),
    ai_recommendation TEXT,
    is_override BOOLEAN NOT NULL DEFAULT false,
    override_reason TEXT,
    rationale TEXT NOT NULL,
    evidence_references JSONB NOT NULL DEFAULT '[]'::jsonb,
    candidate_facing_status TEXT NOT NULL DEFAULT 'Under Review',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rec_decisions_job_cand ON recruitment_decisions(job_opening_id, candidate_id);

-- ====================================================================
-- 9. Multi-Brain Telemetry & Execution Ledger
-- ====================================================================

CREATE TABLE IF NOT EXISTS multi_brain_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role_name TEXT NOT NULL,
    model_name TEXT NOT NULL,
    prompt_version TEXT NOT NULL,
    input_reference TEXT NOT NULL,
    output_summary TEXT,
    duration_ms INT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('completed', 'failed', 'needs_review', 'degraded_fallback')),
    error_details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mb_runs_org ON multi_brain_runs(organization_id, role_name);

-- ====================================================================
-- 10. Row Level Security Policies
-- ====================================================================

ALTER TABLE job_openings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_requirement_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_normalizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_match_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_brain_runs ENABLE ROW LEVEL SECURITY;

-- Job Openings: Authenticated org members can read active jobs; Recruiters/HR/Admin can manage
CREATE POLICY job_openings_select ON job_openings FOR SELECT TO authenticated
    USING (organization_id IN (SELECT organization_id FROM organization_memberships WHERE profile_id = auth.uid() AND membership_status = 'active'));

CREATE POLICY job_openings_all ON job_openings FOR ALL TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM user_roles ur JOIN roles r ON ur.role_id = r.id
        WHERE ur.profile_id = auth.uid() AND r.name IN ('recruiter', 'hr', 'administrator')
    ));

-- Candidate Resumes: Candidate can view own resume; Recruiters/HR/Admin can manage
CREATE POLICY candidate_resumes_candidate_select ON candidate_resumes FOR SELECT TO authenticated
    USING (candidate_id IN (SELECT id FROM candidate_profiles WHERE profile_id = auth.uid()));

CREATE POLICY candidate_resumes_staff_all ON candidate_resumes FOR ALL TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM user_roles ur JOIN roles r ON ur.role_id = r.id
        WHERE ur.profile_id = auth.uid() AND r.name IN ('recruiter', 'hr', 'administrator')
    ));

-- Candidate Match Evaluations: Strictly forbidden to candidate role; Recruiters/HR/Admin can view/manage
CREATE POLICY match_eval_staff_all ON candidate_match_evaluations FOR ALL TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM user_roles ur JOIN roles r ON ur.role_id = r.id
        WHERE ur.profile_id = auth.uid() AND r.name IN ('recruiter', 'hr', 'administrator', 'manager')
    ));

-- Interview Kits & Sessions: Strictly forbidden to candidates; Accessible by assigned interviewers and HR/Recruiters
CREATE POLICY interview_kits_staff_all ON interview_kits FOR ALL TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM user_roles ur JOIN roles r ON ur.role_id = r.id
        WHERE ur.profile_id = auth.uid() AND r.name IN ('recruiter', 'hr', 'administrator', 'manager')
    ));

-- Recruitment Decisions: Candidate can view ONLY public status; full decision details restricted to staff
CREATE POLICY decisions_staff_all ON recruitment_decisions FOR ALL TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM user_roles ur JOIN roles r ON ur.role_id = r.id
        WHERE ur.profile_id = auth.uid() AND r.name IN ('recruiter', 'hr', 'administrator')
    ));
