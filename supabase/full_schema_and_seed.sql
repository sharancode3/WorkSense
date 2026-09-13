-- ==============================================================================
-- WorkSense Complete Database Schema & Seed Data
-- Generated for Supabase Project: rhgwqqpwfhsreimmgpcp
-- ==============================================================================

-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- MIGRATION 1: Identity, Tenants & Organizations
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- WorkSense Stage 2: Identity, Organizations, Roles, Permissions, and Row-Level Security (RLS)
-- Migration: 20260913000001_identity_and_organizations.sql

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 1. Tables
-- ====================================================================

-- Organizations (Multi-Tenant Boundaries)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles (User Account Information linked to Auth)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Organization Memberships (Per-Tenant User Association & Lifecycle Status)
CREATE TABLE IF NOT EXISTS organization_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('active', 'invited', 'suspended', 'revoked')),
    invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    invited_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_organization_user UNIQUE (organization_id, user_id)
);

-- Roles (Canonical System Roles)
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Permissions (Granular Functional Capabilities)
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Role-Permission Matrix
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (role_id, permission_id)
);

-- User Role Assignments (Scoped to Organization or Global for Candidates)
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_role_org UNIQUE (user_id, role_id, organization_id)
);

-- Invitations for Internal Users
CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Security Audit Logs (Append-Only Event Trail)
CREATE TABLE IF NOT EXISTS security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    target_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    result TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ====================================================================
-- 2. Indexes for Performance and Safety
-- ====================================================================

CREATE INDEX IF NOT EXISTS idx_org_memberships_user ON organization_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_org ON organization_memberships(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_status ON organization_memberships(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_org ON user_roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_org ON invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_audit_org ON security_audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON security_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON security_audit_logs(created_at DESC);

-- ====================================================================
-- 3. Row-Level Security (RLS) Helper Functions
-- ====================================================================

CREATE OR REPLACE FUNCTION auth_user_id() RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_member_of_org(check_org_id UUID) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM organization_memberships
        WHERE organization_id = check_org_id
          AND user_id = auth_user_id()
          AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin_of_org(check_org_id UUID) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        JOIN organization_memberships om ON om.organization_id = ur.organization_id AND om.user_id = ur.user_id
        WHERE ur.organization_id = check_org_id
          AND ur.user_id = auth_user_id()
          AND om.status = 'active'
          AND r.name = 'administrator'
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ====================================================================
-- 4. Row-Level Security (RLS) Enablement & Policies
-- ====================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;

-- 4.1 Organizations Policies
-- Users can only view organizations they are active members of.
CREATE POLICY org_select_policy ON organizations
    FOR SELECT
    USING (is_member_of_org(id));

-- 4.2 Profiles Policies
-- Users can view their own profile, or profiles of members in the same organization.
CREATE POLICY profile_select_self ON profiles
    FOR SELECT
    USING (
        id = auth_user_id() OR
        EXISTS (
            SELECT 1 FROM organization_memberships om1
            JOIN organization_memberships om2 ON om1.organization_id = om2.organization_id
            WHERE om1.user_id = auth_user_id()
              AND om2.user_id = profiles.id
              AND om1.status = 'active'
              AND om2.status = 'active'
        )
    );

-- Users can update only their own profile full_name / avatar_url
CREATE POLICY profile_update_self ON profiles
    FOR UPDATE
    USING (id = auth_user_id())
    WITH CHECK (id = auth_user_id());

-- 4.3 Organization Memberships Policies
-- Members can view memberships in their active organization
CREATE POLICY membership_select_org ON organization_memberships
    FOR SELECT
    USING (is_member_of_org(organization_id));

-- Only administrators can insert/update memberships in their organization
CREATE POLICY membership_admin_insert ON organization_memberships
    FOR INSERT
    WITH CHECK (is_admin_of_org(organization_id));

CREATE POLICY membership_admin_update ON organization_memberships
    FOR UPDATE
    USING (is_admin_of_org(organization_id))
    WITH CHECK (is_admin_of_org(organization_id));

-- 4.4 Roles and Permissions Policies
-- Any authenticated user can read role and permission definitions
CREATE POLICY roles_select_all ON roles FOR SELECT USING (true);
CREATE POLICY permissions_select_all ON permissions FOR SELECT USING (true);
CREATE POLICY role_permissions_select_all ON role_permissions FOR SELECT USING (true);

-- 4.5 User Roles Policies
-- Users can view their own roles or roles in their organization
CREATE POLICY user_roles_select ON user_roles
    FOR SELECT
    USING (
        user_id = auth_user_id() OR
        (organization_id IS NOT NULL AND is_member_of_org(organization_id))
    );

-- Only organization administrators can assign or revoke roles
CREATE POLICY user_roles_admin_modify ON user_roles
    FOR ALL
    USING (organization_id IS NOT NULL AND is_admin_of_org(organization_id))
    WITH CHECK (organization_id IS NOT NULL AND is_admin_of_org(organization_id));

-- 4.6 Invitations Policies
-- Administrators can view and manage invitations for their organization
CREATE POLICY invitations_admin_manage ON invitations
    FOR ALL
    USING (is_admin_of_org(organization_id))
    WITH CHECK (is_admin_of_org(organization_id));

-- 4.7 Security Audit Logs Policies
-- Administrators can view audit logs for their organization
CREATE POLICY audit_admin_select ON security_audit_logs
    FOR SELECT
    USING (organization_id IS NOT NULL AND is_admin_of_org(organization_id));

-- Audit logs are insert-only via system functions/backend service
CREATE POLICY audit_system_insert ON security_audit_logs
    FOR INSERT
    WITH CHECK (true);


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- MIGRATION 2: Core Workforce, Employees, Twins & Skills
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- MIGRATION 3: Recruitment, Scoring & Interview Kits
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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
    USING (is_member_of_org(organization_id));

CREATE POLICY job_openings_all ON job_openings FOR ALL TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM user_roles ur JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth_user_id() AND r.name IN ('recruiter', 'hr', 'administrator')
    ));

-- Candidate Resumes: Candidate can view own resume; Recruiters/HR/Admin can manage
CREATE POLICY candidate_resumes_candidate_select ON candidate_resumes FOR SELECT TO authenticated
    USING (candidate_id IN (SELECT id FROM candidate_profiles WHERE profile_id = auth_user_id()));

CREATE POLICY candidate_resumes_staff_all ON candidate_resumes FOR ALL TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM user_roles ur JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth_user_id() AND r.name IN ('recruiter', 'hr', 'administrator')
    ));

-- Candidate Match Evaluations: Strictly forbidden to candidate role; Recruiters/HR/Admin can view/manage
CREATE POLICY match_eval_staff_all ON candidate_match_evaluations FOR ALL TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM user_roles ur JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth_user_id() AND r.name IN ('recruiter', 'hr', 'administrator', 'manager')
    ));

