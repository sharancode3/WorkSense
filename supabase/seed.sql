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

