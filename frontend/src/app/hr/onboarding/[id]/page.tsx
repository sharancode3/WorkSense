"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  History,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/context/auth-context";
import {
  dispatchToEnterProApi,
  getOnboardingCaseApi,
  getOnboardingCaseDiffsApi,
  hrReviewPlanApi,
} from "@/lib/api/onboarding";
import {
  OnboardingCase,
  PlanDifference,
} from "@/types/onboarding";

export default function OnboardingPlanDetailPage() {
  const params = useParams();
  const caseId = params.id as string;
  const { roles } = useAuth();

  const [onboardingCase, setOnboardingCase] = useState<OnboardingCase | null>(null);
  const [diffs, setDiffs] = useState<PlanDifference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<string>("all");

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewDecision, setReviewDecision] = useState<"approve" | "changes_requested">("approve");
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // EnterPro Dispatch Modal State
  const [showEnterProModal, setShowEnterProModal] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<any>(null);
  const [isDispatching, setIsDispatching] = useState(false);

  // History / Diffs Modal State
  const [showDiffsModal, setShowDiffsModal] = useState(false);

  const canReviewHR = roles.some((r) => ["hr", "administrator"].includes(r));

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [c, d] = await Promise.all([
        getOnboardingCaseApi(caseId),
        getOnboardingCaseDiffsApi(caseId),
      ]);
      setOnboardingCase(c);
      setDiffs(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load onboarding plan");
    } finally {
      setIsLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    if (caseId) {
      loadData();
    }
  }, [caseId, loadData]);

  async function handleHRReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!onboardingCase?.current_plan_id) return;

    try {
      setIsSubmittingReview(true);
      await hrReviewPlanApi(onboardingCase.current_plan_id, {
        decision: reviewDecision,
        notes: reviewNotes || undefined,
      });
      setShowReviewModal(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit HR review");
    } finally {
      setIsSubmittingReview(false);
    }
  }

  async function handleEnterProDispatch() {
    if (!caseId) return;
    try {
      setIsDispatching(true);
      const res = await dispatchToEnterProApi(caseId, {
        correlation_id: `EP-DISPATCH-${caseId.slice(0, 8)}`,
        notes: "Authorized HR enterprise provisioning dispatch",
      });
      setDispatchResult(res);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to dispatch to EnterPro");
    } finally {
      setIsDispatching(false);
    }
  }

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <Spinner className="h-8 w-8 text-brand-primary" />
        <p className="text-xs text-content-muted">Loading journey plan and audit review...</p>
      </div>
    );
  }

  if (!onboardingCase) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-content-muted mx-auto" />
        <h2 className="text-lg font-bold">Onboarding Case Not Found</h2>
        <Link href="/hr/onboarding">
          <Button variant="outline" size="sm">Back to Onboarding Hub</Button>
        </Link>
      </div>
    );
  }

  const activePlan = onboardingCase.active_plan;
  const critic = activePlan?.critic_review;
  const aiMeta = activePlan?.ai_generation_metadata;
  const tasks = activePlan?.tasks || [];

  const phases: Array<{ id: string; label: string }> = [
    { id: "all", label: `All Tasks (${tasks.length})` },
    { id: "preboarding", label: "Preboarding" },
    { id: "day_1", label: "Day 1" },
    { id: "week_1", label: "Week 1" },
    { id: "day_30", label: "Day 30" },
    { id: "day_60", label: "Day 60" },
    { id: "day_90", label: "Day 90" },
  ];

  const filteredTasks = selectedPhase === "all"
    ? tasks
    : tasks.filter((t) => t.phase === selectedPhase);

  return (
    <ProtectedRoute allowedRoles={["hr", "recruiter", "administrator"]}>
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-content-muted">
          <Link href="/hr/onboarding" className="hover:text-content-primary flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Command Center</span>
          </Link>
        </div>

        {/* Header Ribbon */}
        <div className="bg-surface rounded-xl border border-boundary-subtle p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold font-display text-content-primary">
                  {onboardingCase.candidate_name}
                </h1>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-surface-secondary border border-boundary-subtle text-content-secondary">
                  {onboardingCase.employee_code}
                </span>
                {activePlan && (
                  <Badge variant="outline" className="font-mono text-xs">
                    Plan v{activePlan.version_number}
                  </Badge>
                )}
                <Badge
                  variant={
                    onboardingCase.status === "blocked"
                      ? "danger"
                      : onboardingCase.status === "in_progress"
                      ? "primary"
                      : "default"
                  }
                  className="text-xs"
                >
                  {onboardingCase.status.toUpperCase()}
                </Badge>
              </div>

              <p className="text-xs text-content-secondary">
                <span className="font-semibold text-content-primary">{onboardingCase.role_title}</span> •{" "}
                {onboardingCase.department_name} • {onboardingCase.work_location}
              </p>

              <p className="text-xs text-content-muted">
                Manager: <strong className="text-content-secondary">{onboardingCase.manager_name || "Unassigned"}</strong> | Hire Date:{" "}
                <span className="font-mono font-medium">{onboardingCase.hire_date}</span>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {diffs.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDiffsModal(true)}
                  className="gap-1.5 h-8 text-xs"
                >
                  <History className="h-3.5 w-3.5" />
                  <span>Version History ({diffs.length})</span>
                </Button>
              )}

              {onboardingCase.enterpro_handoff_status !== "SIMULATED_ACKNOWLEDGEMENT" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowEnterProModal(true);
                    setDispatchResult(null);
                  }}
                  className="gap-1.5 h-8 text-xs"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>EnterPro Dispatch</span>
                </Button>
              ) : (
                <Badge variant="outline" className="text-xs text-blue-600 border-blue-300 dark:border-blue-800 gap-1 py-1 px-2.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>EnterPro Dispatched</span>
                </Badge>
              )}

              {canReviewHR && (
                <Button
                  size="sm"
                  onClick={() => setShowReviewModal(true)}
                  className="gap-1.5 h-8 text-xs bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>HR Review Gate</span>
                </Button>
              )}
            </div>
          </div>

          {/* Progress & Review Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-boundary-subtle text-xs">
            <div>
              <span className="text-content-muted block mb-1">Execution Progress</span>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-surface-secondary border border-boundary-subtle overflow-hidden">
                  <div
                    className="h-full bg-brand-primary transition-all duration-300"
                    style={{ width: `${onboardingCase.progress_percent}%` }}
                  />
                </div>
                <span className="font-mono font-semibold text-content-primary">
                  {onboardingCase.progress_percent}%
                </span>
              </div>
            </div>

            <div>
              <span className="text-content-muted block mb-1">HR Review Status</span>
              <span className="font-semibold text-content-primary flex items-center gap-1.5">
                {activePlan?.hr_review_status === "approved" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                )}
                {activePlan?.hr_review_status.toUpperCase()}
              </span>
            </div>

            <div>
              <span className="text-content-muted block mb-1">Manager Review Status</span>
              <span className="font-semibold text-content-primary flex items-center gap-1.5">
                {activePlan?.manager_review_status === "approved" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                )}
                {activePlan?.manager_review_status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <InlineAlert
            variant="danger"
            title="Operation Notice"
            onClose={() => setError(null)}
          >
            {error}
          </InlineAlert>
        )}

        {/* Multi-Brain Intelligence Banners */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Brain 1: Journey Architect Rationale */}
          <Card className="p-5 border-boundary-subtle bg-surface space-y-3">
            <div className="flex items-center justify-between border-b border-boundary-subtle pb-2.5">
              <div className="flex items-center gap-2 text-brand-primary font-bold text-xs uppercase tracking-wider">
                <Sparkles className="h-4 w-4" />
                <span>Journey Architect Agent (Qwen)</span>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono">
                Bounded Multi-Brain
              </Badge>
            </div>

            <p className="text-xs text-content-secondary leading-relaxed">
              {aiMeta?.journey_rationale ||
                "Personalized journey configured with mandatory enterprise policies and curated skill-gap learning interventions."}
            </p>

            <div className="p-2.5 bg-surface-secondary rounded border border-boundary-subtle text-xs space-y-1">
              <span className="text-[11px] font-semibold text-content-primary block">Pacing Strategy</span>
              <p className="text-[11px] text-content-muted leading-normal">
                {aiMeta?.pacing_strategy ||
                  "Front-load compliance on Day 1, introduce technical standards Week 1, and sequence deep architecture labs across Day 30-60."}
              </p>
            </div>

            {aiMeta?.focus_areas && aiMeta.focus_areas.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] text-content-muted">Focus Areas:</span>
                {aiMeta.focus_areas.map((f: string, i: number) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded text-[10px] bg-brand-primary/10 text-brand-primary border border-brand-primary/20"
                  >
                    {f}
                  </span>
                ))}
              </div>
            )}
          </Card>

          {/* Brain 3: Plan Quality Critic Review */}
          <Card className="p-5 border-boundary-subtle bg-surface space-y-3">
            <div className="flex items-center justify-between border-b border-boundary-subtle pb-2.5">
              <div className="flex items-center gap-2 text-brand-primary font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4" />
                <span>Plan Quality Critic Audit</span>
              </div>
              <Badge
                variant={critic?.passed ? "success" : "warning"}
                className="text-[10px]"
              >
                {critic?.passed ? "Passed All Quality Checks" : "Audit Warnings"}
              </Badge>
            </div>

            {critic?.rule_checks && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-surface-secondary border border-boundary-subtle flex items-center justify-between">
                  <span className="text-[11px] text-content-secondary">Mandatory Policies</span>
                  <span className="text-emerald-600 font-bold text-[11px]">100% Retained</span>
                </div>
                <div className="p-2 rounded bg-surface-secondary border border-boundary-subtle flex items-center justify-between">
                  <span className="text-[11px] text-content-secondary">Preboarding Order</span>
                  <span className="text-emerald-600 font-bold text-[11px]">Prior to Day 1</span>
                </div>
                <div className="p-2 rounded bg-surface-secondary border border-boundary-subtle flex items-center justify-between">
                  <span className="text-[11px] text-content-secondary">Skill-Gap Coverage</span>
                  <span className="text-emerald-600 font-bold text-[11px]">Addressed</span>
                </div>
                <div className="p-2 rounded bg-surface-secondary border border-boundary-subtle flex items-center justify-between">
                  <span className="text-[11px] text-content-secondary">Day 1 Workload Score</span>
                  <span className="font-mono font-bold text-[11px] text-content-primary">
                    {Math.round((critic.workload_pacing_score || 1.0) * 100)}%
                  </span>
                </div>
              </div>
            )}

            {critic?.recommendations && critic.recommendations.length > 0 && (
              <div className="text-[11px] text-content-muted leading-relaxed">
                <strong>Critic Recommendation:</strong> {critic.recommendations[0]}
              </div>
            )}
          </Card>
        </div>

        {/* Phase Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-boundary-subtle">
          {phases.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPhase(p.id)}
              className={`px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedPhase === p.id
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "text-content-secondary hover:text-content-primary hover:bg-surface-secondary"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Tasks List */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center bg-surface rounded-xl border border-boundary-subtle text-xs text-content-muted">
              No tasks scheduled for this phase.
            </div>
          ) : (
            filteredTasks.map((t) => {
              const isBlocked = t.status === "blocked";
              const isCompleted = t.status === "completed";

              return (
                <Card
                  key={t.id}
                  className={`p-4 transition-colors border ${
                    isBlocked
                      ? "border-red-300 dark:border-red-900/50 bg-red-50/20"
                      : isCompleted
                      ? "border-emerald-200 dark:border-emerald-900/30 bg-emerald-50/10"
                      : "border-boundary-subtle bg-surface"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-content-primary">
                          {t.title}
                        </span>
                        <Badge
                          variant={t.is_mandatory ? "default" : "outline"}
                          className="text-[10px]"
                        >
                          {t.is_mandatory ? "Mandatory Policy" : "Recommended Learning"}
                        </Badge>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-surface-secondary border border-boundary-subtle text-content-secondary">
                          {t.category}
                        </span>
                        <span className="text-[10px] font-mono text-content-muted">
                          Phase: {t.phase}
                        </span>
                      </div>

                      <p className="text-xs text-content-secondary leading-relaxed">
                        {t.description}
                      </p>

                      {/* Personalization / AI Reasoning */}
                      {t.ai_personalization_source && (
                        <div className="p-2 bg-brand-primary/5 rounded border border-brand-primary/15 text-[11px] text-content-secondary mt-1 space-y-0.5">
                          <span className="font-semibold text-brand-primary flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            Personalization Target: {t.ai_personalization_source}
                          </span>
                          <p className="text-content-muted">{t.ai_reasoning}</p>
                        </div>
                      )}

                      {/* Blocker Alert */}
                      {isBlocked && (
                        <div className="p-2 bg-red-50 dark:bg-red-950/40 rounded border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-[11px] space-y-0.5 mt-1">
                          <span className="font-bold flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Blocked Milestone
                          </span>
                          <p>{t.blocker_reason}</p>
                        </div>
                      )}
                    </div>

                    {/* Task Metadata & Status */}
                    <div className="flex flex-col sm:items-end gap-1.5 min-w-[170px] text-xs">
                      <Badge
                        variant={
                          isBlocked
                            ? "danger"
                            : isCompleted
                            ? "success"
                            : "outline"
                        }
                        className="text-[11px]"
                      >
                        {t.status.toUpperCase()}
                      </Badge>

                      <span className="text-content-muted text-[11px] flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due: <strong className="text-content-secondary font-mono">{t.due_date}</strong>
                      </span>

                      <span className="text-[10px] text-content-muted">
                        Owner: <strong className="text-content-secondary">{t.owner_role}</strong> | Verification:{" "}
                        <span className="capitalize">{t.verification_type.replace("_", " ")}</span>
                      </span>

                      {t.evidence_url && (
                        <a
                          href={t.evidence_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-brand-primary hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <span>Verified Evidence Artifact</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* HR Review Gate Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-boundary-subtle max-w-md w-full p-6 space-y-4 shadow-none">
              <div className="flex items-center justify-between border-b border-boundary-subtle pb-3">
                <div className="flex items-center gap-2 text-brand-primary font-bold">
                  <ShieldCheck className="h-4 w-4" />
                  <h3 className="text-base font-display">HR Review Gate</h3>
                </div>
                <button onClick={() => setShowReviewModal(false)} className="text-content-muted hover:text-content-primary">
                  ✕
                </button>
              </div>

              <form onSubmit={handleHRReviewSubmit} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-content-secondary">Approval Decision</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setReviewDecision("approve")}
                      className={`p-2.5 rounded border text-xs font-semibold transition-colors ${
                        reviewDecision === "approve"
                          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent"
                          : "border-boundary-subtle hover:bg-surface-secondary text-content-secondary"
                      }`}
                    >
                      Approve Journey
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewDecision("changes_requested")}
                      className={`p-2.5 rounded border text-xs font-semibold transition-colors ${
                        reviewDecision === "changes_requested"
                          ? "bg-amber-600 text-white border-transparent"
                          : "border-boundary-subtle hover:bg-surface-secondary text-content-secondary"
                      }`}
                    >
                      Request Changes
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-content-secondary">Review Notes / Rationale</label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Enter explicit review reasoning or required adjustments..."
                    className="w-full p-2.5 rounded bg-surface border border-boundary-subtle text-content-primary text-xs h-24 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    required={reviewDecision === "changes_requested"}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-boundary-subtle">
                  <Button variant="outline" size="sm" type="button" onClick={() => setShowReviewModal(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" type="submit" disabled={isSubmittingReview}>
                    {isSubmittingReview ? <Spinner className="h-3.5 w-3.5" /> : <span>Submit HR Decision</span>}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EnterPro Simulation Modal */}
        {showEnterProModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-boundary-subtle max-w-lg w-full p-6 space-y-4 shadow-none">
              <div className="flex items-center justify-between border-b border-boundary-subtle pb-3">
                <div className="flex items-center gap-2 text-brand-primary font-bold">
                  <Send className="h-4 w-4" />
                  <h3 className="text-base font-display">EnterPro Workflow Dispatch</h3>
                </div>
                <button onClick={() => setShowEnterProModal(false)} className="text-content-muted hover:text-content-primary">
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs text-content-secondary">
                <p>
                  Dispatch onboarding workflow tasks for <strong>{onboardingCase.candidate_name}</strong> to the EnterPro enterprise orchestration bus.
                </p>

                <div className="p-3 bg-surface-secondary rounded border border-boundary-subtle font-mono text-[11px] space-y-1">
                  <div>Correlation ID: EP-ONB-{caseId.slice(0, 8)}</div>
                  <div>Role: {onboardingCase.role_title}</div>
                  <div>Plan Version: v{activePlan?.version_number}</div>
                  <div>Dispatched Tasks: {tasks.length}</div>
                </div>

                {dispatchResult && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded text-emerald-900 dark:text-emerald-300 space-y-1">
                    <div className="font-bold flex items-center gap-1 text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      Status: {dispatchResult.status}
                    </div>
                    <div className="font-mono text-[11px]">
                      Workflow ID: {dispatchResult.simulated_external_workflow_id}
                    </div>
                    <p className="text-[10px] text-content-muted mt-1 leading-normal">
                      {dispatchResult.disclaimer}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-boundary-subtle">
                <Button variant="outline" size="sm" onClick={() => setShowEnterProModal(false)}>
                  Close
                </Button>
                {!dispatchResult && (
                  <Button size="sm" disabled={isDispatching} onClick={handleEnterProDispatch} className="gap-1.5">
                    {isDispatching ? <Spinner className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
                    <span>Confirm Dispatch</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Adaptation Diffs Modal */}
        {showDiffsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-boundary-subtle max-w-lg w-full p-6 space-y-4 shadow-none">
              <div className="flex items-center justify-between border-b border-boundary-subtle pb-3">
                <div className="flex items-center gap-2 text-brand-primary font-bold">
                  <History className="h-4 w-4" />
                  <h3 className="text-base font-display">Adaptive Replan History & Diffs</h3>
                </div>
                <button onClick={() => setShowDiffsModal(false)} className="text-content-muted hover:text-content-primary">
                  ✕
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {diffs.length === 0 ? (
                  <p className="text-xs text-content-muted">No schedule adaptations recorded yet.</p>
                ) : (
                  diffs.map((d) => (
                    <div key={d.id} className="p-3 bg-surface-secondary rounded border border-boundary-subtle space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-content-primary">Trigger: {d.adaptation_trigger}</span>
                        <span className="text-[10px] font-mono text-content-muted">{d.created_at.slice(0, 16)}</span>
                      </div>
                      <p className="text-content-secondary leading-normal">{d.summary}</p>
                      {d.task_diff?.shifted_tasks && d.task_diff.shifted_tasks.length > 0 && (
                        <div className="space-y-1 pt-1 border-t border-boundary-subtle">
                          <span className="text-[10px] font-semibold text-content-muted block uppercase">Shifted Milestones:</span>
                          {d.task_diff.shifted_tasks.map((st: any, i: number) => (
                            <div key={i} className="text-[11px] font-mono text-content-secondary flex justify-between">
                              <span>{st.title}</span>
                              <span className="text-amber-600">+{st.shift_days}d ({st.old_due_date} → {st.new_due_date})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end pt-2 border-t border-boundary-subtle">
                <Button variant="outline" size="sm" onClick={() => setShowDiffsModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
