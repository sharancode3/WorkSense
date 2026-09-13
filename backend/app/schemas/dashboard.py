"""Pydantic schemas for the Main HR Decision Dashboard (Stage 8)."""

from datetime import datetime
from typing import List
from pydantic import BaseModel, Field


class RecruitmentFunnelMetrics(BaseModel):
    applications_total: int
    processing_total: int
    shortlisted_total: int
    interviewed_total: int
    offered_total: int
    converted_total: int
    average_candidate_score: float


class AttendanceMetrics(BaseModel):
    period_label: str
    average_attendance_rate_pct: float
    total_onsite_days: int
    total_remote_days: int
    unapproved_absence_total: int
    data_freshness: str


class OnboardingProgressMetrics(BaseModel):
    upcoming_joiners_count: int
    active_cases_count: int
    completed_cases_count: int
    blocked_cases_count: int
    average_progress_pct: float
    ready_for_enterpro_count: int


class AttritionRiskMetrics(BaseModel):
    total_evaluated: int
    priority_review_count: int
    review_count: int
    monitor_count: int
    top_risk_driver: str


class SkillGapHeatmapCell(BaseModel):
    department_name: str
    role_title: str
    skill_name: str
    required_level: int
    average_proficiency: float
    gap_magnitude: float
    coverage_status: str = Field(description="'optimal', 'mild_gap', 'critical_gap'")


class PriorityAlert(BaseModel):
    id: str
    category: str = Field(description="'onboarding_blocker', 'retention_risk', 'compliance_superseded', 'recruitment_sla'")
    title: str
    severity: str = Field(description="'critical', 'warning', 'info'")
    evidence_snippet: str
    recommended_action: str
    target_route: str


class DashboardSummaryResponse(BaseModel):
    """Aggregate dashboard metrics calculated dynamically from persisted Supabase records."""
    organization_id: str
    organization_name: str
    generated_at: datetime
    is_leadership_view: bool = False
    recruitment_funnel: RecruitmentFunnelMetrics
    attendance: AttendanceMetrics
    onboarding: OnboardingProgressMetrics
    attrition_overview: AttritionRiskMetrics
    critical_skill_gaps_count: int
    active_recommendations_count: int
    priority_alerts: List[PriorityAlert] = Field(default_factory=list)
    skill_heatmap: List[SkillGapHeatmapCell] = Field(default_factory=list)
