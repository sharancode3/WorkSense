"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock,
  Plus,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/feedback/empty-state";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/context/auth-context";
import { dispatchToEnterProApi, listOnboardingCasesApi } from "@/lib/api/onboarding";
import { OnboardingCase } from "@/types/onboarding";

export default function HrOnboardingPage() {
  const { roles } = useAuth();
  const [cases, setCases] = useState<OnboardingCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // EnterPro Dispatch Modal State
  const [dispatchModalCase, setDispatchModalCase] = useState<OnboardingCase | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<any | null>(null);

  const canManage = roles.some((r) => ["hr", "administrator", "recruiter"].includes(r));

  async function loadCases() {
    try {
      setIsLoading(true);
      setError(null);
      const data = await listOnboardingCasesApi();
      setCases(data.cases);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load onboarding journeys");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCases();
  }, []);

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        q === "" ||
        c.candidate_name.toLowerCase().includes(q) ||
        c.job_title.toLowerCase().includes(q) ||
        c.employee_code.toLowerCase().includes(q) ||
        c.department_name.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "in_review" && (c.status === "in_review" || c.status === "planning")) ||
        (statusFilter === "in_progress" && c.status === "in_progress") ||
        (statusFilter === "blocked" && c.status === "blocked") ||
        (statusFilter === "completed" && c.status === "completed");

      return matchesSearch && matchesStatus;
    });
  }, [cases, searchQuery, statusFilter]);

  const metrics = useMemo(() => {
    const total = cases.length;
    const inReview = cases.filter((c) => c.status === "in_review" || c.status === "planning").length;
    const inProgress = cases.filter((c) => c.status === "in_progress").length;
    const blocked = cases.filter((c) => c.status === "blocked" || c.blocked_tasks_count > 0).length;
    const enterpro = cases.filter((c) => c.enterpro_handoff_status === "SIMULATED_ACKNOWLEDGEMENT").length;
    return { total, inReview, inProgress, blocked, enterpro };
  }, [cases]);

  async function handleDispatchEnterPro(caseId: string) {
    try {
      setIsDispatching(true);
      const res = await dispatchToEnterProApi(caseId, {
        correlation_id: `EP-DISPATCH-${caseId.slice(0, 8)}`,
        notes: "Authorized HR enterprise provisioning dispatch",
      });
      setDispatchResult(res);
      await loadCases();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to dispatch to EnterPro");
    } finally {
      setIsDispatching(false);
    }
  }

  return (
    <ProtectedRoute allowedRoles={["hr", "recruiter", "administrator"]}>
      <div className="space-y-6">
        <PageHeader
          title="Adaptive Onboarding Command Center"
          description="Adaptive onboarding management with dual human review gates and EnterPro workflow orchestration."
          actions={
            canManage ? (
              <Link href="/hr/onboarding/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Initiate Onboarding</span>
                </Button>
              </Link>
            ) : undefined
          }
        />

        {error && (
          <InlineAlert
            variant="danger"
            title="Onboarding Error"
            onClose={() => setError(null)}
          >
            {error}
          </InlineAlert>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-surface border-boundary-subtle">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
                Active Journeys
              </span>
              <Users className="h-4 w-4 text-brand-primary" />
            </div>
            <p className="text-2xl font-bold font-display text-content-primary mt-2">
              {metrics.total}
            </p>
            <p className="text-xs text-content-muted mt-1">
              {metrics.inProgress} currently in progress
            </p>
          </Card>

          <Card className="p-4 bg-surface border-boundary-subtle">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
                Pending Review
              </span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold font-display text-content-primary mt-2">
              {metrics.inReview}
            </p>
            <p className="text-xs text-content-muted mt-1">Awaiting HR / Manager sign-off</p>
          </Card>

          <Card className="p-4 bg-surface border-boundary-subtle">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
                Blocked Milestones
              </span>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
            <p className="text-2xl font-bold font-display text-content-primary mt-2">
              {metrics.blocked}
            </p>
            <p className="text-xs text-content-muted mt-1">Requiring adaptive replanning</p>
          </Card>

          <Card className="p-4 bg-surface border-boundary-subtle">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
                EnterPro Dispatched
              </span>
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold font-display text-content-primary mt-2">
              {metrics.enterpro}
            </p>
            <p className="text-xs text-content-muted mt-1">Simulated workflow handoffs</p>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface p-3 rounded-lg border border-boundary-subtle">
          <div className="w-full sm:w-80">
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search new hire, role, or code..."
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {[
              { id: "all", label: "All Cases" },
              { id: "in_review", label: "In Review" },
              { id: "in_progress", label: "In Progress" },
              { id: "blocked", label: "Blocked" },
              { id: "completed", label: "Completed" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  statusFilter === tab.id
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "text-content-secondary hover:text-content-primary hover:bg-surface-secondary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <Spinner className="h-6 w-6 text-brand-primary" />
            <p className="text-xs text-content-muted">Loading adaptive onboarding journeys...</p>
          </div>
        ) : filteredCases.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="h-6 w-6" />}
            title="No Onboarding Journeys Found"
            description={
              searchQuery
                ? "No new hires match your search criteria."
                : "No active onboarding cases have been created yet. Start by converting an offered candidate."
            }
            action={
              canManage ? (
                <Link href="/hr/onboarding/new">
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    <span>Initiate First Onboarding</span>
                  </Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-4">
            {filteredCases.map((c) => {
              const activePlan = c.active_plan;
              const isBlocked = c.status === "blocked" || c.blocked_tasks_count > 0;

              return (
                <Card
                  key={c.id}
                  className={`p-5 transition-colors border ${
                    isBlocked
                      ? "border-red-300 dark:border-red-900/50 bg-red-50/10"
                      : "border-boundary-subtle hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Candidate / Employee Info */}
                    <div className="space-y-1.5 min-w-[280px]">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold font-display text-content-primary">
                          {c.candidate_name}
                        </h3>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-secondary text-content-secondary border border-boundary-subtle">
                          {c.employee_code}
                        </span>
                        {activePlan && (
                          <Badge variant="outline" className="text-[11px] font-mono">
                            Plan v{activePlan.version_number}
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-content-secondary">
                        <span className="font-semibold text-content-primary">{c.role_title}</span> •{" "}
                        {c.department_name} • {c.work_location}
                      </p>

                      <p className="text-xs text-content-muted">
                        Manager:{" "}
                        <span className="text-content-secondary font-medium">
                          {c.manager_name || "Unassigned"}
                        </span>{" "}
                        | Start Date: <span className="font-mono">{c.hire_date}</span>
                      </p>
                    </div>

                    {/* Progress Bar & Status */}
                    <div className="flex-1 max-w-xs space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-content-secondary font-medium">Progress</span>
                        <span className="font-mono font-semibold text-content-primary">
                          {c.progress_percent}% ({c.completed_tasks_count}/{c.total_tasks_count} tasks)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-boundary-subtle">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isBlocked
                              ? "bg-red-500"
                              : c.progress_percent === 100
                              ? "bg-emerald-600"
                              : "bg-brand-primary"
                          }`}
                          style={{ width: `${c.progress_percent}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-0.5 text-[11px]">
                        {isBlocked ? (
                          <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                            <AlertCircle className="h-3 w-3" />
                            {c.blocked_tasks_count} Milestone Blocked
                          </span>
                        ) : c.status === "in_review" ? (
                          <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                            <Clock className="h-3 w-3" />
                            Awaiting Approvals
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                            <CheckCircle2 className="h-3 w-3" />
                            Active Onboarding Track
                          </span>
                        )}

                        {c.enterpro_handoff_status === "SIMULATED_ACKNOWLEDGEMENT" && (
                          <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-mono text-[10px] ml-auto">
                            <ShieldCheck className="h-3 w-3" />
                            EnterPro Dispatched
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {c.enterpro_handoff_status !== "SIMULATED_ACKNOWLEDGEMENT" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1.5"
                          onClick={() => {
                            setDispatchModalCase(c);
                            setDispatchResult(null);
                          }}
                        >
                          <Send className="h-3.5 w-3.5 text-content-secondary" />
                          <span>EnterPro Dispatch</span>
                        </Button>
                      )}

                      <Link href={`/hr/onboarding/${c.id}`}>
                        <Button size="sm" className="h-8 text-xs gap-1.5">
                          <span>View Journey & Review</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* EnterPro Dispatch Modal */}
        {dispatchModalCase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-boundary-subtle max-w-lg w-full p-6 space-y-4 shadow-none">
              <div className="flex items-center justify-between border-b border-boundary-subtle pb-3">
                <div className="flex items-center gap-2 text-brand-primary font-bold">
                  <Send className="h-4 w-4" />
                  <h3 className="text-base font-display">EnterPro Workflow Handoff</h3>
                </div>
                <button
                  onClick={() => {
                    setDispatchModalCase(null);
                    setDispatchResult(null);
                  }}
                  className="text-content-muted hover:text-content-primary text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs text-content-secondary leading-relaxed">
                <p>
                  Dispatch onboarding workflow tasks for{" "}
                  <strong className="text-content-primary">{dispatchModalCase.candidate_name}</strong> (
                  {dispatchModalCase.employee_code}) to the EnterPro enterprise orchestration bus.
                </p>

                <div className="p-3 bg-surface-secondary rounded border border-boundary-subtle font-mono text-[11px] space-y-1">
                  <div>Correlation ID: EP-ONB-{dispatchModalCase.id.slice(0, 8)}</div>
                  <div>Role: {dispatchModalCase.role_title}</div>
                  <div>Tasks to Sync: {dispatchModalCase.total_tasks_count}</div>
                  <div>Transport: Idempotent Demonstration Adapter</div>
                </div>

                {dispatchResult && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded text-emerald-900 dark:text-emerald-300 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-xs">
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDispatchModalCase(null);
                    setDispatchResult(null);
                  }}
                >
                  Close
                </Button>
                {!dispatchResult && (
                  <Button
                    size="sm"
                    disabled={isDispatching}
                    onClick={() => handleDispatchEnterPro(dispatchModalCase.id)}
                    className="gap-1.5"
                  >
                    {isDispatching ? <Spinner className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
                    <span>Confirm Dispatch</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
