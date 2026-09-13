"""Pydantic schemas for HR Policy Reasoning (Stage 6)."""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, model_validator


class PolicyChunkResponse(BaseModel):
    """Chunk of an authoritative policy document."""
    id: str
    policy_document_id: str
    policy_title: str
    policy_code: str
    policy_version_id: str
    version_number: str
    effective_date: Optional[str] = "2026-01-01"
    organization_id: Optional[str] = None
    page_number: int
    section_heading: str
    chunk_text: str
    chunk_index: int
    token_count: int
    access_classification: str = "all_employees"
    status: Optional[str] = "active"
    created_at: Optional[Any] = None


class PolicyCitation(BaseModel):
    """Grounding citation linking model statements directly to policy excerpts."""
    policy_id: Optional[str] = None
    policy_title: str
    policy_code: str
    version_number: str
    effective_date: Optional[str] = None
    page_number: int
    section_heading: str
    excerpt: str = ""
    verbatim_quote: str = ""
    relevance_score: float = Field(default=1.0, ge=0.0, le=1.0)

    @model_validator(mode="before")
    @classmethod
    def sync_citation_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            quote = data.get("verbatim_quote") or data.get("excerpt") or ""
            data["excerpt"] = quote
            data["verbatim_quote"] = quote
        return data


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
    """Grounded answer with exact citations and confidence state."""
    query_id: str
    query_text: str
    answer_text: str = ""
    direct_answer: str = ""
    reasoning_summary: str = ""
    confidence_state: str = "supported"
    confidence_band: str = "high"
    applicable_conditions: List[str] = Field(default_factory=list)
    applicable_clauses: List[str] = Field(default_factory=list)
    exceptions: List[str] = Field(default_factory=list)
    required_next_step: Optional[str] = None
    citations: List[PolicyCitation] = Field(default_factory=list)
    proposed_action: Optional[ProposedPolicyAction] = None
    suggested_action_type: Optional[str] = None
    policy_count_evaluated: int = 0
    qwen_model_used: str = "qwen3:4b-instruct-2507-q4_K_M"
    is_degraded: bool = False
    qwen_assisted: bool = False
    is_authoritative: bool = True
    escalation_required: bool = False
    escalation_reason: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @model_validator(mode="before")
    @classmethod
    def sync_query_response_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            # 1. Sync answer_text and direct_answer
            ans = data.get("direct_answer") or data.get("answer_text") or ""
            data["answer_text"] = ans
            data["direct_answer"] = ans

            # 2. Sync reasoning_summary
            if not data.get("reasoning_summary"):
                data["reasoning_summary"] = (
                    "Synthesized from authoritative organization policy documents with verifiable source citations."
                )

            # 3. Sync applicable_conditions and applicable_clauses
            clauses = data.get("applicable_clauses") or data.get("applicable_conditions") or []
            data["applicable_clauses"] = clauses
            data["applicable_conditions"] = clauses

            # 4. Sync confidence_band and confidence_state
            c_state = data.get("confidence_state") or "supported"
            if "confidence_band" not in data:
                if c_state in ["supported", "high"]:
                    data["confidence_band"] = "high"
                elif c_state in ["partially_supported", "medium"]:
                    data["confidence_band"] = "medium"
                elif c_state in ["insufficient_evidence", "low"]:
                    data["confidence_band"] = "insufficient_evidence"
                else:
                    data["confidence_band"] = "medium"
            else:
                c_band = data["confidence_band"]
                if c_band == "high":
                    data["confidence_state"] = "supported"
                elif c_band in ["low", "insufficient_evidence"]:
                    data["confidence_state"] = "insufficient_evidence"

            # 5. Suggested action type
            if not data.get("suggested_action_type") and data.get("proposed_action"):
                pa = data["proposed_action"]
                if isinstance(pa, dict):
                    data["suggested_action_type"] = pa.get("action_type")
                elif hasattr(pa, "action_type"):
                    data["suggested_action_type"] = pa.action_type
        return data


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
