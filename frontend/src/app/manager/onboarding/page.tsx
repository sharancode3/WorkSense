"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Plus,
  RotateCcw,
  ShieldCheck,
  Users,
} from "lucide-react";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/feedback/empty-state";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/context/auth-context";
import {
  addManagerTaskApi,
  completeOnboardingTaskApi,
  listOnboardingCasesApi,
  managerReviewPlanApi,
  proposeAdaptiveReplanApi,
} from "@/lib/api/onboarding";
import {
  OnboardingCase,
  OnboardingPhase,
  OnboardingPlanTask,
  TaskCategory,
} from "@/types/onboarding";

export default function ManagerOnboardingPage() {
  const { user } = useAuth();
  const [cases, setCases] = useState<OnboardingCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCase, setSelectedCase] = useState<OnboardingCase | null>(null);

  // Manager Custom Task Modal
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const taskCategory: TaskCategory = "team_integration";
  const [taskPhase, setTaskPhase] = useState<OnboardingPhase>("week_1");
  const [taskDayOffset, setTaskDayOffset] = useState(3);
  const taskReasoning = "Manager assigned 1:1 onboarding milestone";
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Manager Review Gate Modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewDecision, setReviewDecision] = useState<"approve" | "changes_requested">("approve");
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Adaptive Replan Modal
  const [showReplanModal, setShowReplanModal] = useState(false);
  const [replanTargetTask, setReplanTargetTask] = useState<OnboardingPlanTask | null>(null);
  const [replanExplanation, setReplanExplanation] = useState("");
  const [replanDayShift, setReplanDayShift] = useState(3);
  const [isReplanning, setIsReplanning] = useState(false);

  const loadCases = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await listOnboardingCasesApi();
      setCases(data.cases);
      setSelectedCase((previous) => {
        if (!data.cases.length) return null;
        return data.cases.find((c) => c.id === previous?.id) ?? data.cases[0];
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load team onboarding journeys");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const q = searchQuery.toLowerCase();
      return (
        q === "" ||
        c.candidate_name.toLowerCase().includes(q) ||
        c.role_title.toLowerCase().includes(q) ||
        c.employee_code.toLowerCase().includes(q)
      );
    });
  }, [cases, searchQuery]);

  async function handleCreateManagerTask(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCase?.current_plan_id) return;
    try {
      setIsAddingTask(true);
      await addManagerTaskApi(selectedCase.current_plan_id, {
        title: taskTitle,
        description: taskDesc,
        category: taskCategory,
        phase: taskPhase,
        scheduled_day_offset: Number(taskDayOffset),
        reasoning: taskReasoning,
      });
      setShowAddTaskModal(false);
      setTaskTitle("");
      setTaskDesc("");
      await loadCases();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add manager task");
    } finally {
      setIsAddingTask(false);
    }
  }

  async function handleManagerReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCase?.current_plan_id) return;
    try {
      setIsSubmittingReview(true);
      await managerReviewPlanApi(selectedCase.current_plan_id, {
        decision: reviewDecision,
        notes: reviewNotes || undefined,
      });
      setShowReviewModal(false);
      await loadCases();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit manager review");
    } finally {
      setIsSubmittingReview(false);
    }
  }

  async function handleAdaptiveReplanSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCase) return;
    try {
      setIsReplanning(true);
      await proposeAdaptiveReplanApi(selectedCase.id, {
        trigger: "task_blocked",
        trigger_task_id: replanTargetTask?.id,
        explanation: replanExplanation,
        suggested_day_shift: Number(replanDayShift),
      });
      setShowReplanModal(false);
      setReplanExplanation("");
      setReplanTargetTask(null);
      await loadCases();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to trigger adaptive replan");
    } finally {
      setIsReplanning(false);
    }
  }

  async function handleManagerApproveTask(task: OnboardingPlanTask) {
    try {
      await completeOnboardingTaskApi(task.id, {
        notes: `Verified and signed off by Manager (${user?.full_name || "Manager"})`,
      });
      await loadCases();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve task completion");
    }
  }

  return (
    <ProtectedRoute allowedRoles={["manager", "leadership", "administrator"]}>
      <div className="space-y-6">
        <PageHeader
          title="Manager Onboarding & Review Workspace"
          description="Review joiner plans, inject custom 1:1 milestones, approve review gates, and resolve blockers with adaptive replanning."
        />

        {error && (
          <InlineAlert
            variant="danger"
            title="Manager Operation Notice"
            onClose={() => setError(null)}
          >
            {error}
          </InlineAlert>
        )}

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <Spinner className="h-6 w-6 text-brand-primary" />
            <p className="text-xs text-content-muted">Loading team onboarding journeys...</p>
          </div>
        ) : error && cases.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
            <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 rounded-full">
              <AlertCircle className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-content-primary">Failed to load team journeys</h3>
              <p className="text-xs text-content-secondary max-w-sm">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => loadCases()}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              <span>Retry</span>
            </Button>
          </div>
        ) : cases.length === 0 ? (
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="No Direct Report Journeys"
            description="No onboarding journeys are currently assigned to your team. New hires will appear here once converted."
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Team Joiner List */}
            <div className="lg:col-span-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-display uppercase tracking-wider text-content-muted">
                  Assigned Team Joiners ({cases.length})
                </span>
              </div>

              <SearchInput
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search joiners..."
              />

              <div className="space-y-2">
                {filteredCases.map((c) => {
                  const isSelected = selectedCase?.id === c.id;
                  const isBlocked = c.status === "blocked" || c.blocked_tasks_count > 0;

                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCase(c)}
                      className={`w-full text-left p-3.5 rounded-lg border transition-all ${
                        isSelected
                          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent"
                          : isBlocked
                          ? "bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-content-primary hover:border-red-300"
                          : "bg-surface border-boundary-subtle hover:border-slate-300 text-content-primary"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{c.candidate_name}</span>
                        <span className="font-mono text-[10px] opacity-80">{c.employee_code}</span>
                      </div>
                      <p className={`text-[11px] mt-0.5 ${isSelected ? "text-slate-300 dark:text-slate-700" : "text-content-secondary"}`}>
                        {c.role_title}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-boundary-subtle/40 text-[10px]">
                        <span>Progress: {c.progress_percent}%</span>
                        {isBlocked ? (
                          <span className="text-red-500 font-bold flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Blocked
                          </span>
                        ) : (
                          <span className="capitalize">{c.status.replace("_", " ")}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Selected Joiner Workspace */}
            {selectedCase && selectedCase.active_plan ? (
              <div className="lg:col-span-8 space-y-4">
                {/* Joiner Detail Header */}
                <Card className="p-5 border-boundary-subtle bg-surface space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold font-display text-content-primary">
                          {selectedCase.candidate_name}
                        </h2>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-secondary border border-boundary-subtle text-content-secondary">
                          {selectedCase.employee_code}
                        </span>
                        <Badge variant="outline" className="font-mono text-[11px]">
                          Plan v{selectedCase.active_plan.version_number}
                        </Badge>
                      </div>
                      <p className="text-xs text-content-secondary mt-0.5">
                        {selectedCase.role_title} • {selectedCase.department_name} • Start Date:{" "}
                        <span className="font-mono font-medium">{selectedCase.hire_date}</span>
                      </p>
                    </div>

                    {/* Manager Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddTaskModal(true)}
                        className="gap-1.5 h-8 text-xs"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Team Task</span>
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => setShowReviewModal(true)}
                        className="gap-1.5 h-8 text-xs bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Manager Review</span>
                      </Button>
                    </div>
                  </div>

                  {/* Manager Review Status Ribbon */}
                  <div className="p-3 bg-surface-secondary rounded border border-boundary-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="text-content-muted">Manager Review Gate: </span>
                      <strong className="text-content-primary uppercase">
                        {selectedCase.active_plan.manager_review_status}
                      </strong>
                      {selectedCase.active_plan.manager_notes && (
                        <span className="text-content-secondary block text-[11px] mt-0.5">
                          Notes: {selectedCase.active_plan.manager_notes}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-content-muted">HR Baseline Approval: </span>
                      <strong className="text-content-primary uppercase">
                        {selectedCase.active_plan.hr_review_status}
                      </strong>
                    </div>
                  </div>
                </Card>

                {/* Manager Tasks to Act Upon */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold font-display uppercase tracking-wider text-content-muted">
                      Milestones & Tasks for {selectedCase.candidate_name}
                    </h3>
                    <Link
                      href={`/hr/onboarding/${selectedCase.id}`}
                      className="text-xs text-brand-primary hover:underline flex items-center gap-1"
                    >
                      <span>Full Journey Audit View</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>

                  <div className="space-y-2.5">
                    {selectedCase.active_plan.tasks.map((task) => {
                      const isBlocked = task.status === "blocked";
                      const isCompleted = task.status === "completed";
                      const isManagerApprovalReq =
                        task.verification_type === "manager_approval" && task.status !== "completed";

                      return (
                        <Card
                          key={task.id}
                          className={`p-4 border transition-colors ${
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
                                <span className="font-bold text-xs text-content-primary">
                                  {task.title}
                                </span>
                                <Badge
                                  variant={task.is_mandatory ? "default" : "outline"}
                                  className="text-[10px]"
                                >
                                  {task.is_mandatory ? "Mandatory Policy" : "Recommended"}
                                </Badge>
                                <span className="text-[10px] font-mono text-content-muted">
                                  Phase: {task.phase}
                                </span>
                              </div>

                              <p className="text-xs text-content-secondary leading-relaxed">
                                {task.description}
                              </p>

                              {/* Blocker Alert & Adaptive Replan Trigger */}
                              {isBlocked && (
                                <div className="p-2.5 bg-red-50 dark:bg-red-950/40 rounded border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-xs space-y-2 mt-1">
                                  <div className="flex items-center gap-1.5 font-semibold">
                                    <AlertCircle className="h-4 w-4 text-red-600" />
                                    <span>Milestone Blocked: {task.blocker_reason}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] text-content-muted">
                                      Reported: {task.blocker_reported_at?.slice(0, 16)}
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="danger"
                                      className="h-7 text-xs gap-1.5"
                                      onClick={() => {
                                        setReplanTargetTask(task);
                                        setReplanExplanation(
                                          `Resolving blocker on '${task.title}': courier or provisioning timeline adjustment.`
                                        );
                                        setShowReplanModal(true);
                                      }}
                                    >
                                      <RotateCcw className="h-3 w-3" />
                                      <span>Trigger Adaptive Replan</span>
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Actions & Verification */}
                            <div className="flex flex-col sm:items-end gap-1.5 min-w-[150px] text-xs">
                              <span className="font-mono text-[11px] text-content-muted">
                                Due: {task.due_date}
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
                                {task.status.toUpperCase()}
                              </Badge>

                              {isManagerApprovalReq && !isBlocked && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs gap-1 border-emerald-500 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 mt-1"
                                  onClick={() => handleManagerApproveTask(task)}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span>Sign Off Task</span>
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Add Manager Task Modal */}
        {showAddTaskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-boundary-subtle max-w-md w-full p-6 space-y-4 shadow-none">
              <div className="flex items-center justify-between border-b border-boundary-subtle pb-3">
                <div className="flex items-center gap-2 text-brand-primary font-bold">
                  <Plus className="h-4 w-4" />
                  <h3 className="text-base font-display">Add Custom Team Milestone</h3>
                </div>
                <button onClick={() => setShowAddTaskModal(false)} className="text-content-muted hover:text-content-primary">
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateManagerTask} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-content-secondary">Task Title</label>
                  <Input
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="e.g. 1:1 Architecture & Technical Roadmap Sync"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-content-secondary">Description</label>
                  <textarea
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    placeholder="Provide clear expectations and deliverables for the new hire..."
                    className="w-full p-2 rounded bg-surface border border-boundary-subtle text-content-primary text-xs h-20 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-content-secondary">Phase</label>
                    <select
                      value={taskPhase}
                      onChange={(e) => setTaskPhase(e.target.value as OnboardingPhase)}
                      className="w-full p-2 rounded bg-surface border border-boundary-subtle text-content-primary text-xs"
                    >
                      <option value="day_1">Day 1</option>
                      <option value="week_1">Week 1</option>
                      <option value="day_30">Day 30</option>
                      <option value="day_60">Day 60</option>
                      <option value="day_90">Day 90</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-content-secondary">Day Offset (+days from hire)</label>
                    <Input
                      type="number"
                      value={taskDayOffset}
                      onChange={(e) => setTaskDayOffset(Number(e.target.value))}
                      min={0}
                      max={90}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-boundary-subtle">
                  <Button variant="outline" size="sm" type="button" onClick={() => setShowAddTaskModal(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" type="submit" disabled={isAddingTask}>
                    {isAddingTask ? <Spinner className="h-3.5 w-3.5" /> : <span>Inject Task</span>}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Manager Review Gate Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-boundary-subtle max-w-md w-full p-6 space-y-4 shadow-none">
              <div className="flex items-center justify-between border-b border-boundary-subtle pb-3">
                <div className="flex items-center gap-2 text-brand-primary font-bold">
                  <ShieldCheck className="h-4 w-4" />
                  <h3 className="text-base font-display">Manager Review Gate</h3>
                </div>
                <button onClick={() => setShowReviewModal(false)} className="text-content-muted hover:text-content-primary">
                  ✕
                </button>
              </div>

              <form onSubmit={handleManagerReviewSubmit} className="space-y-4 text-xs">
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
                  <label className="font-semibold text-content-secondary">Manager Notes / Guidance</label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Enter explicit review feedback or team expectations..."
                    className="w-full p-2.5 rounded bg-surface border border-boundary-subtle text-content-primary text-xs h-24 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    required={reviewDecision === "changes_requested"}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-boundary-subtle">
                  <Button variant="outline" size="sm" type="button" onClick={() => setShowReviewModal(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" type="submit" disabled={isSubmittingReview}>
                    {isSubmittingReview ? <Spinner className="h-3.5 w-3.5" /> : <span>Submit Manager Decision</span>}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Adaptive Replan Modal */}
        {showReplanModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-boundary-subtle max-w-md w-full p-6 space-y-4 shadow-none">
              <div className="flex items-center justify-between border-b border-boundary-subtle pb-3">
                <div className="flex items-center gap-2 text-red-600 font-bold">
                  <RotateCcw className="h-4 w-4" />
                  <h3 className="text-base font-display">Controlled Adaptive Replanning</h3>
                </div>
                <button onClick={() => setShowReplanModal(false)} className="text-content-muted hover:text-content-primary">
                  ✕
                </button>
              </div>

              <form onSubmit={handleAdaptiveReplanSubmit} className="space-y-4 text-xs">
                <p className="text-content-secondary leading-relaxed">
                  Recalibrate schedule for <strong>{selectedCase?.candidate_name}</strong>. Downstream dependencies will shift automatically while preserving 100% of mandatory enterprise policies.
                </p>

                {replanTargetTask && (
                  <div className="p-2.5 bg-surface-secondary rounded border border-boundary-subtle font-mono text-[11px] space-y-0.5">
                    <div>Trigger Task: {replanTargetTask.title}</div>
                    <div>Blocker Reason: {replanTargetTask.blocker_reason}</div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="font-semibold text-content-secondary">Shift Calendar Due Dates By</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[3, 5, 7].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setReplanDayShift(days)}
                        className={`p-2 rounded border text-xs font-semibold ${
                          replanDayShift === days
                            ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                            : "border-boundary-subtle hover:bg-surface-secondary text-content-secondary"
                        }`}
                      >
                        +{days} Days
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-content-secondary">Adaptation Explanation (Mandatory)</label>
                  <textarea
                    value={replanExplanation}
                    onChange={(e) => setReplanExplanation(e.target.value)}
                    placeholder="Explain the disruption context and mitigation rationale..."
                    className="w-full p-2.5 rounded bg-surface border border-boundary-subtle text-content-primary text-xs h-20 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-boundary-subtle">
                  <Button variant="outline" size="sm" type="button" onClick={() => setShowReplanModal(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" type="submit" disabled={isReplanning} className="gap-1.5">
                    {isReplanning ? <Spinner className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}
                    <span>Generate Plan v{(selectedCase?.active_plan?.version_number || 1) + 1}</span>
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
