-- WorkSense Stage 3: Core Workforce Data Layer
-- Migration: 20260913000002_core_workforce_data_layer.sql

-- ====================================================================
-- 1. Departments & Hierarchy
-- ====================================================================

CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    parent_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    head_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_org_dept_code UNIQUE (organization_id, code),
    CONSTRAINT check_no_self_parent CHECK (id != parent_department_id)
);

CREATE INDEX IF NOT EXISTS idx_departments_org ON departments(organization_id);
CREATE INDEX IF NOT EXISTS idx_departments_parent ON departments(parent_department_id);

-- ====================================================================
-- 2. Job Roles & Skill Requirements
-- ====================================================================

CREATE TABLE IF NOT EXISTS job_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    role_family TEXT NOT NULL,
    seniority_level TEXT NOT NULL,
    summary TEXT NOT NULL,
    responsibilities TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_org_role_code UNIQUE (organization_id, code)
);

CREATE INDEX IF NOT EXISTS idx_job_roles_org ON job_roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_job_roles_dept ON job_roles(department_id);

-- ====================================================================
-- 3. Skills Taxonomy & Relational Graph
-- ====================================================================

CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);

CREATE TABLE IF NOT EXISTS skill_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    alias TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_skill_aliases_skill ON skill_aliases(skill_id);

CREATE TABLE IF NOT EXISTS skill_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    target_skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL CHECK (relationship_type IN ('ADJACENT_TO', 'PREREQUISITE_OF', 'TRANSFERABLE_TO', 'SPECIALIZATION_OF')),
    similarity_weight NUMERIC(4,3) NOT NULL DEFAULT 0.500 CHECK (similarity_weight >= 0.000 AND similarity_weight <= 1.000),
    is_bidirectional BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT check_diff_skills CHECK (source_skill_id != target_skill_id),
    CONSTRAINT uq_skill_rel UNIQUE (source_skill_id, target_skill_id, relationship_type)
);

CREATE INDEX IF NOT EXISTS idx_skill_rel_source ON skill_relationships(source_skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_rel_target ON skill_relationships(target_skill_id);

CREATE TABLE IF NOT EXISTS role_skill_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_role_id UUID NOT NULL REFERENCES job_roles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    is_required BOOLEAN NOT NULL DEFAULT true,
    min_proficiency INTEGER NOT NULL DEFAULT 1 CHECK (min_proficiency BETWEEN 1 AND 5),
    importance_weight NUMERIC(4,3) NOT NULL DEFAULT 1.000 CHECK (importance_weight >= 0.000 AND importance_weight <= 1.000),
    demand_classification TEXT NOT NULL DEFAULT 'current' CHECK (demand_classification IN ('current', 'future')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_role_skill UNIQUE (job_role_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_role_skill_req ON role_skill_requirements(job_role_id, skill_id);

-- ====================================================================
-- 4. Sources & Evidence Ledger
-- ====================================================================

CREATE TABLE IF NOT EXISTS sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL CHECK (source_type IN (
        'candidate_self_entry', 'employee_self_entry', 'recruiter_entry',
        'manager_entry', 'hr_entry', 'csv_import', 'hris_export',
        'attendance_import', 'policy_document', 'demo_seed'
    )),
    name TEXT NOT NULL,
    external_reference TEXT,
    reliability_status TEXT NOT NULL DEFAULT 'unverified' CHECK (reliability_status IN ('verified', 'self_reported', 'unverified', 'imported')),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sources_org ON sources(organization_id);

CREATE TABLE IF NOT EXISTS evidence_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    subject_person_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
    claim_summary TEXT NOT NULL,
    source_type TEXT NOT NULL,
    source_uri TEXT NOT NULL,
    observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    effective_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    confidence_score NUMERIC(4,3) NOT NULL DEFAULT 0.500 CHECK (confidence_score >= 0.000 AND confidence_score <= 1.000),
    verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('verified', 'unverified', 'disputed', 'superseded', 'rejected')),
    verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    visibility TEXT NOT NULL DEFAULT 'public_workforce' CHECK (visibility IN ('public_workforce', 'manager_and_hr', 'hr_only', 'confidential_admin')),
    is_stale BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evidence_org_subject ON evidence_items(organization_id, subject_person_id);

CREATE TABLE IF NOT EXISTS evidence_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_item_id UUID NOT NULL REFERENCES evidence_items(id) ON DELETE CASCADE,
    target_entity_type TEXT NOT NULL CHECK (target_entity_type IN ('person_skill', 'goal', 'feedback', 'attendance', 'policy_version', 'conversion')),
    target_entity_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_evidence_link UNIQUE (evidence_item_id, target_entity_type, target_entity_id)
);

CREATE INDEX IF NOT EXISTS idx_evidence_links_target ON evidence_links(target_entity_type, target_entity_id);

-- ====================================================================
-- 5. Candidate Profiles & Lineage
-- ====================================================================

CREATE TABLE IF NOT EXISTS candidate_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    location TEXT,
    current_title TEXT,
    years_experience NUMERIC(4,1) DEFAULT 0.0,
    education_summary TEXT,
    summary TEXT,
    target_role_id UUID REFERENCES job_roles(id) ON DELETE SET NULL,
    consent_given BOOLEAN NOT NULL DEFAULT true,
    record_status TEXT NOT NULL DEFAULT 'active' CHECK (record_status IN ('active', 'shortlisted', 'offered', 'converted', 'archived', 'withdrawn')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_org_candidate_email UNIQUE (organization_id, email)
);

CREATE INDEX IF NOT EXISTS idx_candidates_org ON candidate_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidate_profiles(record_status);

-- ====================================================================
-- 6. Employees & Manager Hierarchy
-- ====================================================================

CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    candidate_id UUID UNIQUE REFERENCES candidate_profiles(id) ON DELETE SET NULL,
    employee_code TEXT NOT NULL,
    hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    job_role_id UUID NOT NULL REFERENCES job_roles(id) ON DELETE RESTRICT,
    employment_status TEXT NOT NULL DEFAULT 'active' CHECK (employment_status IN ('probation', 'active', 'leave', 'terminated', 'suspended')),
    work_location TEXT NOT NULL DEFAULT 'Remote',
    employment_type TEXT NOT NULL DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contract')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_org_employee_code UNIQUE (organization_id, employee_code)
);

