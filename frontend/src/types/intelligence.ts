/**
 * WorkSense Stage 7: Workforce Intelligence Types
 */

export interface RiskFactorDetail {
  signal_name: string;
  signal_category: string;
  weight: number;
  raw_value: string;
  score_contribution: number;
  direction: "increases_risk" | "reduces_risk" | "neutral";
  evidence_source: string;
  data_freshness: string;
}

export interface AttritionRiskAssessment {
  id: string;
  organization_id?: string;
  employee_id: string;
  employee_name: string;
  employee_code: string;
  department_name: string;
  role_title: string;
  risk_score: number;
  risk_band: "monitor" | "review" | "priority_review" | string;
  risk_factors?: RiskFactorDetail[];
  contributing_factors?: RiskFactorDetail[];
  missing_signals?: string[];
  supportive_interventions?: string[];
  recommended_interventions?: string[];
  explanation?: string;
  qwen_explanation?: string;
  is_mitigated?: boolean;
  evaluated_at?: string;
  assessed_at?: string;
}

export interface AttritionDepartmentAggregate {
  department_id: string;
  department_name: string;
  cohort_size: number;
  is_suppressed: boolean;
  average_risk_score?: number | null;
  priority_review_count?: number | null;
  review_count?: number | null;
  monitor_count?: number | null;
}

export interface AttritionAggregateOverview {
  total_evaluated: number;
  band_distribution: Record<string, number>;
  department_aggregates: AttritionDepartmentAggregate[];
  top_contributing_signals: Array<{
    signal: string;
    category: string;
    prevalence_pct: number;
  }>;
}

export interface GoalPerformanceSummary {
  total_goals: number;
  completed_goals: number;
  on_track_goals: number;
  behind_goals: number;
  average_progress_pct: number;
}

export interface PerformanceInsight {
  employee_id: string;
  employee_name: string;
  employee_code: string;
  role_title: string;
  department_name: string;
  evaluation_period: string;
  demonstrated_strengths: string[];
  goal_summary: GoalPerformanceSummary;
  repeated_evidence_themes: string[];
  improvement_areas: string[];
  skill_development_needs: string[];
  manager_discussion_prompts: string[];
  development_recommendations: string[];
  qwen_synthesis: string;
  is_qwen_assisted: boolean;
  last_evaluated_at: string;
}

export interface AdjacentTransferableSkill {
  skill_name: string;
  level: number;
  transfers_to: string;
}

export interface RemainingSkillGap {
  skill_name: string;
  required_level: number;
  current_level: number;
  gap: number;
}

export interface SuggestedLearningPath {
  title: string;
  provider: string;
  hours: number;
}

export interface InternalMobilityMatch {
  id: string;
  organization_id: string;
  employee_id: string;
  employee_name: string;
  current_role_title: string;
  target_job_role_id: string;
  target_role_title: string;
  target_department_name: string;
  fit_score: number;
  fit_percentage: number;
  verified_skills_count: number;
  adjacent_transferable_skills: AdjacentTransferableSkill[];
  remaining_skill_gaps: RemainingSkillGap[];
  suggested_learning_path: SuggestedLearningPath[];
  status: "recommended" | "under_review" | "accepted" | "declined";
  created_at: string;
}
