"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  UserCheck,
} from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { Spinner } from "@/components/ui/spinner";
import {
  completeOnboardingTaskApi,
  getMyOnboardingCaseApi,
  listOnboardingCasesApi,
  reportTaskBlockerApi,
} from "@/lib/api/onboarding";
import {
  OnboardingCase,
  OnboardingPlanTask,
} from "@/types/onboarding";

export default function EmployeeOnboardingPage() {
  const [onboardingCase, setOnboardingCase] = useState<OnboardingCase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePhase, setActivePhase] = useState<string>("all");

  // Complete Task Modal
  const [completingTask, setCompletingTask] = useState<OnboardingPlanTask | null>(null);
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const [isSubmittingCompletion, setIsSubmittingCompletion] = useState(false);

  // Blocker Modal
  const [blockingTask, setBlockingTask] = useState<OnboardingPlanTask | null>(null);
  const [blockerReason, setBlockerReason] = useState("");
  const [isSubmittingBlocker, setIsSubmittingBlocker] = useState(false);

  const loadMyJourney = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      let myCase = await getMyOnboardingCaseApi();
      if (!myCase) {
        // Demo fallback: if logged in as admin/hr/manager exploring employee experience,
        // load the primary active onboarding case (e.g. Elena Rostova)
        const allCases = await listOnboardingCasesApi();
        if (allCases.cases.length > 0) {
          myCase = allCases.cases[0];
        }
      }
      setOnboardingCase(myCase);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load onboarding journey");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMyJourney();
  }, [loadMyJourney]);

  async function handleCompleteTaskSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!completingTask) return;
    try {
      setIsSubmittingCompletion(true);
      await completeOnboardingTaskApi(completingTask.id, {
        evidence_url: evidenceUrl || undefined,
        notes: completionNotes || undefined,
      });
      setCompletingTask(null);
      setEvidenceUrl("");
      setCompletionNotes("");
      await loadMyJourney();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete milestone");
    } finally {
      setIsSubmittingCompletion(false);
    }
  }

  async function handleReportBlockerSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!blockingTask) return;
    try {
      setIsSubmittingBlocker(true);
      await reportTaskBlockerApi(blockingTask.id, {
        blocker_reason: blockerReason,
      });
      setBlockingTask(null);
      setBlockerReason("");
      await loadMyJourney();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to report blocker");
    } finally {
      setIsSubmittingBlocker(false);
    }
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Spinner className="h-8 w-8 text-brand-primary" />
          <p className="text-xs text-content-muted">Loading your personalized onboarding track...</p>
        </div>
      </AppShell>
    );
  }

  if (!onboardingCase || !onboardingCase.active_plan) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
          <UserCheck className="h-12 w-12 text-content-muted mx-auto" />
          <h2 className="text-lg font-bold">No Active Onboarding Journey</h2>
          <p className="text-xs text-content-secondary max-w-md mx-auto">
            You do not currently have an active onboarding journey assigned. If you were recently hired, HR will initiate your track shortly.
          </p>
          <Link href="/hr/onboarding/new">
            <Button size="sm">Initiate Demo Journey</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const activePlan = onboardingCase.active_plan;
  const tasks = activePlan.tasks || [];

  const phases: Array<{ id: string; label: string }> = [
    { id: "all", label: `All Milestones (${tasks.length})` },
    { id: "preboarding", label: "Preboarding" },
    { id: "day_1", label: "Day 1" },
    { id: "week_1", label: "Week 1" },
    { id: "day_30", label: "Day 30" },
    { id: "day_60", label: "Day 60" },
    { id: "day_90", label: "Day 90" },
  ];

  const filteredTasks = activePhase === "all"
    ? tasks
    : tasks.filter((t) => t.phase === activePhase);

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Welcome Banner */}
        <div className="bg-surface rounded-xl border border-boundary-subtle p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-primary/10 text-brand-primary">
                  Welcome to TechCorp
                </span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-secondary text-content-secondary border border-boundary-subtle">
                  {onboardingCase.employee_code}
                </span>
                <Badge variant="outline" className="text-xs font-mono">
                  Plan v{activePlan.version_number}
                </Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-content-primary">
                Welcome, {onboardingCase.candidate_name}!
              </h1>

              <p className="text-xs text-content-secondary">
                <strong className="text-content-primary">{onboardingCase.role_title}</strong> •{" "}
                {onboardingCase.department_name} • Manager:{" "}
                <strong className="text-content-secondary">{onboardingCase.manager_name || "Assigned Manager"}</strong>
              </p>
            </div>

            <div className="text-right sm:min-w-[160px]">
              <div className="text-xs text-content-muted mb-1">Journey Completion</div>
              <div className="text-2xl font-black font-display text-content-primary">
                {onboardingCase.progress_percent}%
              </div>
              <div className="text-[11px] text-content-muted">
                {onboardingCase.completed_tasks_count} of {onboardingCase.total_tasks_count} tasks completed
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 rounded-full bg-surface-secondary overflow-hidden border border-boundary-subtle">
            <div
              className={`h-full transition-all duration-500 ${
                onboardingCase.progress_percent === 100 ? "bg-emerald-600" : "bg-brand-primary"
              }`}
              style={{ width: `${onboardingCase.progress_percent}%` }}
            />
          </div>
        </div>

        {error && (
          <InlineAlert
            variant="danger"
            title="Journey Notice"
            onClose={() => setError(null)}
          >
            {error}
          </InlineAlert>
        )}

        {/* Phase Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-boundary-subtle">
          {phases.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePhase(p.id)}
              className={`px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
                activePhase === p.id
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "text-content-secondary hover:text-content-primary hover:bg-surface-secondary"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Milestones / Tasks List */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center bg-surface rounded-xl border border-boundary-subtle text-xs text-content-muted">
              No milestones scheduled for this phase.
            </div>
          ) : (
            filteredTasks.map((t) => {
              const isBlocked = t.status === "blocked";
              const isCompleted = t.status === "completed";

              return (
                <Card
                  key={t.id}
                  className={`p-5 transition-colors border ${
                    isBlocked
                      ? "border-red-300 dark:border-red-900/50 bg-red-50/20"
                      : isCompleted
                      ? "border-emerald-200 dark:border-emerald-900/30 bg-emerald-50/10"
                      : "border-boundary-subtle bg-surface"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-content-primary">
                          {t.title}
                        </span>
                        <Badge
                          variant={t.is_mandatory ? "default" : "outline"}
                          className="text-[10px]"
                        >
                          {t.is_mandatory ? "Mandatory Policy" : "Learning Milestone"}
                        </Badge>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-surface-secondary text-content-secondary border border-boundary-subtle">
                          {t.category}
                        </span>
                        <span className="text-[10px] font-mono text-content-muted">
                          Phase: {t.phase}
                        </span>
                      </div>

                      <p className="text-xs text-content-secondary leading-relaxed">
                        {t.description}
                      </p>

                      {/* Learning Linkage */}
                      {t.ai_personalization_source && (
                        <div className="p-2 bg-brand-primary/5 rounded border border-brand-primary/15 text-[11px] text-content-secondary mt-1 space-y-0.5">
                          <span className="font-semibold text-brand-primary flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            Target Skill Focus: {t.ai_personalization_source}
                          </span>
                          <p className="text-content-muted">{t.ai_reasoning}</p>
                        </div>
                      )}

                      {/* Blocker Alert */}
                      {isBlocked && (
                        <div className="p-2.5 bg-red-50 dark:bg-red-950/40 rounded border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs space-y-1 mt-1">
                          <span className="font-bold flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5" />
                            Blocker Reported
                          </span>
                          <p>{t.blocker_reason}</p>
                          <span className="text-[10px] text-content-muted block">
                            Your manager and HR have been notified to assist or recalibrate deadlines.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Task Actions & Status */}
                    <div className="flex flex-col sm:items-end gap-2 min-w-[180px] text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-content-muted">
                          Due: {t.due_date}
                        </span>
                        <Badge
                          variant={
                            isBlocked
                              ? "danger"
                              : isCompleted
                              ? "success"
                              : "outline"
                          }
                          className="text-[10px]"
                        >
                          {t.status.toUpperCase()}
                        </Badge>
                      </div>

                      {/* Action buttons */}
                      {!isCompleted ? (
                        <div className="flex items-center gap-2 mt-1">
                          {!isBlocked && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30"
                              onClick={() => {
                                setBlockingTask(t);
                                setBlockerReason("");
                              }}
                            >
                              <span>Report Blocker</span>
                            </Button>
                          )}

                          <Button
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={() => {
                              setCompletingTask(t);
                              setEvidenceUrl(t.evidence_url || "");
                              setCompletionNotes("");
                            }}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Complete</span>
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium text-[11px] mt-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Milestone Verified</span>
                        </div>
                      )}

                      {t.evidence_url && (
                        <a
                          href={t.evidence_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-brand-primary hover:underline flex items-center gap-1"
                        >
                          <span>View Learning Artifact</span>
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

        {/* Complete Task Modal */}
        {completingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-boundary-subtle max-w-md w-full p-6 space-y-4 shadow-none">
              <div className="flex items-center justify-between border-b border-boundary-subtle pb-3">
                <div className="flex items-center gap-2 text-brand-primary font-bold">
                  <CheckCircle2 className="h-4 w-4" />
                  <h3 className="text-base font-display">Mark Milestone Complete</h3>
                </div>
                <button onClick={() => setCompletingTask(null)} className="text-content-muted hover:text-content-primary">
                  ✕
                </button>
              </div>

              <form onSubmit={handleCompleteTaskSubmit} className="space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-content-primary">{completingTask.title}</h4>
                  <p className="text-content-muted text-[11px] mt-0.5">{completingTask.description}</p>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-content-secondary">
                    Evidence URL / Artifact URI (Optional)
                  </label>
                  <Input
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                    placeholder="https://github.com/techcorp/pr/123 or doc link"
                  />
                  <p className="text-[10px] text-content-muted">
                    Completing learning milestones commits verified skill evidence to your Employee Digital Twin.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-content-secondary">
                    Completion Notes (Optional)
                  </label>
                  <textarea
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    placeholder="Briefly describe what was completed or learned..."
                    className="w-full p-2.5 rounded bg-surface border border-boundary-subtle text-content-primary text-xs h-20 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-boundary-subtle">
                  <Button variant="outline" size="sm" type="button" onClick={() => setCompletingTask(null)}>
                    Cancel
                  </Button>
                  <Button size="sm" type="submit" disabled={isSubmittingCompletion} className="gap-1">
                    {isSubmittingCompletion ? <Spinner className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    <span>Confirm Completion</span>
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Report Blocker Modal */}
        {blockingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-boundary-subtle max-w-md w-full p-6 space-y-4 shadow-none">
              <div className="flex items-center justify-between border-b border-boundary-subtle pb-3">
                <div className="flex items-center gap-2 text-red-600 font-bold">
                  <AlertCircle className="h-4 w-4" />
                  <h3 className="text-base font-display">Report Milestone Blocker</h3>
                </div>
                <button onClick={() => setBlockingTask(null)} className="text-content-muted hover:text-content-primary">
                  ✕
                </button>
              </div>

              <form onSubmit={handleReportBlockerSubmit} className="space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-content-primary">{blockingTask.title}</h4>
                  <p className="text-content-muted text-[11px] mt-0.5">
                    Flag this milestone as blocked so your manager and HR can assist or recalibrate your journey timeline.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-content-secondary">
                    Reason for Blocker (Mandatory)
                  </label>
                  <textarea
                    value={blockerReason}
                    onChange={(e) => setBlockerReason(e.target.value)}
                    placeholder="e.g. Courier shipment delayed in transit, or awaiting credentials for repository access..."
                    className="w-full p-2.5 rounded bg-surface border border-boundary-subtle text-content-primary text-xs h-24 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-boundary-subtle">
                  <Button variant="outline" size="sm" type="button" onClick={() => setBlockingTask(null)}>
                    Cancel
                  </Button>
                  <Button variant="danger" size="sm" type="submit" disabled={isSubmittingBlocker}>
                    {isSubmittingBlocker ? <Spinner className="h-3.5 w-3.5" /> : <span>Report Blocker</span>}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