CREATE INDEX IF NOT EXISTS idx_employees_org ON employees(organization_id);
CREATE INDEX IF NOT EXISTS idx_employees_dept ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(job_role_id);

CREATE TABLE IF NOT EXISTS manager_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    manager_employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL DEFAULT 'direct' CHECK (relationship_type IN ('direct', 'dotted_line')),
    is_current BOOLEAN NOT NULL DEFAULT true,
    effective_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT check_no_self_manage CHECK (employee_id != manager_employee_id)
);

CREATE INDEX IF NOT EXISTS idx_manager_rel_emp ON manager_relationships(employee_id);
CREATE INDEX IF NOT EXISTS idx_manager_rel_mgr ON manager_relationships(manager_employee_id);

-- ====================================================================
-- 7. Person Skills & Capability Ledger
-- ====================================================================

CREATE TABLE IF NOT EXISTS person_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    proficiency_level INTEGER NOT NULL CHECK (proficiency_level BETWEEN 1 AND 5),
    confidence_band TEXT NOT NULL DEFAULT 'limited' CHECK (confidence_band IN ('high', 'moderate', 'limited', 'insufficient')),
    verification_source TEXT NOT NULL CHECK (verification_source IN ('interview_verified', 'manager_verified', 'production_pr', 'self_declared', 'assessment')),
    is_stale BOOLEAN NOT NULL DEFAULT false,
    last_demonstrated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_person_skill UNIQUE (organization_id, person_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_person_skills_person ON person_skills(person_id);
CREATE INDEX IF NOT EXISTS idx_person_skills_skill ON person_skills(skill_id);

-- ====================================================================
-- 8. Candidate-to-Employee Conversion Ledger
-- ====================================================================

CREATE TABLE IF NOT EXISTS candidate_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL UNIQUE REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
    converted_by_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    converted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    carried_skill_count INTEGER NOT NULL DEFAULT 0,
    carried_evidence_count INTEGER NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- ====================================================================
-- 9. Goals, Feedback, & Attendance Summaries
-- ====================================================================

CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    goal_type TEXT NOT NULL DEFAULT 'individual' CHECK (goal_type IN ('individual', 'departmental', 'strategic')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled', 'overdue')),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
    creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    visibility TEXT NOT NULL DEFAULT 'employee_visible' CHECK (visibility IN ('employee_visible', 'manager_and_employee', 'hr_only')),
    related_job_role_id UUID REFERENCES job_roles(id) ON DELETE SET NULL,
    related_skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_goals_emp ON goals(employee_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);

CREATE TABLE IF NOT EXISTS feedback_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    subject_employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    author_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('peer', 'manager_1on1', 'quarterly_checkin', 'project_retrospective')),
    feedback_date DATE NOT NULL DEFAULT CURRENT_DATE,
    visibility TEXT NOT NULL DEFAULT 'employee_visible' CHECK (visibility IN ('employee_visible', 'manager_and_employee', 'hr_restricted', 'confidential_hr')),
    structured_strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
    development_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
    related_goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
    related_skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
    acknowledged_by_subject BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_emp ON feedback_records(subject_employee_id);
CREATE INDEX IF NOT EXISTS idx_feedback_author ON feedback_records(author_profile_id);

CREATE TABLE IF NOT EXISTS attendance_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    scheduled_workdays INTEGER NOT NULL DEFAULT 20,
    present_days INTEGER NOT NULL DEFAULT 20,
    approved_leave_days INTEGER NOT NULL DEFAULT 0,
    unapproved_absence_days INTEGER NOT NULL DEFAULT 0,
    remote_days INTEGER NOT NULL DEFAULT 0,
    onsite_days INTEGER NOT NULL DEFAULT 20,
    late_occurrences INTEGER NOT NULL DEFAULT 0,
    source_system TEXT NOT NULL DEFAULT 'hris_attendance_sync',
    freshness_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    data_quality_status TEXT NOT NULL DEFAULT 'verified' CHECK (data_quality_status IN ('verified', 'provisional', 'stale', 'incomplete')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_emp_attendance_period UNIQUE (employee_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_attendance_emp ON attendance_summaries(employee_id);

-- ====================================================================
-- 10. Policy Library & Versions
-- ====================================================================

CREATE TABLE IF NOT EXISTS policy_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    policy_code TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('remote_work', 'probation', 'benefits', 'code_of_conduct', 'travel', 'general')),
    description TEXT,
    document_owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    access_classification TEXT NOT NULL DEFAULT 'all_employees' CHECK (access_classification IN ('all_employees', 'managers_and_hr', 'hr_restricted')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_org_policy_code UNIQUE (organization_id, policy_code)
);

CREATE INDEX IF NOT EXISTS idx_policies_org ON policy_documents(organization_id);

CREATE TABLE IF NOT EXISTS policy_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_document_id UUID NOT NULL REFERENCES policy_documents(id) ON DELETE CASCADE,
    version_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'superseded', 'archived')),
    effective_date DATE NOT NULL,
    review_date DATE,
    expiry_date DATE,
    file_name TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    mime_type TEXT NOT NULL DEFAULT 'application/pdf',
    storage_path TEXT NOT NULL,
    sha256_hash TEXT NOT NULL,
    superseded_by_version_id UUID REFERENCES policy_versions(id) ON DELETE SET NULL,
    uploaded_by_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_policy_version UNIQUE (policy_document_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_policy_versions_doc ON policy_versions(policy_document_id);

-- ====================================================================
-- 11. Data Quality Issues Registry
-- ====================================================================

CREATE TABLE IF NOT EXISTS data_quality_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    issue_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
    explanation TEXT NOT NULL,
    suggested_action TEXT NOT NULL,
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dq_org ON data_quality_issues(organization_id);
CREATE INDEX IF NOT EXISTS idx_dq_status ON data_quality_issues(is_resolved);

-- ====================================================================
-- 12. Row-Level Security Enablement & Policies
-- ====================================================================

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_skill_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_quality_issues ENABLE ROW LEVEL SECURITY;

-- 12.1 Shared Catalogs: Skills, Aliases, Relationships
CREATE POLICY skills_read_all ON skills FOR SELECT USING (true);
CREATE POLICY skill_aliases_read_all ON skill_aliases FOR SELECT USING (true);
CREATE POLICY skill_relationships_read_all ON skill_relationships FOR SELECT USING (true);

-- 12.2 Departments & Roles (Visible to organization members)
CREATE POLICY depts_read_org ON departments FOR SELECT USING (is_member_of_org(organization_id));
CREATE POLICY depts_write_admin ON departments FOR ALL
    USING (is_admin_of_org(organization_id))
    WITH CHECK (is_admin_of_org(organization_id));

CREATE POLICY roles_read_org ON job_roles FOR SELECT USING (is_member_of_org(organization_id));
CREATE POLICY roles_write_admin ON job_roles FOR ALL
    USING (is_admin_of_org(organization_id))
    WITH CHECK (is_admin_of_org(organization_id));

CREATE POLICY role_skills_read ON role_skill_requirements FOR SELECT USING (true);

-- 12.3 Sources & Evidence
CREATE POLICY sources_read_org ON sources FOR SELECT USING (is_member_of_org(organization_id));
CREATE POLICY evidence_read_org ON evidence_items FOR SELECT USING (is_member_of_org(organization_id));
CREATE POLICY evidence_links_read_all ON evidence_links FOR SELECT USING (true);

-- 12.4 Candidate Profiles
CREATE POLICY cand_read_org ON candidate_profiles FOR SELECT
    USING (
        is_member_of_org(organization_id) OR
        (profile_id IS NOT NULL AND profile_id = auth_user_id())
    );

-- 12.5 Employees & Manager Relationships
CREATE POLICY emp_read_org ON employees FOR SELECT USING (is_member_of_org(organization_id));
CREATE POLICY mgr_rel_read_org ON manager_relationships FOR SELECT USING (is_member_of_org(organization_id));
CREATE POLICY person_skills_read_org ON person_skills FOR SELECT USING (is_member_of_org(organization_id));
CREATE POLICY conv_read_org ON candidate_conversions FOR SELECT USING (is_member_of_org(organization_id));

-- 12.6 Goals, Feedback, Attendance
CREATE POLICY goals_read_org ON goals FOR SELECT USING (is_member_of_org(organization_id));
CREATE POLICY feedback_read_org ON feedback_records FOR SELECT USING (is_member_of_org(organization_id));
CREATE POLICY attendance_read_org ON attendance_summaries FOR SELECT USING (is_member_of_org(organization_id));

-- 12.7 Policies
CREATE POLICY policy_docs_read_org ON policy_documents FOR SELECT USING (is_member_of_org(organization_id));
CREATE POLICY policy_vers_read_org ON policy_versions FOR SELECT USING (true);

-- 12.8 Data Quality
CREATE POLICY dq_read_admin ON data_quality_issues FOR SELECT USING (is_member_of_org(organization_id));