-- Interview Kits & Sessions: Strictly forbidden to candidates; Accessible by assigned interviewers and HR/Recruiters
CREATE POLICY interview_kits_staff_all ON interview_kits FOR ALL TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM user_roles ur JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth_user_id() AND r.name IN ('recruiter', 'hr', 'administrator', 'manager')
    ));

-- Recruitment Decisions: Candidate can view ONLY public status; full decision details restricted to staff
CREATE POLICY decisions_staff_all ON recruitment_decisions FOR ALL TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM user_roles ur JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth_user_id() AND r.name IN ('recruiter', 'hr', 'administrator')
    ));


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- MIGRATION 4: Adaptive Onboarding & Task Plans
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- WorkSense Stage 5: Adaptive Onboarding Migration
-- Migration: 20260913000004_adaptive_onboarding.sql
-- Description: Establishes onboarding task definitions library, composable templates,
--              learning resource catalog, onboarding cases & versioned plans, plan tasks,
--              dependencies, plan diffs, EnterPro simulated workflow handoffs, and audit events.

-- ====================================================================
-- 1. Onboarding Task Definitions Library
-- ====================================================================

CREATE TABLE IF NOT EXISTS onboarding_task_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'preboarding', 'documentation', 'policy', 'equipment', 'access',
        'security', 'organization_intro', 'department_intro', 'team_intro',
        'role_readiness', 'tool_setup', 'learning', 'shadowing', 'goal_setting',
        'manager_checkin', 'hr_checkin', 'feedback_checkpoint', 'completion_review'
    )),
    default_owner TEXT NOT NULL DEFAULT 'employee' CHECK (default_owner IN ('employee', 'manager', 'hr', 'it_admin')),
    is_mandatory BOOLEAN NOT NULL DEFAULT false,
    target_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    target_job_role_id UUID REFERENCES job_roles(id) ON DELETE SET NULL,
    target_work_mode TEXT NOT NULL DEFAULT 'all' CHECK (target_work_mode IN ('all', 'remote', 'hybrid', 'onsite')),
    target_employment_type TEXT NOT NULL DEFAULT 'all' CHECK (target_employment_type IN ('all', 'full_time', 'part_time', 'contract')),
    duration_minutes INT NOT NULL DEFAULT 60 CHECK (duration_minutes >= 5),
    deadline_offset_days INT NOT NULL DEFAULT 1 CHECK (deadline_offset_days >= 0),
    recommended_phase TEXT NOT NULL DEFAULT 'week_1' CHECK (recommended_phase IN (
        'preboarding', 'day_1', 'week_1', 'month_1', 'day_30', 'day_60', 'day_90'
    )),
    completion_criteria TEXT NOT NULL DEFAULT 'Self-service acknowledgement or deliverable verification',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_task_def_code UNIQUE (organization_id, code)
);

CREATE INDEX IF NOT EXISTS idx_task_defs_org ON onboarding_task_definitions(organization_id);
CREATE INDEX IF NOT EXISTS idx_task_defs_cat ON onboarding_task_definitions(category);
CREATE INDEX IF NOT EXISTS idx_task_defs_dept ON onboarding_task_definitions(target_department_id);

-- ====================================================================
-- 2. Onboarding Composable Templates
-- ====================================================================

CREATE TABLE IF NOT EXISTS onboarding_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    template_type TEXT NOT NULL CHECK (template_type IN ('org_wide', 'department', 'role', 'work_mode')),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    job_role_id UUID REFERENCES job_roles(id) ON DELETE SET NULL,
    version_number INT NOT NULL DEFAULT 1 CHECK (version_number >= 1),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'superseded', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_template_code_ver UNIQUE (organization_id, code, version_number)
);

CREATE INDEX IF NOT EXISTS idx_templates_org ON onboarding_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_templates_type ON onboarding_templates(template_type);

CREATE TABLE IF NOT EXISTS onboarding_template_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES onboarding_templates(id) ON DELETE CASCADE,
    task_definition_id UUID NOT NULL REFERENCES onboarding_task_definitions(id) ON DELETE CASCADE,
    sort_order INT NOT NULL DEFAULT 0,
    is_mandatory_override BOOLEAN,
    phase_override TEXT CHECK (phase_override IS NULL OR phase_override IN (
        'preboarding', 'day_1', 'week_1', 'month_1', 'day_30', 'day_60', 'day_90'
    )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_template_task_link UNIQUE (template_id, task_definition_id)
);

CREATE INDEX IF NOT EXISTS idx_tmpl_tasks_tmpl ON onboarding_template_tasks(template_id);

-- ====================================================================
-- 3. Approved Learning Resources Catalog
-- ====================================================================

CREATE TABLE IF NOT EXISTS learning_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'Internal Academy',
    resource_url TEXT,
    format TEXT NOT NULL DEFAULT 'course' CHECK (format IN ('course', 'documentation', 'code_lab', 'video', 'workshop')),
    estimated_minutes INT NOT NULL DEFAULT 120 CHECK (estimated_minutes >= 10),
    difficulty_level TEXT NOT NULL DEFAULT 'intermediate' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    primary_skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
    prerequisite_skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_learning_resource_code UNIQUE (organization_id, code)
);

CREATE INDEX IF NOT EXISTS idx_learning_res_org ON learning_resources(organization_id);
CREATE INDEX IF NOT EXISTS idx_learning_res_skill ON learning_resources(primary_skill_id);

-- ====================================================================
-- 4. Onboarding Cases (Continuous Candidate-to-Employee Handoff)
-- ====================================================================

