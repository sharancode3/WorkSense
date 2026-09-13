import { apiClient } from "./client";
import {
  AttritionAggregateOverview,
  AttritionRiskAssessment,
  InternalMobilityMatch,
  PerformanceInsight,
} from "@/types/intelligence";

/**
 * Retrieve ethical, job-relevant attrition risk assessment for an individual employee (HR-restricted).
 */
export async function getEmployeeAttritionRiskApi(
  employeeId: string
): Promise<AttritionRiskAssessment> {
  return apiClient<AttritionRiskAssessment>(`/api/v1/intelligence/attrition/${employeeId}`, {
    method: "GET",
  });
}

/**
 * Retrieve organization-wide cohort-aggregated attrition overview with small-cohort protection.
 */
export async function getAttritionOverviewApi(): Promise<AttritionAggregateOverview> {
  return apiClient<AttritionAggregateOverview>("/api/v1/intelligence/attrition/overview", {
    method: "GET",
  });
}

/**
 * Retrieve evidence-backed performance insights and manager coaching prompts for an employee.
 */
export async function getPerformanceInsightsApi(
  employeeId: string
): Promise<PerformanceInsight> {
  return apiClient<PerformanceInsight>(`/api/v1/intelligence/performance/${employeeId}`, {
    method: "GET",
  });
}

/**
 * List active internal mobility and capability transfer opportunities across the organization.
 */
export async function listInternalMobilityMatchesApi(): Promise<InternalMobilityMatch[]> {
  return apiClient<InternalMobilityMatch[]>("/api/v1/intelligence/mobility/matches", {
    method: "GET",
  });
}
