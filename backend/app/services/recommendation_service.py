"""Canonical Recommendation-to-Action Service (Stage 9).

Connects WorkSense intelligence engines (Recruitment, Onboarding, Policy, Retention,
Performance, and Skills) to real, auditable human approval gates and EnterPro
orchestration workflows.
"""

import hashlib
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from app.core.errors import NotFoundError, ValidationError
from app.schemas.recommendation import (
    CanonicalRecommendationResponse,
    NotificationResponse,
    RecommendationExecutionResponse,
)
from app.services.workforce_service import workforce_service

logger = logging.getLogger("worksense.recommendations")


class RecommendationService:
    """Manages cross-module recommendations, human approvals, and EnterPro handoffs."""

    def __init__(self):
        # In-memory stores for prototype:
        # Dict[rec_id, Dict]
        self._recommendations: Dict[str, Dict[str, Any]] = {}
        # Dict[approval_id, Dict]
        self._approvals: Dict[str, Dict[str, Any]] = {}
        # Dict[exec_id, Dict]
        self._execution_logs: Dict[str, Dict[str, Any]] = {}
        # Dict[notif_id, Dict]
        self._notifications: Dict[str, Dict[str, Any]] = {}

        # Seed initial Golden Demo recommendations
        self._seed_canonical_recommendations()

    def _seed_canonical_recommendations(self):
        """Seeds canonical cross-module recommendations for the Golden Demo story."""
        employees = [workforce_service._build_employee_response(e) for e in workforce_service._employees.values()]
        marcus = next((e for e in employees if "chen" in e.full_name.lower()), None)
        if not marcus:
            marcus = next((e for e in employees if getattr(e, "employee_code", "") == "EMP-10492"), None)
        if not marcus:
            marcus = next((e for e in employees if "marcus" in e.full_name.lower()), employees[0] if employees else None)

        elena = next((e for e in employees if "elena" in e.full_name.lower()), None)
        org_id = marcus.organization_id if marcus else "00000000-0000-0000-0000-000000000001"

        # 1. Marcus Chen: Internal Mobility Transfer to AI Fraud Detection Team Lead
        if marcus:
            rec_id_1 = "80000000-0000-0000-0000-000000000001"
            self._recommendations[rec_id_1] = {
                "id": rec_id_1,
                "organization_id": org_id,
                "subject_id": marcus.id,
                "subject_name": marcus.full_name,
                "subject_type": "employee",
                "recommendation_type": "internal_mobility",
                "source_module": "attrition_intel",
                "title": "Strategic Internal Mobility: Transfer to Principal Architect",
                "summary": (
                    f"Mitigate 6-month attrition risk (72% index driven by 3.5 years tenure stagnation in band L5) by "
                    f"transferring {marcus.full_name} to Principal Distributed Systems Architect role for the urgent "
                    f"high-throughput streaming and inference infrastructure initiative."
                ),
                "proposed_action": {
                    "action_type": "internal_transfer",
                    "target_role_title": "AI Fraud Detection Infrastructure Lead",
                    "target_department_name": "Artificial Intelligence & Fraud Detection",
                    "effective_date": "2026-11-01",
                    "promotion_band": "L6",
                },
                "supporting_evidence": [
                    {"type": "attrition_signal", "detail": "Tenure stagnation in band L5 (3.5 years); priority review band"},
                    {"type": "skill_transfer", "detail": "Kubernetes (Level 5) and Streaming (Level 4) directly transfer to ML serving"},
                    {"type": "peer_feedback", "detail": "Expressed desire for architectural leadership in recent quarterly reviews"},
                ],
                "confidence_state": "supported",
                "data_freshness_timestamp": datetime.now(timezone.utc),
                "generator_type": "hybrid",
                "model_version": "qwen3:4b-instruct-2507-q4_K_M",
                "required_approver_role": "hr",
                "status": "needs_review",
                "outcome_notes": None,
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            }

        # 2. Elena Rostova: Onboarding Plan Activation and EnterPro Dispatch
        rec_id_2 = "80000000-0000-0000-0000-000000000002"
        self._recommendations[rec_id_2] = {
            "id": rec_id_2,
            "organization_id": org_id,
            "subject_id": elena.id if elena else "30000000-0000-0000-0000-000000000001",
            "subject_name": elena.full_name if elena else "Elena Rostova",
            "subject_type": "candidate",
            "recommendation_type": "recruitment_offer",
            "source_module": "onboarding",
            "title": "Onboarding Journey Activation & EnterPro IT Provisioning",
            "summary": (
                "Elena Rostova has accepted the Senior Distributed Systems Engineer offer (92% interview score). "
                "The multi-brain onboarding journey is fully planned and validated by the Plan Quality Critic. "
                "Ready for final dual human sign-off and EnterPro automated dispatch."
            ),
            "proposed_action": {
                "action_type": "activate_onboarding",
                "role_title": "Senior Distributed Systems Engineer",
                "hire_date": "2026-10-15",
                "enterpro_scope": ["it_provisioning", "id_badge", "aws_cluster_access"],
            },
            "supporting_evidence": [
                {"type": "interview_synthesis", "detail": "92% overall composite score across Triton and PyTorch competencies"},
                {"type": "critic_audit", "detail": "100% compliance with mandatory Infosec & Remote policies"},
            ],
            "confidence_state": "supported",
            "data_freshness_timestamp": datetime.now(timezone.utc),
            "generator_type": "deterministic",
            "model_version": "qwen3:4b-instruct-2507-q4_K_M",
            "required_approver_role": "manager",
            "status": "needs_review",
            "outcome_notes": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }

        # 3. Policy Exception Request: Remote Equipment Stipend
        rec_id_3 = "80000000-0000-0000-0000-000000000003"
        self._recommendations[rec_id_3] = {
            "id": rec_id_3,
            "organization_id": org_id,
            "subject_id": marcus.id if marcus else "69000000-0000-0000-0000-000000000001",
            "subject_name": "Engineering Team Cohort",
            "subject_type": "team",
            "recommendation_type": "policy_exception",
            "source_module": "policy_rag",
            "title": "Remote Work Home Office Stipend Authorization (POL-REM-01)",
            "summary": (
                "Authorize $1,000 one-time home office equipment stipend for eligible remote team members "
                "under approved Remote Work Policy POL-REM-01 v2.0."
            ),
            "proposed_action": {
                "action_type": "stipend_approval",
                "policy_code": "POL-REM-01",
                "stipend_amount_usd": 1000,
            },
            "supporting_evidence": [
                {"type": "policy_clause", "detail": "POL-REM-01 Section 3: Reimbursable home office equipment clause"},
            ],
            "confidence_state": "supported",
            "data_freshness_timestamp": datetime.now(timezone.utc),
            "generator_type": "qwen_assisted",
            "model_version": "qwen3:4b-instruct-2507-q4_K_M",
            "required_approver_role": "hr",
            "status": "needs_review",
            "outcome_notes": None,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }

        # Seed notification for Marcus Chen
        notif_id_1 = str(uuid4())
        self._notifications[notif_id_1] = {
            "id": notif_id_1,
            "organization_id": org_id,
            "recipient_id": "hr-specialist-uuid",
            "title": "Action Required: Marcus Chen Internal Mobility",
            "message": "High priority retention intervention recommendation requires HR sign-off.",
            "notification_type": "approval_requested",
            "reference_id": rec_id_1,
            "is_read": False,
            "created_at": datetime.now(timezone.utc),
        }

        # Seed notification for Elena Rostova
        notif_id_2 = str(uuid4())
        self._notifications[notif_id_2] = {
            "id": notif_id_2,
            "organization_id": org_id,
            "recipient_id": "hr-specialist-uuid",
            "title": "Action Required: Elena Rostova Provisioning Review",
            "message": "Onboarding activation and EnterPro workstation provisioning gate ready for manager review.",
            "notification_type": "approval_requested",
            "reference_id": rec_id_2,
            "is_read": False,
            "created_at": datetime.now(timezone.utc),
        }

    # ====================================================================
    # Queries & Filters
    # ====================================================================

    def list_recommendations(
        self,
        organization_id: str,
        status: Optional[str] = None,
        source_module: Optional[str] = None,
        recommendation_type: Optional[str] = None,
    ) -> List[CanonicalRecommendationResponse]:
        """Lists canonical recommendations filtered by organization and status."""
        recs = [r for r in self._recommendations.values() if r["organization_id"] == organization_id]

        if status:
            recs = [r for r in recs if r["status"] == status]
        if source_module:
            recs = [r for r in recs if r["source_module"] == source_module]
        if recommendation_type:
            recs = [r for r in recs if r["recommendation_type"] == recommendation_type]

        recs.sort(key=lambda x: x["created_at"], reverse=True)
        return [CanonicalRecommendationResponse(**r) for r in recs]

    def get_recommendation(self, recommendation_id: str) -> CanonicalRecommendationResponse:
        """Retrieves a single canonical recommendation by ID."""
        rec = self._recommendations.get(recommendation_id)
        if not rec:
            raise NotFoundError(f"Recommendation {recommendation_id} not found")
        return CanonicalRecommendationResponse(**rec)

    # ====================================================================
    # Human Review & Approval Gates
    # ====================================================================

    def submit_approval(
        self,
        recommendation_id: str,
        approver_id: str,
        decision: str,
        reasoning: str,
        edited_action_payload: Optional[Dict[str, Any]] = None,
    ) -> CanonicalRecommendationResponse:
        """Submits an accountable human decision (Approve, Reject, Request Changes) with mandatory reasoning."""
        rec = self._recommendations.get(recommendation_id)
        if not rec:
            raise NotFoundError(f"Recommendation {recommendation_id} not found")

        if decision not in ["approved", "rejected", "changes_requested"]:
            raise ValidationError("Decision must be 'approved', 'rejected', or 'changes_requested'")

        if len(reasoning.strip()) < 5:
            raise ValidationError("A written human justification (minimum 5 characters) is mandatory")

        approval_id = str(uuid4())
        self._approvals[approval_id] = {
            "id": approval_id,
            "recommendation_id": recommendation_id,
            "approver_id": approver_id,
            "decision": decision,
            "reasoning": reasoning,
            "created_at": datetime.now(timezone.utc),
        }

        if decision == "approved":
            rec["status"] = "approved"
            if edited_action_payload:
                rec["proposed_action"].update(edited_action_payload)
            rec["outcome_notes"] = f"Approved by human reviewer: {reasoning}"
        elif decision == "rejected":
            rec["status"] = "rejected"
            rec["outcome_notes"] = f"Rejected with rationale: {reasoning}"
        elif decision == "changes_requested":
            rec["status"] = "changes_requested"
            rec["outcome_notes"] = f"Modifications requested: {reasoning}"

        rec["updated_at"] = datetime.now(timezone.utc)
        return CanonicalRecommendationResponse(**rec)

    # ====================================================================
    # EnterPro Enterprise Execution (Simulated Demonstration Adapter)
    # ====================================================================

    def dispatch_to_enterpro(
        self,
        recommendation_id: str,
        dispatched_by_id: str,
    ) -> RecommendationExecutionResponse:
        """Executes approved recommendation via the EnterPro Enterprise Adapter."""
        rec = self._recommendations.get(recommendation_id)
        if not rec:
            raise NotFoundError(f"Recommendation {recommendation_id} not found")

        # If already executed, return idempotent result
        existing_log = next((log for log in self._execution_logs.values() if log["recommendation_id"] == recommendation_id), None)
        if existing_log:
            return RecommendationExecutionResponse(
                recommendation_id=recommendation_id,
                correlation_id=existing_log["correlation_id"],
                adapter_type="enterpro_demonstration",
                status="SIMULATED_ACKNOWLEDGEMENT",
                message="[IDEMPOTENT DISPATCH] Handshake previously acknowledged by EnterPro adapter.",
                outcome_notes=existing_log["outcome_notes"],
                dispatched_at=existing_log["created_at"],
            )

        if rec["status"] != "approved":
            raise ValidationError(
                f"Cannot dispatch recommendation in '{rec['status']}' state. Only 'approved' recommendations can be executed."
            )

        # Generate deterministic correlation ID & idempotency hash
        payload = {
            "recommendation_id": recommendation_id,
            "organization_id": rec["organization_id"],
            "subject_id": rec["subject_id"],
            "action_type": rec["proposed_action"].get("action_type"),
            "action_payload": rec["proposed_action"],
            "dispatched_by": dispatched_by_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        payload_bytes = json.dumps(payload, sort_keys=True).encode("utf-8")
        correlation_id = f"EP-ACT-{hashlib.sha256(payload_bytes).hexdigest()[:12].upper()}"
        idempotency_key = f"IDEMP-{recommendation_id}-{correlation_id}"

        # Update recommendation state to completed
        rec["status"] = "completed"
        outcome_msg = (
            f"Successfully orchestrated via EnterPro adapter under correlation ID {correlation_id}. "
            f"Enterprise workflow queued."
        )
        rec["outcome_notes"] = outcome_msg
        rec["updated_at"] = datetime.now(timezone.utc)

        exec_id = str(uuid4())
        exec_log = {
            "id": exec_id,
            "recommendation_id": recommendation_id,
            "dispatched_by_id": dispatched_by_id,
            "adapter_type": "enterpro_demonstration",
            "correlation_id": correlation_id,
            "idempotency_key": idempotency_key,
            "payload": payload,
            "status": "SIMULATED_ACKNOWLEDGEMENT",
            "outcome_notes": outcome_msg,
            "created_at": datetime.now(timezone.utc),
        }
        self._execution_logs[exec_id] = exec_log

        # Create notification for completion
        notif_id = str(uuid4())
        self._notifications[notif_id] = {
            "id": notif_id,
            "organization_id": rec["organization_id"],
            "recipient_id": dispatched_by_id,
            "title": "Workflow Completed via EnterPro",
            "message": f"Recommendation '{rec['title']}' was dispatched to EnterPro (Correlation: {correlation_id}).",
            "notification_type": "execution_completed",
            "reference_id": recommendation_id,
            "is_read": False,
            "created_at": datetime.now(timezone.utc),
        }

        # If recommendation was Marcus Chen's transfer, update Employee Twin role title!
        if "marcus" in rec["subject_name"].lower() and rec["recommendation_type"] == "internal_mobility":
            emp = workforce_service._employees.get(rec["subject_id"])
            if emp:
                emp["job_role_title"] = "AI Fraud Detection Infrastructure Lead"
                logger.info("Updated Employee Twin for %s to new role: AI Fraud Detection Infrastructure Lead", emp.get('employee_code', ''))

        return RecommendationExecutionResponse(
            recommendation_id=recommendation_id,
            correlation_id=correlation_id,
            adapter_type="enterpro_demonstration",
            status="SIMULATED_ACKNOWLEDGEMENT",
            message=(
                f"[DEMONSTRATION ADAPTER] Handshake acknowledged. EnterPro enterprise workflow "
                f"dispatched under correlation ID {correlation_id}."
            ),
            outcome_notes=outcome_msg,
            dispatched_at=datetime.now(timezone.utc),
        )

    # ====================================================================
    # In-App Notifications
    # ====================================================================

    def list_notifications(
        self,
        organization_id: str,
        recipient_id: Optional[str] = None,
        user_roles: Optional[List[str]] = None,
    ) -> List[NotificationResponse]:
        """Lists in-app notifications with role-based and recipient fallback."""
        notifs = [n for n in self._notifications.values() if n["organization_id"] == organization_id]
        if recipient_id:
            roles = [r.lower() for r in (user_roles or [])]
            is_hr_or_manager = any(r in ["hr", "manager", "administrator", "leadership"] for r in roles)
            notifs = [
                n for n in notifs
                if n["recipient_id"] == recipient_id
                or n["recipient_id"] in ["system", "all", "*"]
                or (is_hr_or_manager and n["recipient_id"] == "hr-specialist-uuid")
            ]
        notifs.sort(key=lambda x: x["created_at"], reverse=True)
        return [NotificationResponse(**n) for n in notifs]


# Singleton Instance
recommendation_service = RecommendationService()
