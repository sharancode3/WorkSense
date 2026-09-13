"""Pydantic schemas for Canonical Recommendation-to-Action Workflow (Stage 9)."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, model_validator


class CanonicalRecommendationResponse(BaseModel):
    """Canonical recommendation schema shared across all intelligence engines."""
    id: str
    organization_id: str
    subject_id: str
    subject_name: str
    subject_type: str = Field(description="'employee', 'candidate', 'department', 'team', 'policy'")
    recommendation_type: str = Field(description=(
        "'retention_intervention', 'internal_mobility', 'performance_coaching', "
        "'skill_reskilling', 'onboarding_replan', 'recruitment_offer', 'policy_exception'"
    ))
    source_module: str = Field(description=(
        "'recruitment', 'onboarding', 'policy_rag', 'attrition_intel', "
        "'performance_intel', 'skill_intel', 'simulator'"
    ))
    title: str
    summary: str
    proposed_action: Dict[str, Any] = Field(default_factory=dict)
    supporting_evidence: List[Dict[str, Any]] = Field(default_factory=list)
    confidence_state: str = Field(
        default="supported",
        description="'supported', 'provisional', 'uncertain', 'insufficient_evidence'"
    )
    data_freshness_timestamp: datetime
    generator_type: str = Field(default="hybrid", description="'deterministic', 'qwen_assisted', 'hybrid'")
    model_version: Optional[str] = "qwen3:4b-instruct-2507-q4_K_M"
    required_approver_role: str = Field(description="'manager', 'hr', 'leadership', 'administrator'")
    status: str = Field(
        default="needs_review",
        description=(
            "'draft', 'needs_review', 'approved', 'rejected', 'changes_requested', "
            "'execution_pending', 'submitted', 'in_progress', 'completed', 'failed', 'cancelled', 'superseded'"
        )
    )
    outcome_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class RecommendationApprovalRequest(BaseModel):
    """Human approval submission with mandatory reason."""
    decision: str = Field(description="'approved', 'rejected', 'changes_requested'")
    reasoning: str = Field(default="Reviewed and approved by operator.", min_length=5, description="Mandatory accountable human rationale")
    notes: Optional[str] = None
    edited_action_payload: Optional[Dict[str, Any]] = None

    @model_validator(mode="before")
    @classmethod
    def sync_reasoning_and_notes(cls, data: Any) -> Any:
        if isinstance(data, dict):
            r = data.get("reasoning") or data.get("notes") or "Accountable human rationale provided."
            data["reasoning"] = r
            data["notes"] = r
        return data


class RecommendationExecutionResponse(BaseModel):
    """Result of workflow execution dispatched to EnterPro adapter."""
    recommendation_id: str
    correlation_id: str
    adapter_type: str = "enterpro_demonstration"
    status: str = "SIMULATED_ACKNOWLEDGEMENT"
    message: str
    outcome_notes: str
    dispatched_at: datetime


class NotificationResponse(BaseModel):
    """In-app notification for approvals, actions, and system alerts."""
    id: str
    organization_id: str
    recipient_id: str
    title: str
    message: str
    notification_type: str
    reference_id: Optional[str] = None
    is_read: bool = False
    created_at: datetime
