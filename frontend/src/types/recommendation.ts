/**
 * WorkSense Stage 9: Recommendation-to-Action Workflow Types
 */

export interface SupportingEvidenceItem {
  type: string;
  detail: string;
}

export interface CanonicalRecommendation {
  id: string;
  organization_id: string;
  subject_id: string;
  subject_name: string;
  subject_type: "candidate" | "employee" | "team";
  recommendation_type: "recruitment_offer" | "internal_mobility" | "policy_exception" | "onboarding_adaptation";
  source_module: "recruitment" | "attrition_intel" | "onboarding" | "policy_rag";
  title: string;
  summary: string;
  proposed_action: Record<string, unknown>;
  supporting_evidence: SupportingEvidenceItem[];
  confidence_state: "supported" | "needs_context" | "insufficient_evidence";
  data_freshness_timestamp: string;
  generator_type: "deterministic" | "qwen_assisted" | "hybrid";
  model_version: string;
  required_approver_role: "hr" | "manager" | "admin";
  status: "needs_review" | "approved" | "rejected" | "dispatched" | "executed";
  outcome_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecommendationApprovalRequest {
  decision: "approved" | "rejected" | "changes_requested";
  reasoning?: string;
  notes?: string;
}

export interface RecommendationApprovalResponse {
  approval_id: string;
  recommendation_id: string;
  decision: "approved" | "rejected";
  notes: string;
  approver_id: string;
  approver_name: string;
  decided_at: string;
}

export interface RecommendationExecutionResponse {
  recommendation_id: string;
  correlation_id: string;
  adapter_type: string;
  status: "SIMULATED_ACKNOWLEDGEMENT" | "DISPATCHED" | "FAILED";
  message: string;
  outcome_notes: string;
  dispatched_at: string;
}

export interface NotificationItem {
  id: string;
  organization_id: string;
  recipient_id: string;
  title: string;
  message: string;
  level: "info" | "warning" | "success" | "critical";
  target_route?: string | null;
  is_read: boolean;
  created_at: string;
}
