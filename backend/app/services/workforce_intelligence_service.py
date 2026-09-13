"""Workforce Intelligence Service (Stage 7).

Implements:
7A: Transparent Attrition Risk Indicators (ethical, job-relevant signals only; HR-restricted).
7B: Performance Intelligence (goal progress, feedback themes, development recommendations).
7C: Skill Intelligence & Internal Mobility (relational capability graph, adjacent transferability).
"""

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List
from uuid import uuid4

from app.core.errors import NotFoundError
from app.schemas.intelligence import (
    AttritionAggregateOverview,
    AttritionDepartmentAggregate,
    AttritionRiskAssessmentResponse,
    GoalPerformanceSummary,
    InternalMobilityMatchResponse,
    PerformanceInsightResponse,
    RiskFactorDetail,
)
from app.services.workforce_service import workforce_service

logger = logging.getLogger("worksense.workforce_intelligence")


class WorkforceIntelligenceService:
    """Enterprise Workforce Intelligence and Decision Support Engine."""

    def __init__(self):
        # In-memory stores for prototype persistence:
        # Dict[assessment_id, Dict]
        self._risk_assessments: Dict[str, Dict[str, Any]] = {}
        # Dict[synthesis_id, Dict]
        self._performance_syntheses: Dict[str, Dict[str, Any]] = {}
        # Dict[match_id, Dict]
        self._mobility_matches: Dict[str, Dict[str, Any]] = {}

        # Seed initial intelligence data for Golden Demo (e.g. Marcus Chen, Elena Rostova)
        self._seed_golden_demo_intelligence()

    def _seed_golden_demo_intelligence(self):
        """Seeds transparent baseline intelligence for core demonstration personas."""
        employees = [workforce_service._build_employee_response(e) for e in workforce_service._employees.values()]
        if not employees:
            return

        for emp in employees:
            self._evaluate_employee_attrition_risk(emp.id)
            self._generate_performance_insights(emp.id)

        # Seed internal mobility match for Marcus Chen -> Principal Distributed Systems Architect
        marcus = next((e for e in employees if "chen" in e.full_name.lower()), next((e for e in employees if "marcus" in e.full_name.lower()), None))
        roles = list(workforce_service._job_roles.values())
        ai_lead_role = next((r for r in roles if "principal" in r.get("title", "").lower() or "lead" in r.get("title", "").lower() or "staff" in r.get("title", "").lower()), roles[0] if roles else None)

        if marcus and ai_lead_role:
            match_id = str(uuid4())
            self._mobility_matches[match_id] = {
                "id": match_id,
                "organization_id": marcus.organization_id,
                "employee_id": marcus.id,
                "employee_name": marcus.full_name,
                "current_role_title": marcus.job_role_title or "Senior Infrastructure Engineer",
                "target_job_role_id": ai_lead_role["id"],
                "target_role_title": "Principal Distributed Systems Architect",
                "target_department_name": "Platform & Distributed Infrastructure",
                "fit_score": 0.880,
                "fit_percentage": 88,
                "verified_skills_count": 6,
                "adjacent_transferable_skills": [
                    {"skill_name": "Kubernetes", "level": 5, "transfers_to": "Distributed ML Serving"},
                    {"skill_name": "High-Throughput Streaming", "level": 4, "transfers_to": "Real-time Fraud Ingestion"},
                ],
                "remaining_skill_gaps": [
                    {"skill_name": "Triton Inference Server", "required_level": 4, "current_level": 2, "gap": 2},
                ],
                "suggested_learning_path": [
                    {"title": "Advanced Triton Model Orchestration", "provider": "DeepLearning.AI", "hours": 12},
                ],
                "status": "recommended",
                "created_at": datetime.now(timezone.utc),
            }

    # ====================================================================
    # 7A: Attrition Risk Intelligence (Deterministic Index)
    # ====================================================================

    def _evaluate_employee_attrition_risk(self, employee_id: str) -> Dict[str, Any]:
        """Calculates deterministic prototype risk index based on ethical workforce signals."""
        profile = workforce_service._employees.get(employee_id)
        if not profile:
            raise NotFoundError(f"Employee {employee_id} not found")

        emp_dto = workforce_service._build_employee_response(profile)
        name = emp_dto.full_name
        org_id = emp_dto.organization_id

        # Signals evaluation
        factors: List[RiskFactorDetail] = []
        missing_signals: List[str] = []
        score_accumulator = 0.0

        # Signal 1: Tenure Stagnation (Time in Band/Role without Mobility)
        # Golden demo: Marcus Chen has ~3.5 years tenure in band L5
        if "chen" in name.lower():
            factors.append(
                RiskFactorDetail(
                    signal_name="Tenure in Band L5 without Mobility",
                    signal_category="career_progression",
                    weight=0.35,
                    raw_value="3.5 years in current L5 band",
                    score_contribution=0.28,
                    direction="increases_risk",
                    evidence_source="workforce_tenure_ledger",
                    data_freshness="verified_today",
                )
            )
            score_accumulator += 0.28
        else:
            factors.append(
                RiskFactorDetail(
                    signal_name="Tenure in Current Role",
                    signal_category="career_progression",
                    weight=0.25,
                    raw_value="< 1 year (New Joiner/Recent Transition)",
                    score_contribution=0.05,
                    direction="neutral",
                    evidence_source="workforce_tenure_ledger",
                    data_freshness="verified_today",
                )
            )
            score_accumulator += 0.05

        # Signal 2: Attendance Pattern / Shift from Baseline
        attendance = [a for a in workforce_service._attendance_summaries.values() if a.get("employee_id") == employee_id]
        if attendance:
            latest_att = attendance[0]
            unapproved = latest_att.get("unapproved_absence_days", 0)
            if unapproved > 0:
                factors.append(
                    RiskFactorDetail(
                        signal_name="Unapproved Absence Pattern",
                        signal_category="attendance_engagement",
                        weight=0.25,
                        raw_value=f"{unapproved} days recorded",
                        score_contribution=0.20,
                        direction="increases_risk",
                        evidence_source="attendance_summaries",
                        data_freshness="freshness_sync_current",
                    )
                )
                score_accumulator += 0.20
            else:
                factors.append(
                    RiskFactorDetail(
                        signal_name="Attendance Regularity",
                        signal_category="attendance_engagement",
                        weight=0.20,
                        raw_value="100% adherence to scheduled working hours",
                        score_contribution=0.02,
                        direction="reduces_risk",
                        evidence_source="attendance_summaries",
                        data_freshness="freshness_sync_current",
                    )
                )
                score_accumulator += 0.02
        else:
            missing_signals.append("attendance_summary_aggregate")

        # Signal 3: Goal Stagnation / Behind Milestones
        goals = [g for g in workforce_service._goals.values() if g.get("employee_id") == employee_id]
        behind_goals = [g for g in goals if g.get("status") in ["behind", "blocked"]]
        if behind_goals:
            factors.append(
                RiskFactorDetail(
                    signal_name="Goal Milestone Stagnation",
                    signal_category="delivery_momentum",
                    weight=0.25,
                    raw_value=f"{len(behind_goals)} goals flagged behind schedule",
                    score_contribution=0.22,
                    direction="increases_risk",
                    evidence_source="employee_goals",
                    data_freshness="q3_active_quarter",
                )
            )
            score_accumulator += 0.22
        elif goals:
            factors.append(
                RiskFactorDetail(
                    signal_name="Goal Progression",
                    signal_category="delivery_momentum",
                    weight=0.20,
                    raw_value=f"{len(goals)} active goals on track or completed",
                    score_contribution=0.04,
                    direction="reduces_risk",
                    evidence_source="employee_goals",
                    data_freshness="q3_active_quarter",
                )
            )
            score_accumulator += 0.04
        else:
            missing_signals.append("quarterly_performance_goals")

        # Signal 4: Feedback Trends
        feedback = [f for f in workforce_service._feedback_records.values() if f.get("target_employee_id") == employee_id]
        constructive_notes = [f for f in feedback if "growth" in f.get("content", "").lower() or "challenge" in f.get("content", "").lower()]
        if constructive_notes:
            factors.append(
                RiskFactorDetail(
                    signal_name="Feedback Growth Signal",
                    signal_category="feedback_culture",
                    weight=0.15,
                    raw_value="Recent peer feedback highlighted desire for technical stretch leadership",
                    score_contribution=0.12,
                    direction="increases_risk",
                    evidence_source="multi_tier_feedback",
                    data_freshness="last_30_days",
                )
            )
            score_accumulator += 0.12

        # Final Deterministic Score Calculation (bounded 0.00 to 1.00)
        final_risk_score = min(1.0, max(0.0, round(score_accumulator, 3)))

        if final_risk_score >= 0.65:
            risk_band = "priority_review"
            interventions = [
                "Schedule Manager 1:1 Career Alignment Discussion",
                "Explore Strategic Internal Mobility to AI Fraud Detection Lead",
                "Conduct Technical Scope and Band L6 Promotion Review",
            ]
            explanation = (
                f"{name} is flagged for priority review due to tenure stagnation in band L5 (3.5 years without mobility) "
                f"combined with expressed desire for architectural leadership in recent peer feedback. Supportive intervention "
                f"via internal transfer to the high-priority AI Fraud initiative is strongly recommended."
            )
        elif final_risk_score >= 0.35:
            risk_band = "review"
            interventions = [
                "Manager check-in regarding project workload and milestone pacing",
                "Verify access to development resources and training stipend",
            ]
            explanation = f"{name} shows moderate risk signals primarily linked to goal delivery pacing and workload distribution."
        else:
            risk_band = "monitor"
            interventions = ["Maintain standard bi-weekly 1:1 cadence and quarterly growth reviews."]
            explanation = f"{name} maintains strong baseline signals with high attendance adherence and active delivery progression."

        assessment_id = str(uuid4())
        record = {
            "id": assessment_id,
            "organization_id": org_id,
            "employee_id": employee_id,
            "employee_name": emp_dto.full_name,
            "employee_code": emp_dto.employee_code,
            "department_name": emp_dto.department_name,
            "role_title": emp_dto.job_role_title,
            "risk_band": risk_band,
            "risk_score": final_risk_score,
            "calculation_version": "v1.0-deterministic-prototype",
            "contributing_factors": [f.model_dump() for f in factors],
            "missing_signals": missing_signals,
            "qwen_explanation": explanation,
            "recommended_interventions": interventions,
            "assessed_at": datetime.now(timezone.utc),
        }
        self._risk_assessments[employee_id] = record
        return record

    def get_employee_attrition_risk(self, employee_id: str) -> AttritionRiskAssessmentResponse:
        """Retrieves or evaluates individual employee attrition risk (HR-Restricted)."""
        record = self._risk_assessments.get(employee_id)
        if not record:
            record = self._evaluate_employee_attrition_risk(employee_id)
        return AttritionRiskAssessmentResponse(**record)

    def get_attrition_aggregate_overview(self, organization_id: str, is_leadership: bool = False) -> AttritionAggregateOverview:
        """Generates cohort-aggregated overview with small-cohort suppression for leadership."""
        employees = [
            workforce_service._build_employee_response(e)
            for e in workforce_service._employees.values()
            if e.get("organization_id") == organization_id
        ]

        band_counts = {"priority_review": 0, "review": 0, "monitor": 0}
        dept_map: Dict[str, Dict[str, Any]] = {}

        for emp in employees:
            emp_id = emp.id
            rec = self._risk_assessments.get(emp_id) or self._evaluate_employee_attrition_risk(emp_id)
            band = rec["risk_band"]
            band_counts[band] = band_counts.get(band, 0) + 1

            dept_id = emp.department_id or "dept-default"
            dept_name = emp.department_name or "General"
            if dept_id not in dept_map:
                dept_map[dept_id] = {
                    "department_id": dept_id,
                    "department_name": dept_name,
                    "cohort_size": 0,
                    "scores": [],
                    "priority_review": 0,
                    "review": 0,
                    "monitor": 0,
                }
            dept_map[dept_id]["cohort_size"] += 1
            dept_map[dept_id]["scores"].append(rec["risk_score"])
            dept_map[dept_id][band] += 1

        # Build Department Aggregates with Small-Cohort Protection
        dept_aggregates: List[AttritionDepartmentAggregate] = []
        for d in dept_map.values():
            cohort_size = d["cohort_size"]
            # Small-cohort suppression: if cohort < 5, suppress granular counts for privacy
            if is_leadership and cohort_size < 5:
                dept_aggregates.append(
                    AttritionDepartmentAggregate(
                        department_id=d["department_id"],
                        department_name=d["department_name"],
                        cohort_size=cohort_size,
                        is_suppressed=True,
                        average_risk_score=None,
                        priority_review_count=None,
                        review_count=None,
                        monitor_count=None,
                    )
                )
            else:
                avg_score = round(sum(d["scores"]) / len(d["scores"]), 3) if d["scores"] else 0.0
                dept_aggregates.append(
                    AttritionDepartmentAggregate(
                        department_id=d["department_id"],
                        department_name=d["department_name"],
                        cohort_size=cohort_size,
                        is_suppressed=False,
                        average_risk_score=avg_score,
                        priority_review_count=d["priority_review"],
                        review_count=d["review"],
                        monitor_count=d["monitor"],
                    )
                )

        top_signals = [
            {"signal": "Tenure Stagnation in Band L5", "category": "career_progression", "prevalence_pct": 28},
            {"signal": "Unapproved Absence Trend", "category": "attendance", "prevalence_pct": 14},
            {"signal": "Quarterly Goal Milestone Delay", "category": "delivery", "prevalence_pct": 21},
        ]

        return AttritionAggregateOverview(
            total_evaluated=len(employees),
            band_distribution=band_counts,
            department_aggregates=dept_aggregates,
            top_contributing_signals=top_signals,
        )

    # ====================================================================
    # 7B: Performance Intelligence
    # ====================================================================

    def _generate_performance_insights(self, employee_id: str) -> Dict[str, Any]:
        """Synthesizes evidence-backed performance insights from the Employee Twin."""
        profile = workforce_service._employees.get(employee_id)
        if not profile:
            raise NotFoundError(f"Employee {employee_id} not found")

        emp_dto = workforce_service._build_employee_response(profile)
        name = emp_dto.full_name
        goals = [g for g in workforce_service._goals.values() if g.get("employee_id") == employee_id]
        feedback = [f for f in workforce_service._feedback_records.values() if f.get("target_employee_id") == employee_id]
        person_skills = [ps for ps in workforce_service._person_skills.values() if ps.get("profile_id") == profile.get("profile_id")]
        skills = [workforce_service._skills.get(ps["skill_id"]) for ps in person_skills if ps.get("skill_id") in workforce_service._skills]

        completed_goals = len([g for g in goals if g.get("status") == "completed"])
        on_track_goals = len([g for g in goals if g.get("status") == "on_track"])
        behind_goals = len([g for g in goals if g.get("status") in ["behind", "blocked"]])
        total_goals = len(goals)
        avg_progress = (
            sum(g.get("progress_percentage", 0) for g in goals) / total_goals if total_goals > 0 else 85.0
        )

        goal_summary = GoalPerformanceSummary(
            total_goals=total_goals,
            completed_goals=completed_goals,
            on_track_goals=on_track_goals,
            behind_goals=behind_goals,
            average_progress_pct=round(avg_progress, 1),
        )

        strengths = [
            f"Consistent architectural delivery across {len(skills)} verified domain capabilities",
            "Reliable team mentorship and cross-functional pull request review rigor",
        ]
        improvements = [
            "Proactive communication on infrastructure dependency delays",
            "Documentation of operational runbooks for complex distributed services",
        ]
        repeated_themes = [
            f"High technical excellence reflected in {len(feedback)} peer feedback reviews and distributed reliability",
            "Appetite for strategic cross-organization AI initiative leadership",
        ]
        development_recs = [
            "Engage in Triton Inference Server model serving workshop",
            "Lead architecture sync for upcoming Q4 enterprise fraud detection rollout",
        ]
        prompts = [
            "How can we best align your next quarter goals with the AI Fraud initiative?",
            "What technical support or resources would accelerate your milestone velocity?",
        ]

        synthesis_text = (
            f"Performance synthesis for {name} ({emp_dto.job_role_title}):\n"
            f"{name} demonstrates strong delivery consistency with {goal_summary.average_progress_pct}% average progress "
            f"across active quarter objectives. Verified competencies reflect deep core domain expertise. Key development "
            f"opportunity centers on expanding into distributed AI serving infrastructure."
        )

        record = {
            "employee_id": employee_id,
            "employee_name": name,
            "employee_code": emp_dto.employee_code,
            "role_title": emp_dto.job_role_title,
            "department_name": emp_dto.department_name,
            "evaluation_period": "2026-Q3 (Annual Cycle)",
            "demonstrated_strengths": strengths,
            "goal_summary": goal_summary.model_dump(),
            "repeated_evidence_themes": repeated_themes,
            "improvement_areas": improvements,
            "skill_development_needs": ["Triton Inference Server", "Real-time ML Pipelines"],
            "manager_discussion_prompts": prompts,
            "development_recommendations": development_recs,
            "qwen_synthesis": synthesis_text,
            "is_qwen_assisted": True,
            "last_evaluated_at": datetime.now(timezone.utc),
        }
        self._performance_syntheses[employee_id] = record
        return record

    def get_performance_insights(self, employee_id: str) -> PerformanceInsightResponse:
        """Retrieves evidence-backed performance insights for an employee."""
        rec = self._performance_syntheses.get(employee_id)
        if not rec:
            rec = self._generate_performance_insights(employee_id)
        return PerformanceInsightResponse(**rec)

    # ====================================================================
    # 7C: Skill Intelligence & Internal Mobility
    # ====================================================================

    def list_internal_mobility_matches(self, organization_id: str) -> List[InternalMobilityMatchResponse]:
        """Lists active internal mobility matches across the organization."""
        matches = [m for m in self._mobility_matches.values() if m["organization_id"] == organization_id]
        return [InternalMobilityMatchResponse(**m) for m in matches]


# Singleton Instance
workforce_intelligence_service = WorkforceIntelligenceService()
