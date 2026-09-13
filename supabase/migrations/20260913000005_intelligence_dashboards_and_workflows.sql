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
    FOR ALL USING (organization_id = (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid() LIMIT 1));

CREATE POLICY rls_policy_queries_tenant ON policy_queries
    FOR ALL USING (organization_id = (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid() LIMIT 1));

CREATE POLICY rls_action_requests_tenant ON policy_action_requests
    FOR ALL USING (organization_id = (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid() LIMIT 1));

-- HR-Restricted Individual Attrition Risk Access
CREATE POLICY rls_risk_hr_restricted ON attrition_risk_assessments
    FOR SELECT USING (
        organization_id = (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid() LIMIT 1)
        AND EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.name IN ('hr', 'administrator')
        )
    );

CREATE POLICY rls_perf_syntheses_tenant ON performance_syntheses
    FOR ALL USING (organization_id = (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid() LIMIT 1));

CREATE POLICY rls_mobility_tenant ON internal_mobility_matches
    FOR ALL USING (organization_id = (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid() LIMIT 1));

CREATE POLICY rls_recommendations_tenant ON canonical_recommendations
    FOR ALL USING (organization_id = (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid() LIMIT 1));

CREATE POLICY rls_rec_approvals_tenant ON recommendation_approvals
    FOR ALL USING (EXISTS (
        SELECT 1 FROM canonical_recommendations cr
        WHERE cr.id = recommendation_id
        AND cr.organization_id = (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid() LIMIT 1)
    ));

CREATE POLICY rls_rec_exec_tenant ON recommendation_execution_logs
    FOR ALL USING (EXISTS (
        SELECT 1 FROM canonical_recommendations cr
        WHERE cr.id = recommendation_id
        AND cr.organization_id = (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid() LIMIT 1)
    ));

CREATE POLICY rls_notifications_recipient ON notifications
    FOR ALL USING (recipient_id = auth.uid());
