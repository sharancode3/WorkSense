import { apiClient } from "@/lib/api/client";
import { HealthResponse, LivenessResponse } from "@/types";

/**
 * Fetch process liveness directly from root endpoint.
 */
export async function fetchLiveness(signal?: AbortSignal): Promise<LivenessResponse> {
  return apiClient<LivenessResponse>("/health", { signal, timeoutMs: 5000 });
}

/**
 * Fetch detailed application readiness and subsystem dependency statuses.
 */
export async function fetchHealthStatus(signal?: AbortSignal): Promise<HealthResponse> {
  return apiClient<HealthResponse>("/api/v1/health", { signal, timeoutMs: 7000 });
}
