import { apiClient, setAuthToken, setActiveOrgId } from "./client";
import {
  AccessContext,
  AuthTokenResponse,
  MemberListResponse,
  AuditLogResponse,
} from "@/types";

export interface CandidateRegisterPayload {
  full_name: string;
  email: string;
  password: string;
  password_confirm: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface InviteAcceptPayload {
  token: string;
  full_name: string;
  password: string;
  password_confirm: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
  password_confirm: string;
}

export interface InviteMemberPayload {
  email: string;
  role: string;
}

export async function loginApi(payload: LoginPayload): Promise<AuthTokenResponse> {
  const res = await apiClient<AuthTokenResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setAuthToken(res.access_token);
  if (res.context.active_organization?.id) {
    setActiveOrgId(res.context.active_organization.id);
  }
  return res;
}

export async function registerCandidateApi(payload: CandidateRegisterPayload): Promise<AuthTokenResponse> {
  const res = await apiClient<AuthTokenResponse>("/api/v1/auth/register-candidate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setAuthToken(res.access_token);
  return res;
}

export async function logoutApi(): Promise<{ message: string; success: boolean }> {
  try {
    return await apiClient<{ message: string; success: boolean }>("/api/v1/auth/logout", {
      method: "POST",
    });
  } finally {
    setAuthToken(null);
    setActiveOrgId(null);
  }
}

export async function fetchMyContextApi(): Promise<AccessContext> {
  return apiClient<AccessContext>("/api/v1/auth/me", {
    method: "GET",
  });
}

export async function switchOrgApi(organizationId: string): Promise<AccessContext> {
  const ctx = await apiClient<AccessContext>("/api/v1/auth/switch-organization", {
    method: "POST",
    body: JSON.stringify({ organization_id: organizationId }),
  });
  setActiveOrgId(organizationId);
  return ctx;
}

export async function forgotPasswordApi(email: string): Promise<{ message: string }> {
  return apiClient<{ message: string }>("/api/v1/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPasswordApi(payload: ResetPasswordPayload): Promise<{ message: string }> {
  return apiClient<{ message: string }>("/api/v1/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function acceptInviteApi(payload: InviteAcceptPayload): Promise<AuthTokenResponse> {
  const res = await apiClient<AuthTokenResponse>("/api/v1/auth/accept-invite", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setAuthToken(res.access_token);
  if (res.context.active_organization?.id) {
    setActiveOrgId(res.context.active_organization.id);
  }
  return res;
}

export async function listMembersApi(params?: { query?: string; role?: string }): Promise<MemberListResponse> {
  return apiClient<MemberListResponse>("/api/v1/admin/members", {
    method: "GET",
    params,
  });
}

export async function inviteMemberApi(payload: InviteMemberPayload): Promise<{ invitation_token: string; email: string; role: string; message: string }> {
  return apiClient<{ invitation_token: string; email: string; role: string; message: string }>("/api/v1/admin/invite", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateMemberRoleApi(userId: string, role: string): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/api/v1/admin/members/${userId}/role`, {
    method: "POST",
    body: JSON.stringify({ role }),
  });
}

export async function suspendMemberApi(userId: string): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/api/v1/admin/members/${userId}/suspend`, {
    method: "POST",
  });
}

export async function reactivateMemberApi(userId: string): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/api/v1/admin/members/${userId}/reactivate`, {
    method: "POST",
  });
}

export async function listAuditLogsApi(limit: number = 50): Promise<AuditLogResponse> {
  return apiClient<AuditLogResponse>("/api/v1/admin/audit-logs", {
    method: "GET",
    params: { limit },
  });
}
