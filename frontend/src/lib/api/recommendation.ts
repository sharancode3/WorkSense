import { apiClient } from "./client";
import {
  CanonicalRecommendation,
  NotificationItem,
  RecommendationApprovalRequest,
  RecommendationApprovalResponse,
  RecommendationExecutionResponse,
} from "@/types/recommendation";

/**
 * List cross-module canonical recommendations.
 */
export async function listRecommendationsApi(
  status?: string,
  sourceModule?: string
): Promise<CanonicalRecommendation[]> {
  return apiClient<CanonicalRecommendation[]>("/api/v1/recommendations", {
    method: "GET",
    params: {
      status,
      source_module: sourceModule,
    },
  });
}

/**
 * Retrieve recommendation details by ID.
 */
export async function getRecommendationApi(id: string): Promise<CanonicalRecommendation> {
  return apiClient<CanonicalRecommendation>(`/api/v1/recommendations/${id}`, {
    method: "GET",
  });
}

/**
 * Record human review (approval or rejection) for a canonical recommendation.
 */
export async function reviewRecommendationApi(
  id: string,
  payload: RecommendationApprovalRequest
): Promise<RecommendationApprovalResponse> {
  return apiClient<RecommendationApprovalResponse>(`/api/v1/recommendations/${id}/approve`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Dispatch approved recommendation to simulated EnterPro adapter with correlation tracking.
 */
export async function executeRecommendationApi(
  id: string
): Promise<RecommendationExecutionResponse> {
  return apiClient<RecommendationExecutionResponse>(`/api/v1/recommendations/${id}/execute`, {
    method: "POST",
  });
}

/**
 * List in-app notifications.
 */
export async function listNotificationsApi(): Promise<NotificationItem[]> {
  return apiClient<NotificationItem[]>("/api/v1/recommendations/notifications/my", {
    method: "GET",
  });
}
