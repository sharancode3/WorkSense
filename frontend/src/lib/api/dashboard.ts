import { apiClient } from "./client";
import { DashboardSummaryResponse } from "@/types/dashboard";

/**
 * Retrieve dynamic HR Decision Dashboard summary.
 * Computed from real persisted prototype data across Recruitment, Attendance, Onboarding, Risk, and Skill Heatmaps.
 */
export async function getDashboardSummaryApi(
  departmentId?: string
): Promise<DashboardSummaryResponse> {
  return apiClient<DashboardSummaryResponse>("/api/v1/dashboard/summary", {
    method: "GET",
    params: departmentId ? { department_id: departmentId } : undefined,
  });
}
