/**
 * WorkSense Core Frontend Type Definitions
 */

export type HealthStatus = "healthy" | "degraded" | "unavailable" | "not configured";

export interface ComponentHealth {
  status: HealthStatus;
  latency_ms?: number;
  detail?: string;
}

export interface HealthComponents {
  database: ComponentHealth;
  storage: ComponentHealth;
  qwen_ai_gateway: ComponentHealth;
  enterpro_orchestrator: ComponentHealth;
}

export interface HealthResponse {
  status: "healthy" | "degraded" | "unavailable";
  timestamp: string;
  environment: string;
  version: string;
  components: HealthComponents;
  request_id?: string;
}

export interface LivenessResponse {
  status: "healthy";
  timestamp: string;
  version: string;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details: Record<string, unknown>;
  request_id: string;
}

export interface ApiErrorResponse {
  error: ApiErrorDetail;
}

export type ThemeMode = "light" | "dark" | "system";

export type ResolvedTheme = "light" | "dark";

export interface NavigationItem {
  id: string;
  title: string;
  href: string;
  iconName: string;
  stage?: string;
  disabled?: boolean;
  badge?: string;
  requiredCapability?: string;
  allowedRoles?: string[];
}

export interface NavigationGroup {
  id: string;
  title: string;
  items: NavigationItem[];
}

// Stage 2: Authentication, Identity and Access Control Types
export interface SafeUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  is_active: boolean;
}

export interface SafeOrganization {
  id: string;
  name: string;
  slug: string;
}

export interface AccessContext {
  user: SafeUser;
  active_organization?: SafeOrganization | null;
  active_roles: string[];
  granted_capabilities: string[];
  membership_status?: string | null;
  available_organizations: SafeOrganization[];
  default_destination: string;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in_minutes: number;
  context: AccessContext;
}

export interface MemberItem {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  joined_at?: string | null;
  is_current_user?: boolean;
}

export interface MemberListResponse {
  members: MemberItem[];
  total: number;
}

export interface AuditLogItem {
  id: string;
  organization_id?: string | null;
  actor_name: string;
  action: string;
  result: string;
  details: Record<string, unknown>;
  timestamp: string;
}

export interface AuditLogResponse {
  items: AuditLogItem[];
  total: number;
}

// Stage 6-9 Re-exports
export * from "./policy";
export * from "./intelligence";
export * from "./dashboard";
export * from "./recommendation";
