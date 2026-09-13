/**
 * WorkSense Stage 6: Policy Reasoning & RAG Types
 */

export interface PolicyChunk {
  id: string;
  policy_document_id: string;
  policy_version_id: string;
  policy_title: string;
  policy_code: string;
  version_number: string;
  effective_date: string;
  organization_id: string;
  page_number: number;
  section_heading: string;
  chunk_text: string;
  chunk_index: number;
  token_count: number;
  access_classification: string;
  status: string;
  created_at: string;
}

export interface PolicyCitation {
  policy_code: string;
  policy_title: string;
  version_number: string;
  page_number: number;
  section_heading: string;
  verbatim_quote: string;
  relevance_score: number;
}

export interface PolicyQueryRequest {
  query_text: string;
  actor_role?: string;
  department_id?: string;
  max_citations?: number;
}

export interface PolicyQueryResponse {
  query_id: string;
  query_text: string;
  direct_answer: string;
  reasoning_summary: string;
  applicable_clauses: string[];
  confidence_band: "high" | "medium" | "low" | "insufficient_evidence";
  is_authoritative: boolean;
  citations: PolicyCitation[];
  escalation_required: boolean;
  escalation_reason?: string | null;
  suggested_action_type?: string | null;
  qwen_assisted: boolean;
  created_at: string;
}

export interface PolicyDocumentUploadResponse {
  policy_document_id: string;
  policy_version_id: string;
  policy_code: string;
  title: string;
  version_number: string;
  total_pages_extracted: number;
  total_chunks_created: number;
  ocr_applied: boolean;
  access_classification: string;
  status: string;
  message: string;
}

export interface PolicyActionCreate {
  policy_code: string;
  action_type: string;
  requested_by_employee_id: string;
  justification: string;
  payload?: Record<string, unknown>;
}

export interface PolicyActionResponse {
  id: string;
  policy_code: string;
  action_type: string;
  requested_by_employee_id: string;
  status: "pending_review" | "approved" | "rejected";
  justification: string;
  approval_notes?: string | null;
  created_at: string;
}