CREATE TABLE IF NOT EXISTS onboarding_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE RESTRICT,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    job_opening_id UUID REFERENCES job_openings(id) ON DELETE SET NULL,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    job_role_id UUID NOT NULL REFERENCES job_roles(id) ON DELETE RESTRICT,
    manager_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    work_mode TEXT NOT NULL DEFAULT 'remote' CHECK (work_mode IN ('remote', 'hybrid', 'onsite')),
    current_phase TEXT NOT NULL DEFAULT 'preboarding' CHECK (current_phase IN (
        'preboarding', 'day_1', 'week_1', 'month_1', 'day_30', 'day_60', 'day_90', 'completed'
    )),
    case_status TEXT NOT NULL DEFAULT 'draft' CHECK (case_status IN (
        'draft', 'generating', 'needs_data', 'validation_failed', 'hr_review',
        'manager_review', 'changes_requested', 'approved', 'handoff_pending',
        'handoff_submitted', 'active', 'blocked', 'completed', 'cancelled', 'superseded'
    )),
    active_plan_version INT NOT NULL DEFAULT 1,
    blocker_summary TEXT,
    created_by_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_onboarding_case_cand UNIQUE (organization_id, candidate_id),
    CONSTRAINT uq_onboarding_case_emp UNIQUE (organization_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_cases_org ON onboarding_cases(organization_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_cases_status ON onboarding_cases(case_status);
CREATE INDEX IF NOT EXISTS idx_onboarding_cases_emp ON onboarding_cases(employee_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_cases_mgr ON onboarding_cases(manager_employee_id);

-- ====================================================================
-- 5. Versioned Onboarding Plans
-- ====================================================================

CREATE TABLE IF NOT EXISTS onboarding_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    onboarding_case_id UUID NOT NULL REFERENCES onboarding_cases(id) ON DELETE CASCADE,
    version_number INT NOT NULL CHECK (version_number >= 1),
    plan_status TEXT NOT NULL DEFAULT 'draft' CHECK (plan_status IN (
        'draft', 'in_review', 'approved', 'active', 'superseded'
    )),
    total_tasks INT NOT NULL DEFAULT 0,
    mandatory_tasks INT NOT NULL DEFAULT 0,
    recommended_tasks INT NOT NULL DEFAULT 0,
    total_duration_hours NUMERIC(6,1) NOT NULL DEFAULT 0.0,
    qwen_model_id TEXT NOT NULL DEFAULT 'qwen3:4b-instruct-2507-q4_K_M',
    prompt_version TEXT NOT NULL DEFAULT 'onboarding-journey-planner-v1.0',
    generation_status TEXT NOT NULL DEFAULT 'deterministic' CHECK (generation_status IN (
        'deterministic', 'ai_synthesized', 'degraded_fallback'
    )),
    change_trigger TEXT NOT NULL DEFAULT 'initial_generation',
    change_summary TEXT,
    hr_approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    hr_approved_at TIMESTAMPTZ,
    hr_approval_notes TEXT,
    manager_approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    manager_approved_at TIMESTAMPTZ,
    manager_approval_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_onboarding_plan_ver UNIQUE (onboarding_case_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_plans_case ON onboarding_plans(onboarding_case_id);

-- ====================================================================
-- 6. Concrete Plan Tasks
-- ====================================================================

CREATE TABLE IF NOT EXISTS onboarding_plan_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES onboarding_plans(id) ON DELETE CASCADE,
    task_definition_id UUID REFERENCES onboarding_task_definitions(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'preboarding', 'documentation', 'policy', 'equipment', 'access',
        'security', 'organization_intro', 'department_intro', 'team_intro',
        'role_readiness', 'tool_setup', 'learning', 'shadowing', 'goal_setting',
        'manager_checkin', 'hr_checkin', 'feedback_checkpoint', 'completion_review'
    )),
    phase TEXT NOT NULL DEFAULT 'week_1' CHECK (phase IN (
        'preboarding', 'day_1', 'week_1', 'month_1', 'day_30', 'day_60', 'day_90'
    )),
    task_owner TEXT NOT NULL DEFAULT 'employee' CHECK (task_owner IN ('employee', 'manager', 'hr', 'it_admin')),
    is_mandatory BOOLEAN NOT NULL DEFAULT false,
    is_skill_gap_task BOOLEAN NOT NULL DEFAULT false,
    target_skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
    learning_resource_id UUID REFERENCES learning_resources(id) ON DELETE SET NULL,
    source_justification TEXT NOT NULL,
    completion_criteria TEXT NOT NULL,
    evidence_requirement_type TEXT NOT NULL DEFAULT 'acknowledgement' CHECK (evidence_requirement_type IN (
        'acknowledgement', 'document_upload', 'uri_link', 'manager_signoff', 'assessment'
    )),
    scheduled_start_date DATE NOT NULL,
    due_date DATE NOT NULL,
    estimated_minutes INT NOT NULL DEFAULT 60,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN (
        'not_started', 'ready', 'in_progress', 'blocked', 'awaiting_verification',
        'completed', 'skipped', 'cancelled'
    )),
    blocker_reason TEXT,
    blocker_reported_at TIMESTAMPTZ,
    blocker_resolved_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    completed_by_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    completion_notes TEXT,
    completion_evidence_uri TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_plan_task_dates CHECK (due_date >= scheduled_start_date)
);

CREATE INDEX IF NOT EXISTS idx_plan_tasks_plan ON onboarding_plan_tasks(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_tasks_status ON onboarding_plan_tasks(status);
CREATE INDEX IF NOT EXISTS idx_plan_tasks_phase ON onboarding_plan_tasks(phase);
CREATE INDEX IF NOT EXISTS idx_plan_tasks_owner ON onboarding_plan_tasks(task_owner);

-- ====================================================================
-- 7. Task Dependency Graph
-- ====================================================================

CREATE TABLE IF NOT EXISTS onboarding_task_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES onboarding_plans(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES onboarding_plan_tasks(id) ON DELETE CASCADE,
    prerequisite_task_id UUID NOT NULL REFERENCES onboarding_plan_tasks(id) ON DELETE CASCADE,
    dependency_type TEXT NOT NULL DEFAULT 'must_complete_before' CHECK (dependency_type IN (
        'must_complete_before', 'cannot_start_until', 'blocks_access', 'blocks_learning', 'blocks_checkpoint'
    )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_task_dep UNIQUE (task_id, prerequisite_task_id),
    CONSTRAINT chk_no_self_dep CHECK (task_id <> prerequisite_task_id)
);

CREATE INDEX IF NOT EXISTS idx_task_deps_plan ON onboarding_task_dependencies(plan_id);
CREATE INDEX IF NOT EXISTS idx_task_deps_task ON onboarding_task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_deps_prereq ON onboarding_task_dependencies(prerequisite_task_id);

-- ====================================================================
-- 8. Plan Differences (Controlled Adaptive Replanning)
-- ====================================================================

CREATE TABLE IF NOT EXISTS onboarding_plan_diffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    onboarding_case_id UUID NOT NULL REFERENCES onboarding_cases(id) ON DELETE CASCADE,
    from_version INT NOT NULL,
    to_version INT NOT NULL,
    trigger_reason TEXT NOT NULL,
    added_tasks_count INT NOT NULL DEFAULT 0,
    removed_tasks_count INT NOT NULL DEFAULT 0,
    modified_tasks_count INT NOT NULL DEFAULT 0,
    diff_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'approved', 'rejected')),
    proposed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plan_diffs_case ON onboarding_plan_diffs(onboarding_case_id);

-- ====================================================================
-- 9. EnterPro Workflow Handoffs (Idempotent Simulation/Adapter)
-- ====================================================================

CREATE TABLE IF NOT EXISTS enterpro_workflow_handoffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    onboarding_case_id UUID NOT NULL REFERENCES onboarding_cases(id) ON DELETE CASCADE,
    plan_version INT NOT NULL,
    idempotency_key TEXT NOT NULL UNIQUE,
    correlation_id TEXT NOT NULL,
    external_workflow_id TEXT,
    handoff_status TEXT NOT NULL DEFAULT 'pending' CHECK (handoff_status IN (
        'pending', 'submitted', 'acknowledged_simulated', 'synced', 'failed'
    )),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    simulation_flag BOOLEAN NOT NULL DEFAULT true,
    submitted_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    last_synced_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_handoff_case_ver UNIQUE (onboarding_case_id, plan_version)
);

