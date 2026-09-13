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
