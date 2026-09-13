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