CREATE INDEX IF NOT EXISTS idx_enterpro_case ON enterpro_workflow_handoffs(onboarding_case_id);

-- ====================================================================
-- 10. Immutable Onboarding Audit Events
-- ====================================================================

CREATE TABLE IF NOT EXISTS onboarding_audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    onboarding_case_id UUID NOT NULL REFERENCES onboarding_cases(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_audit_org ON onboarding_audit_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_audit_case ON onboarding_audit_events(onboarding_case_id);

-- ====================================================================
-- 11. Row Level Security (RLS) Policies
-- ====================================================================

ALTER TABLE onboarding_task_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_template_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_plan_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_plan_diffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE enterpro_workflow_handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_audit_events ENABLE ROW LEVEL SECURITY;

-- Read policies
CREATE POLICY rls_onboarding_task_definitions_read ON onboarding_task_definitions
    FOR SELECT USING (true);

CREATE POLICY rls_onboarding_templates_read ON onboarding_templates
    FOR SELECT USING (true);

CREATE POLICY rls_onboarding_template_tasks_read ON onboarding_template_tasks
    FOR SELECT USING (true);

CREATE POLICY rls_learning_resources_read ON learning_resources
    FOR SELECT USING (true);

CREATE POLICY rls_onboarding_cases_read ON onboarding_cases
    FOR SELECT USING (true);

CREATE POLICY rls_onboarding_plans_read ON onboarding_plans
    FOR SELECT USING (true);

CREATE POLICY rls_onboarding_plan_tasks_read ON onboarding_plan_tasks
    FOR SELECT USING (true);

CREATE POLICY rls_onboarding_task_dependencies_read ON onboarding_task_dependencies
    FOR SELECT USING (true);

CREATE POLICY rls_onboarding_plan_diffs_read ON onboarding_plan_diffs
    FOR SELECT USING (true);

CREATE POLICY rls_enterpro_workflow_handoffs_read ON enterpro_workflow_handoffs
    FOR SELECT USING (true);

CREATE POLICY rls_onboarding_audit_events_read ON onboarding_audit_events
    FOR SELECT USING (true);


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- MIGRATION 5: Intelligence, Recommendations & Workflows
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- WorkSense Stages 6-9: Policy Reasoning, Workforce Intelligence, Dashboards & Workflow Handoff
-- Migration: 20260913000005_intelligence_dashboards_and_workflows.sql

-- ====================================================================
-- 1. Policy Document Chunks & Queries (Stage 6)
-- ====================================================================

CREATE TABLE IF NOT EXISTS policy_document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_document_id UUID NOT NULL REFERENCES policy_documents(id) ON DELETE CASCADE,
    policy_version_id UUID NOT NULL REFERENCES policy_versions(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL DEFAULT 1,
    section_heading TEXT NOT NULL,
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    token_count INTEGER NOT NULL DEFAULT 0,
    access_classification TEXT NOT NULL DEFAULT 'all_employees' CHECK (access_classification IN ('all_employees', 'managers_and_hr', 'hr_restricted')),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_policy_chunk UNIQUE (policy_version_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_chunks_doc ON policy_document_chunks(policy_document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_version ON policy_document_chunks(policy_version_id);
CREATE INDEX IF NOT EXISTS idx_chunks_org ON policy_document_chunks(organization_id);

CREATE TABLE IF NOT EXISTS policy_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    answer_text TEXT NOT NULL,
    confidence_state TEXT NOT NULL CHECK (confidence_state IN (
        'supported', 'partially_supported', 'conflicting_sources', 
        'insufficient_evidence', 'no_applicable_policy_found', 
        'policy_may_be_outdated', 'human_review_required'
    )),
    citations JSONB NOT NULL DEFAULT '[]'::jsonb,
    proposed_action JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_queries_org ON policy_queries(organization_id);
CREATE INDEX IF NOT EXISTS idx_queries_user ON policy_queries(user_id);

CREATE TABLE IF NOT EXISTS policy_action_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    policy_query_id UUID REFERENCES policy_queries(id) ON DELETE SET NULL,
    requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    action_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'executed')),
    approver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approver_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_action_requests_org ON policy_action_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_action_requests_status ON policy_action_requests(status);

-- ====================================================================
-- 2. Workforce Intelligence: Attrition, Performance & Skills (Stage 7)
-- ====================================================================

CREATE TABLE IF NOT EXISTS attrition_risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    risk_band TEXT NOT NULL CHECK (risk_band IN ('monitor', 'review', 'priority_review')),
    risk_score NUMERIC(4,3) NOT NULL,
    calculation_version TEXT NOT NULL,
    contributing_factors JSONB NOT NULL DEFAULT '[]'::jsonb,
    missing_signals JSONB NOT NULL DEFAULT '[]'::jsonb,
    qwen_explanation TEXT,
    recommended_interventions JSONB NOT NULL DEFAULT '[]'::jsonb,
    assessed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_risk_org ON attrition_risk_assessments(organization_id);
CREATE INDEX IF NOT EXISTS idx_risk_emp ON attrition_risk_assessments(employee_id);
CREATE INDEX IF NOT EXISTS idx_risk_band ON attrition_risk_assessments(risk_band);

CREATE TABLE IF NOT EXISTS performance_syntheses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    evaluation_period TEXT NOT NULL,
    strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
    improvement_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
    goal_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    repeated_evidence_themes JSONB NOT NULL DEFAULT '[]'::jsonb,
    development_recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
    qwen_synthesis TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_perf_org ON performance_syntheses(organization_id);
CREATE INDEX IF NOT EXISTS idx_perf_emp ON performance_syntheses(employee_id);

CREATE TABLE IF NOT EXISTS internal_mobility_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    target_job_role_id UUID NOT NULL REFERENCES job_roles(id) ON DELETE CASCADE,
    overall_fit_score NUMERIC(4,3) NOT NULL,
    verified_skills_count INTEGER NOT NULL,
    adjacent_transferable_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    remaining_skill_gaps JSONB NOT NULL DEFAULT '[]'::jsonb,
    suggested_learning_path JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'recommended' CHECK (status IN ('recommended', 'under_review', 'interviewing', 'transferred', 'declined')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mobility_org ON internal_mobility_matches(organization_id);
CREATE INDEX IF NOT EXISTS idx_mobility_emp ON internal_mobility_matches(employee_id);
CREATE INDEX IF NOT EXISTS idx_mobility_role ON internal_mobility_matches(target_job_role_id);

-- ====================================================================
-- 3. Canonical Recommendations & Enterprise Workflow (Stage 9)
-- ====================================================================

CREATE TABLE IF NOT EXISTS canonical_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL,
    subject_type TEXT NOT NULL CHECK (subject_type IN ('employee', 'candidate', 'department', 'team', 'policy')),
    recommendation_type TEXT NOT NULL CHECK (recommendation_type IN (
        'retention_intervention', 'internal_mobility', 'performance_coaching', 
        'skill_reskilling', 'onboarding_replan', 'recruitment_offer', 'policy_exception'
    )),
    source_module TEXT NOT NULL CHECK (source_module IN (
        'recruitment', 'onboarding', 'policy_rag', 'attrition_intel', 
        'performance_intel', 'skill_intel', 'simulator'
    )),
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    proposed_action JSONB NOT NULL DEFAULT '{}'::jsonb,
    supporting_evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
    confidence_state TEXT NOT NULL DEFAULT 'supported' CHECK (confidence_state IN (
        'supported', 'provisional', 'uncertain', 'insufficient_evidence'
    )),
    data_freshness_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    generator_type TEXT NOT NULL CHECK (generator_type IN ('deterministic', 'qwen_assisted', 'hybrid')),
    model_version TEXT,
    required_approver_role TEXT NOT NULL CHECK (required_approver_role IN ('manager', 'hr', 'leadership', 'administrator')),
    status TEXT NOT NULL DEFAULT 'needs_review' CHECK (status IN (
        'draft', 'needs_review', 'approved', 'rejected', 'changes_requested', 
        'execution_pending', 'submitted', 'in_progress', 'completed', 'failed', 'cancelled', 'superseded'
    )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rec_org ON canonical_recommendations(organization_id);
CREATE INDEX IF NOT EXISTS idx_rec_status ON canonical_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_rec_type ON canonical_recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_rec_subject ON canonical_recommendations(subject_id);

CREATE TABLE IF NOT EXISTS recommendation_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_id UUID NOT NULL REFERENCES canonical_recommendations(id) ON DELETE CASCADE,
    approver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected', 'changes_requested')),
    reasoning TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rec_approvals_rec ON recommendation_approvals(recommendation_id);

CREATE TABLE IF NOT EXISTS recommendation_execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_id UUID NOT NULL REFERENCES canonical_recommendations(id) ON DELETE CASCADE,
    dispatched_by_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    adapter_type TEXT NOT NULL DEFAULT 'enterpro_demonstration',
    correlation_id TEXT NOT NULL,
    idempotency_key TEXT NOT NULL UNIQUE,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL CHECK (status IN ('dispatched', 'simulated_acknowledgement', 'completed', 'failed')),
    outcome_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rec_exec_rec ON recommendation_execution_logs(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_rec_exec_corr ON recommendation_execution_logs(correlation_id);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT NOT NULL CHECK (notification_type IN (
        'approval_requested', 'execution_completed', 'blocker_alert', 'policy_action', 'risk_alert'
    )),
    reference_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_org ON notifications(organization_id);

-- ====================================================================
-- 4. Row-Level Security (RLS) Enablement & Policies
-- ====================================================================

ALTER TABLE policy_document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_action_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE attrition_risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_syntheses ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_mobility_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE canonical_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation RLS Policies
CREATE POLICY rls_policy_chunks_tenant ON policy_document_chunks
    FOR ALL USING (is_member_of_org(organization_id));

CREATE POLICY rls_policy_queries_tenant ON policy_queries
    FOR ALL USING (is_member_of_org(organization_id));

CREATE POLICY rls_action_requests_tenant ON policy_action_requests
    FOR ALL USING (is_member_of_org(organization_id));

-- HR-Restricted Individual Attrition Risk Access
CREATE POLICY rls_risk_hr_restricted ON attrition_risk_assessments
    FOR SELECT USING (
        is_member_of_org(organization_id)
        AND EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth_user_id() AND r.name IN ('hr', 'administrator')
        )
    );

CREATE POLICY rls_perf_syntheses_tenant ON performance_syntheses
    FOR ALL USING (is_member_of_org(organization_id));

CREATE POLICY rls_mobility_tenant ON internal_mobility_matches
    FOR ALL USING (is_member_of_org(organization_id));

CREATE POLICY rls_recommendations_tenant ON canonical_recommendations
    FOR ALL USING (is_member_of_org(organization_id));

CREATE POLICY rls_rec_approvals_tenant ON recommendation_approvals
    FOR ALL USING (EXISTS (
        SELECT 1 FROM canonical_recommendations cr
        WHERE cr.id = recommendation_id
        AND is_member_of_org(cr.organization_id)
    ));

CREATE POLICY rls_rec_exec_tenant ON recommendation_execution_logs
    FOR ALL USING (EXISTS (
        SELECT 1 FROM canonical_recommendations cr
        WHERE cr.id = recommendation_id
        AND is_member_of_org(cr.organization_id)
    ));

CREATE POLICY rls_notifications_recipient ON notifications
    FOR ALL USING (recipient_id = auth_user_id());


-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- SEED DATA: TechCorp Global & AcmeCorp Fixtures
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- WorkSense Stage 2 Seed Data
-- Deterministic IDs for testing multi-tenancy and role access boundaries

-- ====================================================================
-- 1. Organizations
-- ====================================================================
INSERT INTO organizations (id, name, slug) VALUES
('00000000-0000-0000-0000-000000000001', 'TechCorp International', 'techcorp'),
('00000000-0000-0000-0000-000000000002', 'AcmeCorp Global', 'acmecorp')
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- 2. Roles
-- ====================================================================
INSERT INTO roles (id, name, description, is_system) VALUES
('10000000-0000-0000-0000-000000000001', 'candidate', 'External job applicant portal access', true),
('10000000-0000-0000-0000-000000000002', 'employee', 'Internal workforce member self-service access', true),
('10000000-0000-0000-0000-000000000003', 'manager', 'Team-scoped leader access for assigned direct reports', true),
('10000000-0000-0000-0000-000000000004', 'recruiter', 'Talent acquisition workspace access', true),
('10000000-0000-0000-0000-000000000005', 'hr', 'Workforce operations and lifecycle governance access', true),
('10000000-0000-0000-0000-000000000006', 'leadership', 'Executive aggregate decision intelligence access', true),
('10000000-0000-0000-0000-000000000007', 'administrator', 'Tenant access control, security governance, and user provisioning', true)
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- 3. Permissions
-- ====================================================================
INSERT INTO permissions (id, code, name, description) VALUES
('20000000-0000-0000-0000-000000000001', 'portal.candidate.access', 'Candidate Portal Access', 'Access public candidate dashboard and personal applications'),
('20000000-0000-0000-0000-000000000002', 'portal.employee.access', 'Employee Portal Access', 'Access employee self-service workspace and personal profile'),
('20000000-0000-0000-0000-000000000003', 'portal.manager.access', 'Manager Workspace Access', 'Access assigned team oversight and direct-report workflows'),
('20000000-0000-0000-0000-000000000004', 'portal.recruiter.access', 'Recruiter Workspace Access', 'Access candidate evaluation and hiring pipeline'),
('20000000-0000-0000-0000-000000000005', 'portal.hr.access', 'HR Operations Access', 'Access workforce lifecycle, compliance, and governance workflows'),
('20000000-0000-0000-0000-000000000006', 'portal.leadership.access', 'Leadership Intelligence Access', 'Access organization-wide aggregate metrics and strategic insights'),
('20000000-0000-0000-0000-000000000007', 'admin.access', 'Administration Access', 'Access tenant administrative settings and user governance'),
('20000000-0000-0000-0000-000000000008', 'admin.members.read', 'Read Tenant Members', 'View member list, roles, and invitation states'),
('20000000-0000-0000-0000-000000000009', 'admin.members.invite', 'Invite Internal Members', 'Create invitation links for internal workforce members'),
('20000000-0000-0000-0000-000000000010', 'admin.members.role_assign', 'Assign Member Roles', 'Update internal member roles with last-admin guard'),
('20000000-0000-0000-0000-000000000011', 'admin.members.suspend', 'Suspend/Reactivate Members', 'Modify member lifecycle status'),
('20000000-0000-0000-0000-000000000012', 'admin.audit.read', 'Read Security Audit Log', 'View immutable tenant security audit events'),
('20000000-0000-0000-0000-000000000013', 'profile.self.read', 'Read Own Profile', 'View own user profile details'),
('20000000-0000-0000-0000-000000000014', 'profile.self.update', 'Update Own Profile', 'Edit permitted personal preference details'),
('20000000-0000-0000-0000-000000000015', 'team.assigned.read', 'Read Assigned Team', 'View assigned team members and relationship context')
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- 4. Role-Permission Matrix
-- ====================================================================
-- Candidate
INSERT INTO role_permissions (role_id, permission_id) VALUES
('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001'), -- portal.candidate.access
('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000013'), -- profile.self.read
('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000014')  -- profile.self.update
ON CONFLICT DO NOTHING;

-- Employee
INSERT INTO role_permissions (role_id, permission_id) VALUES
('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002'), -- portal.employee.access
('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000013'), -- profile.self.read
('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000014')  -- profile.self.update
ON CONFLICT DO NOTHING;

-- Manager
INSERT INTO role_permissions (role_id, permission_id) VALUES
('10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002'), -- portal.employee.access
('10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003'), -- portal.manager.access
('10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000013'), -- profile.self.read
('10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000014'), -- profile.self.update
('10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000015')  -- team.assigned.read
ON CONFLICT DO NOTHING;

-- Recruiter
INSERT INTO role_permissions (role_id, permission_id) VALUES
('10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004'), -- portal.recruiter.access
('10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000013'), -- profile.self.read
('10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000014')  -- profile.self.update
ON CONFLICT DO NOTHING;

-- HR
INSERT INTO role_permissions (role_id, permission_id) VALUES
('10000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000002'), -- portal.employee.access
('10000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000005'), -- portal.hr.access
('10000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000013'), -- profile.self.read
('10000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000014')  -- profile.self.update
ON CONFLICT DO NOTHING;

-- Leadership
INSERT INTO role_permissions (role_id, permission_id) VALUES
('10000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000006'), -- portal.leadership.access
('10000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000013'), -- profile.self.read
('10000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000014')  -- profile.self.update
ON CONFLICT DO NOTHING;

-- Administrator
INSERT INTO role_permissions (role_id, permission_id) VALUES
('10000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000007'), -- admin.access
('10000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000008'), -- admin.members.read
('10000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000009'), -- admin.members.invite
('10000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000010'), -- admin.members.role_assign
('10000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000011'), -- admin.members.suspend
('10000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000012'), -- admin.audit.read
('10000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000013'), -- profile.self.read
('10000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000014')  -- profile.self.update
ON CONFLICT DO NOTHING;

-- ====================================================================
-- 5. Demo Profiles (7 Canonical Roles + Negative Test Suspended Account)
-- ====================================================================
INSERT INTO profiles (id, email, full_name, is_active) VALUES
('30000000-0000-0000-0000-000000000001', 'candidate@worksense.local', 'Priya Sharma (Candidate)', true),
('30000000-0000-0000-0000-000000000002', 'employee@worksense.local', 'Marcus Vance (Employee)', true),
('30000000-0000-0000-0000-000000000003', 'manager@worksense.local', 'Elena Rostova (Engineering Manager)', true),
('30000000-0000-0000-0000-000000000004', 'recruiter@worksense.local', 'Devon Miller (Senior Recruiter)', true),
('30000000-0000-0000-0000-000000000005', 'hr@worksense.local', 'Sarah Jenkins (VP People & Culture)', true),
('30000000-0000-0000-0000-000000000006', 'leadership@worksense.local', 'Arthur Sterling (Chief Operating Officer)', true),
('30000000-0000-0000-0000-000000000007', 'admin@worksense.local', 'Carlos Mendoza (Platform Administrator)', true),
('30000000-0000-0000-0000-000000000008', 'suspended@worksense.local', 'Damon Hill (Suspended Member)', false),
('30000000-0000-0000-0000-000000000009', 'acme.admin@worksense.local', 'Rachel Green (AcmeCorp Admin)', true)
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- 6. Organization Memberships (TechCorp & AcmeCorp)
-- ====================================================================
-- TechCorp Memberships
INSERT INTO organization_memberships (id, organization_id, user_id, status) VALUES
('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'active'),
('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', 'active'),
('40000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000004', 'active'),
('40000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000005', 'active'),
('40000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000006', 'active'),
('40000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000007', 'active'),
('40000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000008', 'suspended')
ON CONFLICT (id) DO NOTHING;

-- AcmeCorp Membership (Cross-Tenant Isolation Test)
INSERT INTO organization_memberships (id, organization_id, user_id, status) VALUES
('40000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000009', 'active')
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- 7. User Roles
-- ====================================================================
-- Candidate (Global / self-service)
INSERT INTO user_roles (id, user_id, role_id, organization_id) VALUES
('50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', NULL)
ON CONFLICT (id) DO NOTHING;

-- TechCorp Roles
INSERT INTO user_roles (id, user_id, role_id, organization_id) VALUES
('50000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001'), -- employee
('50000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001'), -- manager
('50000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001'), -- recruiter
('50000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001'), -- hr
('50000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001'), -- leadership
('50000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001'), -- administrator
('50000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001')  -- employee (suspended)
ON CONFLICT (id) DO NOTHING;

-- AcmeCorp Roles
INSERT INTO user_roles (id, user_id, role_id, organization_id) VALUES
('50000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000002') -- administrator (AcmeCorp)
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- 8. Stage 3 Workforce Seed Data (TechCorp)
-- ====================================================================

-- 8.1 Departments (Engineering root, Platform Infra, AI Research, People Ops)
INSERT INTO departments (id, organization_id, code, name, description, parent_department_id, head_profile_id, is_active) VALUES
('60000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'ENG', 'Engineering Division', 'Core technology research, development, and infrastructure', NULL, '30000000-0000-0000-0000-000000000003', true),
('60000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'ENG-INFRA', 'Platform Infrastructure', 'Cloud platforms, distributed systems, and reliability engineering', '60000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', true),
('60000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'ENG-AI', 'AI Research & Fraud Detection', 'Applied machine learning models, inference accelerators, and fraud mitigation', '60000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000006', true),
('60000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'PEOPLE', 'People Operations', 'Human resources, talent acquisition, and workforce governance', NULL, '30000000-0000-0000-0000-000000000005', true)
ON CONFLICT (id) DO NOTHING;

-- 8.2 Job Roles
INSERT INTO job_roles (id, organization_id, department_id, code, title, role_family, seniority_level, summary, responsibilities, is_active) VALUES
('61000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000003', 'ROLE-ML-STAFF', 'Staff Machine Learning Engineer', 'Machine Learning', 'L5', 'Leads model architecture, low-latency Triton inference, and fraud detection pipelines', 'Architect distributed ML pipelines; mentor junior engineers; partner with product teams', true),
('61000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000002', 'ROLE-INFRA-SR', 'Senior Infrastructure Engineer', 'Infrastructure', 'L5', 'Builds and maintains Kubernetes orchestration, multi-region failover, and CI/CD pipelines', 'Ensure 99.99% availability; manage compute clusters; drive infra as code', true),
('61000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000004', 'ROLE-TA-LEAD', 'Lead Talent Acquisition Specialist', 'Talent Acquisition', 'L4', 'Directs candidate sourcing, technical screening rubrics, and hiring pipelines', 'Manage full-cycle technical recruiting; design rubric assessments; partner with hiring managers', true),
('61000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000004', 'ROLE-HRBP-SR', 'Senior People Partner (HRBP)', 'Human Resources', 'L5', 'Drives workforce planning, career mobility, retention strategy, and policy reasoning', 'Analyze organizational health; facilitate internal mobility; advise leadership on headcount', true)
ON CONFLICT (id) DO NOTHING;

-- 8.3 Skills
INSERT INTO skills (id, code, name, category, description, is_active) VALUES
('62000000-0000-0000-0000-000000000001', 'skill_pytorch', 'PyTorch', 'Machine Learning', 'Deep learning framework for tensor computation and neural network research', true),
('62000000-0000-0000-0000-000000000002', 'skill_triton', 'Triton Inference Server', 'Machine Learning', 'Optimized multi-framework AI model deployment and GPU kernel optimization', true),
('62000000-0000-0000-0000-000000000003', 'skill_cuda', 'CUDA', 'Hardware Acceleration', 'Parallel computing platform and API for NVIDIA GPU programming', true),
('62000000-0000-0000-0000-000000000004', 'skill_k8s', 'Kubernetes', 'Infrastructure', 'Automated container deployment, scaling, and operational management', true),
('62000000-0000-0000-0000-000000000005', 'skill_dist_sys', 'Distributed Systems', 'Engineering', 'Architecture for consensus, replication, and fault tolerance across nodes', true),
('62000000-0000-0000-0000-000000000006', 'skill_fastapi', 'FastAPI', 'Backend', 'Modern asynchronous web framework for building Python APIs', true),
('62000000-0000-0000-0000-000000000007', 'skill_postgres', 'PostgreSQL', 'Databases', 'Advanced open-source relational database with ACID and vector extensions', true),
('62000000-0000-0000-0000-000000000008', 'skill_golang', 'Go (Golang)', 'Programming Languages', 'Concurrent systems programming language for cloud services', true)
ON CONFLICT (id) DO NOTHING;

-- 8.4 Skill Aliases
INSERT INTO skill_aliases (id, skill_id, alias) VALUES
('63000000-0000-0000-0000-000000000001', '62000000-0000-0000-0000-000000000004', 'K8s'),
('63000000-0000-0000-0000-000000000002', '62000000-0000-0000-0000-000000000007', 'Postgres'),
('63000000-0000-0000-0000-000000000003', '62000000-0000-0000-0000-000000000008', 'Golang')
ON CONFLICT (id) DO NOTHING;

-- 8.5 Skill Relationships (Graph Edges)
INSERT INTO skill_relationships (id, source_skill_id, target_skill_id, relationship_type, similarity_weight, is_bidirectional) VALUES
('64000000-0000-0000-0000-000000000001', '62000000-0000-0000-0000-000000000002', '62000000-0000-0000-0000-000000000003', 'ADJACENT_TO', 0.850, true), -- Triton <-> CUDA (85% adjacent credit)
('64000000-0000-0000-0000-000000000002', '62000000-0000-0000-0000-000000000001', '62000000-0000-0000-0000-000000000002', 'PREREQUISITE_OF', 0.750, false), -- PyTorch -> Triton
('64000000-0000-0000-0000-000000000003', '62000000-0000-0000-0000-000000000004', '62000000-0000-0000-0000-000000000005', 'ADJACENT_TO', 0.700, true) -- K8s <-> Distributed Systems
ON CONFLICT (id) DO NOTHING;

-- 8.6 Role Skill Requirements
INSERT INTO role_skill_requirements (id, job_role_id, skill_id, is_required, min_proficiency, importance_weight, demand_classification) VALUES
('65000000-0000-0000-0000-000000000001', '61000000-0000-0000-0000-000000000001', '62000000-0000-0000-0000-000000000001', true, 5, 1.000, 'current'), -- Staff ML requires PyTorch L5
('65000000-0000-0000-0000-000000000002', '61000000-0000-0000-0000-000000000001', '62000000-0000-0000-0000-000000000003', true, 4, 0.900, 'current'), -- Staff ML requires CUDA L4
('65000000-0000-0000-0000-000000000003', '61000000-0000-0000-0000-000000000001', '62000000-0000-0000-0000-000000000002', false, 4, 0.750, 'future'), -- Staff ML prefers Triton L4
('65000000-0000-0000-0000-000000000004', '61000000-0000-0000-0000-000000000002', '62000000-0000-0000-0000-000000000004', true, 5, 1.000, 'current'), -- Senior Infra requires K8s L5
('65000000-0000-0000-0000-000000000005', '61000000-0000-0000-0000-000000000002', '62000000-0000-0000-0000-000000000005', true, 4, 0.850, 'current')  -- Senior Infra requires Dist Sys L4
ON CONFLICT (id) DO NOTHING;

-- 8.7 Sources
INSERT INTO sources (id, organization_id, source_type, name, external_reference, reliability_status) VALUES
('66000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'demo_seed', 'Golden Demo Seed Dataset', 'DEMO-SEED-2026', 'verified'),
('66000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'csv_import', 'GitHub Pull Request Verification', 'PR-402', 'verified')
ON CONFLICT (id) DO NOTHING;

-- 8.8 Evidence Items
INSERT INTO evidence_items (id, organization_id, subject_person_id, source_id, claim_summary, source_type, source_uri, observed_at, confidence_score, verification_status, visibility, is_stale) VALUES
('67000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '66000000-0000-0000-0000-000000000002', 'Authored optimized Triton GEMM custom kernel reducing model inference latency by 32%', 'github_pr', 'https://github.com/vllm-project/vllm/pull/402', now() - INTERVAL '45 days', 0.950, 'verified', 'public_workforce', false),
('67000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '66000000-0000-0000-0000-000000000001', 'Architected multi-region Kubernetes cluster auto-scaling handling 250k req/sec peak', 'production_incident', 'https://techcorp.internal/incidents/INC-8821', now() - INTERVAL '30 days', 0.900, 'verified', 'public_workforce', false)
ON CONFLICT (id) DO NOTHING;

-- 8.9 Candidate Profile (Sarah Lin)
INSERT INTO candidate_profiles (id, organization_id, profile_id, first_name, last_name, email, location, current_title, years_experience, education_summary, summary, target_role_id, record_status) VALUES
('68000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Sarah', 'Lin', 'candidate@worksense.local', 'Bengaluru, India', 'Senior ML Systems Engineer', 7.5, 'MS Computer Science, Stanford University', 'Specialist in low-latency distributed deep learning inference and custom GPU kernel optimization', '61000000-0000-0000-0000-000000000001', 'active')
ON CONFLICT (id) DO NOTHING;

-- 8.10 Employees (Marcus Vance as Manager, Marcus Chen as Senior Infra Engineer)
INSERT INTO employees (id, organization_id, profile_id, employee_code, hire_date, department_id, job_role_id, employment_status, work_location) VALUES
('69000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', 'EMP-10021', '2021-01-15', '60000000-0000-0000-0000-000000000002', '61000000-0000-0000-0000-000000000002', 'active', 'Bengaluru HQ'),
('69000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'EMP-10492', '2023-03-20', '60000000-0000-0000-0000-000000000002', '61000000-0000-0000-0000-000000000002', 'active', 'Remote - Pune')
ON CONFLICT (id) DO NOTHING;

-- 8.11 Manager Relationship (Marcus Vance -> Marcus Chen)
INSERT INTO manager_relationships (id, organization_id, employee_id, manager_employee_id, relationship_type, is_current, effective_start_date) VALUES
('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '69000000-0000-0000-0000-000000000002', '69000000-0000-0000-0000-000000000001', 'direct', true, '2023-03-20')
ON CONFLICT (id) DO NOTHING;

-- 8.12 Person Skills
INSERT INTO person_skills (id, organization_id, person_id, skill_id, proficiency_level, confidence_band, verification_source, is_stale, last_demonstrated_at) VALUES
('71000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '62000000-0000-0000-0000-000000000001', 5, 'high', 'interview_verified', false, now() - INTERVAL '15 days'), -- Sarah Lin PyTorch L5
('71000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '62000000-0000-0000-0000-000000000002', 4, 'high', 'production_pr', false, now() - INTERVAL '45 days'),      -- Sarah Lin Triton L4
('71000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '62000000-0000-0000-0000-000000000004', 5, 'high', 'manager_verified', false, now() - INTERVAL '30 days'),   -- Marcus Chen K8s L5
('71000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '62000000-0000-0000-0000-000000000005', 4, 'high', 'production_pr', false, now() - INTERVAL '60 days')       -- Marcus Chen Dist Sys L4
ON CONFLICT (id) DO NOTHING;

-- 8.13 Goals
INSERT INTO goals (id, organization_id, employee_id, title, description, goal_type, priority, status, start_date, due_date, progress_percentage, creator_id, visibility) VALUES
('72000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '69000000-0000-0000-0000-000000000002', 'Zero-Downtime Multi-Region Kubernetes Migration', 'Upgrade production clusters across regions to Kubernetes v1.30 with zero operational downtime', 'strategic', 'high', 'active', CURRENT_DATE - 30, CURRENT_DATE + 30, 65, '30000000-0000-0000-0000-000000000003', 'employee_visible')
ON CONFLICT (id) DO NOTHING;

-- 8.14 Feedback
INSERT INTO feedback_records (id, organization_id, subject_employee_id, author_profile_id, feedback_type, feedback_date, visibility, structured_strengths, development_areas, acknowledged_by_subject) VALUES
('73000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '69000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000003', 'manager_1on1', CURRENT_DATE - 14, 'manager_and_employee', '["Flawless leadership during INC-8821 cluster failover", "Proactive infrastructure capacity planning"]'::jsonb, '["Expand cross-functional mentorship for junior infrastructure engineers"]'::jsonb, true)
ON CONFLICT (id) DO NOTHING;

-- 8.15 Attendance Summaries
INSERT INTO attendance_summaries (id, organization_id, employee_id, period_start, period_end, scheduled_workdays, present_days, approved_leave_days, unapproved_absence_days, remote_days, onsite_days, late_occurrences, source_system, data_quality_status) VALUES
('74000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '69000000-0000-0000-0000-000000000002', '2026-08-01', '2026-08-31', 22, 20, 2, 0, 16, 4, 0, 'hris_attendance_sync', 'verified')
ON CONFLICT (id) DO NOTHING;

-- 8.16 Policy Documents & Versions
INSERT INTO policy_documents (id, organization_id, title, policy_code, category, description, access_classification) VALUES
('75000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Global Remote Work & Distributed Operations Policy', 'POL-REMOTE-01', 'remote_work', 'Establishes guidelines, eligibility criteria, and exception approval workflows for distributed workforce operations', 'all_employees')
ON CONFLICT (id) DO NOTHING;

INSERT INTO policy_versions (id, policy_document_id, version_number, status, effective_date, file_name, file_size_bytes, mime_type, storage_path, sha256_hash, uploaded_by_id) VALUES
('76000000-0000-0000-0000-000000000001', '75000000-0000-0000-0000-000000000001', '4.1', 'active', '2026-01-01', 'techcorp_global_remote_policy_v4.1.pdf', 348210, 'application/pdf', 'policy-documents/techcorp_global_remote_policy_v4.1.pdf', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', '30000000-0000-0000-0000-000000000005')
ON CONFLICT (id) DO NOTHING;



