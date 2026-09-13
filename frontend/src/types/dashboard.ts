/**
 * WorkSense Stage 8: HR Decision Dashboard Types
 */

export interface RecruitmentFunnelMetrics {
  applications_total: number;
  processing_total: number;
  shortlisted_total: number;
  interviewed_total: number;
  offered_total: number;
  converted_total: number;
  average_candidate_score: number;
}

export interface AttendanceMetrics {
  period_label: string;
  average_attendance_rate_pct: number;
  total_onsite_days: number;
  total_remote_days: number;
  unapproved_absence_total: number;
  data_freshness: string;
}

export interface OnboardingProgressMetrics {
  upcoming_joiners_count: number;
  active_cases_count: number;
  completed_cases_count: number;
  blocked_cases_count: number;
  average_progress_pct: number;
  ready_for_enterpro_count: number;
}

export interface AttritionRiskMetrics {
  total_evaluated: number;
  priority_review_count: number;
  review_count: number;
  monitor_count: number;
  top_risk_driver: string;
}

export interface SkillGapHeatmapCell {
  department_name: string;
  role_title: string;
  skill_name: string;
  required_level: number;
  average_proficiency: number;
  gap_magnitude: number;
  coverage_status: "optimal" | "mild_gap" | "critical_gap";
}

export interface PriorityAlert {
  id: string;
  category: "onboarding_blocker" | "retention_risk" | "recruitment_sla" | "policy_compliance";
  title: string;
  severity: "critical" | "warning" | "info";
  evidence_snippet: string;
  recommended_action: string;
  target_route: string;
}

export interface DashboardSummaryResponse {
  organization_id: string;
  organization_name: string;
  generated_at: string;
  is_leadership_view: boolean;
  recruitment_funnel: RecruitmentFunnelMetrics;
  attendance: AttendanceMetrics;
  onboarding: OnboardingProgressMetrics;
  attrition_overview: AttritionRiskMetrics;
  critical_skill_gaps_count: number;
  active_recommendations_count: number;
  priority_alerts: PriorityAlert[];
  skill_heatmap: SkillGapHeatmapCell[];
}
