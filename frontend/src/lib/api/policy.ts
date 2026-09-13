import { apiClient } from "./client";
import {
  PolicyActionCreate,
  PolicyActionResponse,
  PolicyChunk,
  PolicyDocumentUploadResponse,
  PolicyQueryRequest,
  PolicyQueryResponse,
} from "@/types/policy";

/**
 * Query HR policies using hybrid RAG and bounded Qwen reasoning.
 */
export async function queryPolicyApi(payload: PolicyQueryRequest): Promise<PolicyQueryResponse> {
  return apiClient<PolicyQueryResponse>("/api/v1/policies/query", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * List pre-indexed policy document chunks for transparent citation inspection.
 */
export async function listPolicyChunksApi(
  policyCode?: string,
  limit: number = 50
): Promise<PolicyChunk[]> {
  return apiClient<PolicyChunk[]>("/api/v1/policies/chunks", {
    method: "GET",
    params: {
      policy_code: policyCode,
      limit,
    },
  });
}

/**
 * Upload and index a new policy document (PDF/text).
 */
export async function uploadPolicyDocumentApi(
  formData: FormData
): Promise<PolicyDocumentUploadResponse> {
  // apiClient uses JSON by default if body is an object, but supports FormData natively when passed directly
  return apiClient<PolicyDocumentUploadResponse>("/api/v1/policies/upload", {
    method: "POST",
    body: formData,
  });
}

/**
 * Submit an actionable policy request or exception.
 */
export async function requestPolicyActionApi(
  payload: PolicyActionCreate
): Promise<PolicyActionResponse> {
  return apiClient<PolicyActionResponse>("/api/v1/policies/actions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * List submitted policy action requests.
 */
export async function listPolicyActionsApi(): Promise<PolicyActionResponse[]> {
  return apiClient<PolicyActionResponse[]>("/api/v1/policies/actions", {
    method: "GET",
  });
}
