"""Pydantic schemas for Workforce Intelligence (Stage 7)."""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, model_validator


# ====================================================================
# 7A: Attrition Risk Intelligence
# ====================================================================

class RiskFactorDetail(BaseModel):
    """Specific evidence-backed factor contributing to prototype attrition index."""
    signal_name: str
    signal_category: str
    weight: float
    raw_value: Any
    score_contribution: float
    direction: str = Field(description="'increases_risk', 'reduces_risk', 'neutral'")
    evidence_source: str
    data_freshness: str


class AttritionRiskAssessmentResponse(BaseModel):
    """Transparent prototype risk indicator for a single employee."""
    id: str
    organization_id: Optional[str] = None
    employee_id: str
    employee_name: str
    employee_code: str
    department_name: str
    role_title: str
    risk_band: str = Field(description="'monitor', 'review', 'priority_review'")
    risk_score: float = Field(ge=0.0, le=1.0, description="0.000 to 1.000 transparent index")
    calculation_version: str = "v1.0-deterministic-prototype"
    contributing_factors: List[RiskFactorDetail] = Field(default_factory=list)
    risk_factors: List[RiskFactorDetail] = Field(default_factory=list)
    missing_signals: List[str] = Field(default_factory=list)
    qwen_explanation: Optional[str] = None
    explanation: str = ""
    recommended_interventions: List[str] = Field(default_factory=list)
    supportive_interventions: List[str] = Field(default_factory=list)
    is_mitigated: bool = False
    assessed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    evaluated_at: Optional[datetime] = None

    @model_validator(mode="before")
    @classmethod
    def populate_aliases(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # Sync contributing_factors <-> risk_factors
            cf = data.get("contributing_factors") or data.get("risk_factors") or []
            data["contributing_factors"] = cf
            data["risk_factors"] = cf

            # Sync recommended_interventions <-> supportive_interventions
            ri = data.get("recommended_interventions") or data.get("supportive_interventions") or []
            data["recommended_interventions"] = ri
            data["supportive_interventions"] = ri

            # Sync qwen_explanation <-> explanation
            exp = data.get("explanation") or data.get("qwen_explanation") or ""
            data["explanation"] = exp
            data["qwen_explanation"] = exp

            # Sync assessed_at <-> evaluated_at
            dt = data.get("evaluated_at") or data.get("assessed_at")
            if dt:
                data["assessed_at"] = dt
                data["evaluated_at"] = dt
        return data


class AttritionDepartmentAggregate(BaseModel):
    """Cohort aggregated attrition metrics (protected for small cohorts)."""
    department_id: str
    department_name: str
    cohort_size: int
    is_suppressed: bool = False
    average_risk_score: Optional[float] = None
    priority_review_count: Optional[int] = None
    review_count: Optional[int] = None
    monitor_count: Optional[int] = None


class AttritionAggregateOverview(BaseModel):
    """Organization-wide transparent attrition overview."""
    total_evaluated: int
    band_distribution: Dict[str, int] = Field(default_factory=dict)
    department_aggregates: List[AttritionDepartmentAggregate] = Field(default_factory=list)
    top_contributing_signals: List[Dict[str, Any]] = Field(default_factory=list)
    calculation_disclaimer: str = (
        "[PROTOTYPE DECISION-SUPPORT SIGNAL] This is a transparent index based on configured workforce signals, "
        "not an automated certainty or employment decision."
    )


# ====================================================================
# 7B: Performance Intelligence
# ====================================================================

class GoalPerformanceSummary(BaseModel):
    total_goals: int
    completed_goals: int
    on_track_goals: int
    behind_goals: int
    average_progress_pct: float


class PerformanceInsightResponse(BaseModel):
    """Evidence-backed performance and development synthesis."""
    employee_id: str
    employee_name: str
    employee_code: str
    role_title: str
    department_name: str
    evaluation_period: str
    demonstrated_strengths: List[str] = Field(default_factory=list)
    goal_summary: GoalPerformanceSummary
    repeated_evidence_themes: List[str] = Field(default_factory=list)
    improvement_areas: List[str] = Field(default_factory=list)
    skill_development_needs: List[str] = Field(default_factory=list)
    manager_discussion_prompts: List[str] = Field(default_factory=list)
    development_recommendations: List[str] = Field(default_factory=list)
    qwen_synthesis: Optional[str] = None
    is_qwen_assisted: bool = False
    last_evaluated_at: datetime


# ====================================================================
# 7C: Skill Intelligence & Internal Mobility
# ====================================================================

class EmployeeSkillCoverageItem(BaseModel):
    skill_id: str
    skill_name: str
    category: str
    required_level: int
    current_level: int
    gap: int
    recency_months: int
    is_stale: bool
    status: str = Field(description="'verified', 'adjacent_transferable', 'confirmed_gap', 'missing_evidence'")


class InternalMobilityMatchResponse(BaseModel):
    """Internal mobility match recommendation based on skill graph transferability."""
    id: str
    employee_id: str
    employee_name: str
    current_role_title: str
    target_job_role_id: str
    target_role_title: str
    target_department_name: str
    fit_score: float = Field(ge=0.0, le=1.0)
    fit_percentage: int
    verified_skills_count: int
    adjacent_transferable_skills: List[Dict[str, Any]] = Field(default_factory=list)
    remaining_skill_gaps: List[Dict[str, Any]] = Field(default_factory=list)
    suggested_learning_path: List[Dict[str, Any]] = Field(default_factory=list)
    status: str = "recommended"
    created_at: datetime


class DepartmentCapabilityOverview(BaseModel):
    department_id: str
    department_name: str
    total_headcount: int
    critical_skill_gaps: List[str] = Field(default_factory=list)
    average_skill_coverage_pct: float
    stale_skills_count: int
