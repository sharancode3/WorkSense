"""Pydantic schemas for HR Policy Reasoning (Stage 6)."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class PolicyChunkResponse(BaseModel):
    """Chunk of an authoritative policy document."""
    id: str
    policy_document_id: str
    policy_title: str
    policy_code: str
    policy_version_id: str
    version_number: str
    page_number: int
    section_heading: str
    chunk_text: str
    chunk_index: int
    token_count: int
    access_classification: str


class PolicyCitation(BaseModel):
    """Grounding citation linking model statements directly to policy excerpts."""
    policy_id: str
    policy_title: str
    policy_code: str
    version_number: str
    effective_date: str
    page_number: int
    section_heading: str
    excerpt: str
    relevance_score: float = Field(default=1.0, ge=0.0, le=1.0)


class ProposedPolicyAction(BaseModel):
    """Action suggested by policy reasoning requiring explicit human confirmation."""
    action_type: str = Field(description="e.g. 'submit_remote_request', 'manager_exception_review'")
    title: str
    description: str
    required_role: str = Field(default="employee")
    requires_approval: bool = True
    approval_role: str = Field(default="manager")
    payload: Dict[str, Any] = Field(default_factory=dict)


class PolicyQueryRequest(BaseModel):
    """Natural language query submitted against the authoritative policy library."""
    query_text: str = Field(min_length=3, max_length=1000)
    category_filter: Optional[str] = None
    target_version_status: str = Field(default="active", description="active, all, or specific version")


class PolicyQueryResponse(BaseModel):
    """Grounded answer from Qwen with exact citations and confidence state."""
    query_id: str
    query_text: str
    answer_text: str
    confidence_state: str = Field(
        description="supported, partially_supported, conflicting_sources, insufficient_evidence, no_applicable_policy_found, policy_may_be_outdated, human_review_required"
    )
    applicable_conditions: List[str] = Field(default_factory=list)
    exceptions: List[str] = Field(default_factory=list)
    required_next_step: Optional[str] = None
    citations: List[PolicyCitation] = Field(default_factory=list)
    proposed_action: Optional[ProposedPolicyAction] = None
    policy_count_evaluated: int = 0
    qwen_model_used: str = "qwen3:4b-instruct-2507-q4_K_M"
    is_degraded: bool = False
    created_at: datetime


class PolicyActionSubmitRequest(BaseModel):
    """Request to initiate a human-approved policy workflow action."""
    policy_query_id: Optional[str] = None
    action_type: str
    action_payload: Dict[str, Any] = Field(default_factory=dict)
    notes: Optional[str] = None


class PolicyActionRequestResponse(BaseModel):
    """Record of a policy action request."""
    id: str
    policy_query_id: Optional[str] = None
    action_type: str
    action_payload: Dict[str, Any]
    status: str
    requester_id: str
    approver_id: Optional[str] = None
    approver_notes: Optional[str] = None
    created_at: datetime


class PolicyUploadResponse(BaseModel):
    """Result of policy ingestion, text extraction, and chunk indexing."""
    policy_document_id: str
    policy_version_id: str
    title: str
    version_number: str
    file_name: str
    file_size_bytes: int
    extracted_chunks_count: int
    total_tokens_estimated: int
    ocr_required: bool = False
    sha256_hash: str
    processing_status: str = "indexed"
