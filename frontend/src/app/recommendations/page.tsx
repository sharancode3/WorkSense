"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  CheckCircle2,
  Cpu,
  RefreshCw,
  Shield,
} from "lucide-react";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { Spinner } from "@/components/ui/spinner";
import {
  executeRecommendationApi,
  listNotificationsApi,
  listRecommendationsApi,
  reviewRecommendationApi,
} from "@/lib/api/recommendation";
import {
  CanonicalRecommendation,
  NotificationItem,
  RecommendationExecutionResponse,
} from "@/types/recommendation";

export default function RecommendationsWorkflowPage() {
  const [recommendations, setRecommendations] = useState<CanonicalRecommendation[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [moduleFilter, setModuleFilter] = useState<string>("all");

  // Approval Modal State
  const [reviewingRec, setReviewingRec] = useState<CanonicalRecommendation | null>(null);
  const [reviewDecision, setReviewDecision] = useState<"approved" | "rejected">("approved");
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // EnterPro Dispatch Modal State
  const [executingRec, setExecutingRec] = useState<CanonicalRecommendation | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<RecommendationExecutionResponse | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [recs, notifs] = await Promise.all([
        listRecommendationsApi(),
        listNotificationsApi(),
      ]);
      setRecommendations(recs);
      setNotifications(notifs);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load recommendations.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingRec) return;
    const rationale = reviewNotes.trim() || `Human decision recorded: ${reviewDecision} based on verified evidence review.`;
    setIsSubmittingReview(true);
    try {
      await reviewRecommendationApi(reviewingRec.id, {
        decision: reviewDecision,
        reasoning: rationale,
        notes: rationale,
      });
      setReviewingRec(null);
      setReviewNotes("");
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit review.";
      alert(msg);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleExecuteDispatch = async (rec: CanonicalRecommendation) => {
    setExecutingRec(rec);
    setIsDispatching(true);
    setDispatchResult(null);
    try {
      const res = await executeRecommendationApi(rec.id);
      setDispatchResult(res);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to dispatch recommendation.";
      alert(msg);
    } finally {
      setIsDispatching(false);
    }
  };

  const filteredRecs = recommendations.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (moduleFilter !== "all" && r.source_module !== moduleFilter) return false;
    return true;
  });

  return (
    <ProtectedRoute allowedRoles={["manager", "hr", "leadership", "administrator"]}>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                Recommendations & Human Approvals
              </h1>
              <Badge variant="outline" className="border-purple-500/40 text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 text-xs">
                EnterPro Orchestration Ready
              </Badge>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Cross-module human approval gateway with atomic EnterPro execution and twin continuity updates.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={isLoading}
              className="text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Responsible AI Watermark Banner */}
        <div className="p-3 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded flex items-start gap-2.5 text-xs text-neutral-600 dark:text-neutral-400">
          <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">
              Human Oversight Requirement:
            </span>{" "}
            AI models (Local Qwen / heuristic matchers) only generate candidate proposals. No employment actions, role transfers, or provisioning workflows execute without explicit, authenticated human approval.
          </div>
        </div>

        {error && <InlineAlert variant="danger" title="Workflow Error">{error}</InlineAlert>}

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-neutral-500 font-medium">Filter Status:</span>
            {["all", "needs_review", "approved", "dispatched"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded border capitalize transition-colors ${
                  statusFilter === st
                    ? "bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:border-neutral-100 font-medium"
                    : "bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300"
                }`}
              >
                {st.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-neutral-500 font-medium">Source Module:</span>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded px-2 py-1 text-xs text-neutral-900 dark:text-neutral-100"
            >
              <option value="all">All Modules</option>
              <option value="attrition_intel">Attrition Intelligence (Marcus Chen)</option>
              <option value="onboarding">Adaptive Onboarding (Elena Rostova)</option>
              <option value="policy_rag">Policy Reasoning</option>
            </select>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recommendations List (Col 1 & 2) */}
          <div className="lg:col-span-2 space-y-4">
            {isLoading ? (
              <Card className="p-8 text-center border-neutral-200 dark:border-neutral-800">
                <Spinner className="mx-auto mb-2" />
                <p className="text-xs text-neutral-500">Loading actionable recommendations...</p>
              </Card>
            ) : filteredRecs.length === 0 ? (
              <Card className="p-8 text-center border-dashed border-neutral-300 dark:border-neutral-700 text-xs text-neutral-500">
                No recommendations matching current filters.
              </Card>
            ) : (
              filteredRecs.map((rec) => (
                <Card
                  key={rec.id}
                  className={`p-5 border space-y-4 ${
                    rec.status === "needs_review"
                      ? "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                      : rec.status === "approved"
                      ? "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/10"
                      : "border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50"
                  }`}
                >
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs">
                        {rec.subject_name}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold text-neutral-500 border-neutral-200">
                        {rec.source_module.replace(/_/g, " ")}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[10px] capitalize font-bold ${
                          rec.status === "needs_review"
                            ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300"
                            : rec.status === "approved"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : rec.status === "dispatched"
                            ? "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300"
                            : "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300"
                        }`}
                      >
                        Status: {rec.status.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                      <span>Required Approver:</span>
                      <strong className="text-neutral-700 dark:text-neutral-300 uppercase">{rec.required_approver_role}</strong>
                    </div>
                  </div>

                  {/* Title & Summary */}
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      {rec.title}
                    </h3>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {rec.summary}
                    </p>
                  </div>

                  {/* Proposed Action Box */}
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded border border-neutral-100 dark:border-neutral-800 text-xs space-y-1">
                    <div className="font-semibold text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
                      <span>Proposed Action:</span>
                      <span className="text-[11px] font-mono text-neutral-400">
                        Type: {String(rec.proposed_action.action_type || "")}
                      </span>
                    </div>
                    {Boolean(rec.proposed_action.target_role_title) && (
                      <div className="text-neutral-600 dark:text-neutral-400">
                        Target Role: <strong>{String(rec.proposed_action.target_role_title)}</strong>
                        {Boolean(rec.proposed_action.target_department_name) && (
                          <span> • Dept: {String(rec.proposed_action.target_department_name)}</span>
                        )}
                        {Boolean(rec.proposed_action.promotion_band) && (
                          <span> • Band: {String(rec.proposed_action.promotion_band)}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Supporting Evidence Chips */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                      Supporting Evidential Basis
                    </div>
                    <div className="space-y-1">
                      {rec.supporting_evidence.map((ev, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-1.5 text-xs text-neutral-600 dark:text-neutral-400"
                        >
                          <span className="text-purple-500 font-bold">•</span>
                          <span>
                            <strong className="capitalize text-neutral-700 dark:text-neutral-300">
                              {ev.type.replace(/_/g, " ")}:
                            </strong>{" "}
                            {ev.detail}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Outcome Notes / Execution History */}
                  {rec.outcome_notes && (
                    <div className="p-2.5 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded text-xs text-emerald-800 dark:text-emerald-300">
                      {rec.outcome_notes}
                    </div>
                  )}

                  {/* Action Footer */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 dark:border-neutral-800 text-xs">
                    <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                      <span>Model: {rec.model_version}</span>
                      <span>•</span>
                      <span>Confidence: {rec.confidence_state}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {rec.status === "needs_review" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setReviewingRec(rec);
                              setReviewDecision("rejected");
                            }}
                            className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          >
                            Reject
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setReviewingRec(rec);
                              setReviewDecision("approved");
                            }}
                            className="text-xs flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Review & Approve
                          </Button>
                        </>
                      )}

                      {rec.status === "approved" && (
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={isDispatching && executingRec?.id === rec.id}
                          onClick={() => handleExecuteDispatch(rec)}
                          className="text-xs flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          {isDispatching && executingRec?.id === rec.id ? (
                            <Spinner size="sm" />
                          ) : (
                            <Cpu className="w-3.5 h-3.5" />
                          )}
                          Dispatch to EnterPro
                        </Button>
                      )}

                      {rec.status === "dispatched" && (
                        <Badge variant="outline" className="text-xs text-blue-700 border-blue-300 bg-blue-50 dark:bg-blue-950/30">
                          Dispatched & Acknowledged
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Right Column: In-App Notification Ledger */}
          <div className="space-y-4">
            <Card className="p-4 border-neutral-200 dark:border-neutral-800 space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-neutral-500" />
                  Audit Notification Feed ({notifications.length})
                </h3>
              </div>

              {notifications.length === 0 ? (
                <p className="text-xs text-neutral-400 py-4 text-center">No notifications recorded.</p>
              ) : (
                <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-3 border border-neutral-100 dark:border-neutral-800 rounded bg-neutral-50 dark:bg-neutral-800/40 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">{n.title}</span>
                        <Badge
                          variant="outline"
                          className={`text-[9px] uppercase ${
                            n.level === "success"
                              ? "text-emerald-700 border-emerald-300"
                              : n.level === "warning"
                              ? "text-amber-700 border-amber-300"
                              : n.level === "critical"
                              ? "text-rose-700 border-rose-300"
                              : "text-blue-700 border-blue-300"
                          }`}
                        >
                          {n.level}
                        </Badge>
                      </div>
                      <p className="text-neutral-600 dark:text-neutral-400 text-[11px] leading-relaxed">
                        {n.message}
                      </p>
                      <div className="pt-1 flex items-center justify-between text-[10px] text-neutral-400">
                        <span>{new Date(n.created_at).toLocaleTimeString()}</span>
                        {n.target_route && (
                          <Link href={n.target_route} className="text-blue-600 hover:underline">
                            Inspect
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Human Approval Review Modal */}
        {reviewingRec && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg p-6 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Human Oversight Sign-Off Gate
                </h3>
                <button
                  onClick={() => setReviewingRec(null)}
                  className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  Cancel
                </button>
              </div>

              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded border border-neutral-100 dark:border-neutral-800 text-xs space-y-1">
                <div className="font-semibold text-neutral-800 dark:text-neutral-200">{reviewingRec.title}</div>
                <div className="text-neutral-500">Subject: {reviewingRec.subject_name} • Module: {reviewingRec.source_module}</div>
              </div>

              <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Formal Decision
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="decision"
                        value="approved"
                        checked={reviewDecision === "approved"}
                        onChange={() => setReviewDecision("approved")}
                      />
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium">Approve Recommendation</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="decision"
                        value="rejected"
                        checked={reviewDecision === "rejected"}
                        onChange={() => setReviewDecision("rejected")}
                      />
                      <span className="text-rose-700 dark:text-rose-400 font-medium">Reject Recommendation</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Decision Audit Notes
                  </label>
                  <textarea
                    rows={3}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Enter formal justification, approvals, or operational stipulations..."
                    className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded p-2 text-xs text-neutral-900 dark:text-neutral-100"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setReviewingRec(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isSubmittingReview}
                  >
                    {isSubmittingReview ? <Spinner size="sm" /> : "Commit Human Sign-off"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* EnterPro Dispatch Result Modal */}
        {executingRec && dispatchResult && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg p-6 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                      EnterPro Simulated Dispatch Acknowledged
                    </h3>
                    <span className="text-[10px] text-purple-600 font-medium">Governed Enterprise Workflow Simulation</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setExecutingRec(null);
                    setDispatchResult(null);
                  }}
                  className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  Dismiss
                </button>
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 rounded text-xs space-y-1">
                <span className="font-mono text-[10px] text-purple-700 dark:text-purple-300 font-bold">
                  CORRELATION ID: {dispatchResult.correlation_id}
                </span>
                <p className="text-neutral-700 dark:text-neutral-300 text-xs">
                  {dispatchResult.message}
                </p>
              </div>

              <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded border border-neutral-100 dark:border-neutral-800 text-xs space-y-1">
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">Execution Outcome:</span>
                <p className="text-neutral-600 dark:text-neutral-400 whitespace-pre-line">
                  {dispatchResult.outcome_notes}
                </p>
              </div>

              <div className="flex justify-end pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setExecutingRec(null);
                    setDispatchResult(null);
                  }}
                >
                  Done
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
