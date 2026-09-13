"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Flame,
  RefreshCw,
  ShieldAlert,
  UserPlus,
  Users,
} from "lucide-react";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { Spinner } from "@/components/ui/spinner";
import { getDashboardSummaryApi } from "@/lib/api/dashboard";
import { DashboardSummaryResponse } from "@/types/dashboard";

export default function HRDecisionDashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getDashboardSummaryApi();
      setDashboardData(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load dashboard metrics.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <ProtectedRoute allowedRoles={["hr", "manager", "leadership", "administrator"]}>
      <div className="w-full max-w-full overflow-x-clip space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                Workforce Decision Dashboard
              </h1>
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 text-xs">
                Live Enterprise Signals
              </Badge>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Consolidated workforce intelligence from recruitment, attendance, onboarding, and skills ledgers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadDashboard}
              disabled={isLoading}
              className="text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh Metrics
            </Button>
            <Link href="/recommendations">
              <Button variant="primary" size="sm" className="text-xs flex items-center gap-1.5">
                <ArrowRight className="w-3.5 h-3.5" />
                Action Queue ({dashboardData?.active_recommendations_count ?? 0})
              </Button>
            </Link>
          </div>
        </div>

        {error && <InlineAlert variant="danger" title="Dashboard Error">{error}</InlineAlert>}

        {isLoading ? (
          <Card className="p-12 text-center border-neutral-200 dark:border-neutral-800">
            <Spinner className="mx-auto mb-3" />
            <p className="text-xs text-neutral-500">Aggregating live organizational signals across 5 modules...</p>
          </Card>
        ) : dashboardData ? (
          <div className="space-y-6">
            {/* Top KPI Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Funnel KPI */}
              <Card className="p-4 border-neutral-200 dark:border-neutral-800 space-y-1">
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>Recruitment Active</span>
                  <Users className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  {dashboardData.recruitment_funnel.applications_total}
                </div>
                <div className="text-[11px] text-neutral-400 flex items-center justify-between">
                  <span>Avg Match: {dashboardData.recruitment_funnel.average_candidate_score}%</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    {dashboardData.recruitment_funnel.offered_total} Offered
                  </span>
                </div>
              </Card>

              {/* Attendance KPI */}
              <Card className="p-4 border-neutral-200 dark:border-neutral-800 space-y-1">
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>Attendance Adherence</span>
                  <Activity className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {dashboardData.attendance.average_attendance_rate_pct}%
                </div>
                <div className="text-[11px] text-neutral-400 flex items-center justify-between">
                  <span>{dashboardData.attendance.total_onsite_days} Onsite / {dashboardData.attendance.total_remote_days} Remote</span>
                  <span>{dashboardData.attendance.period_label}</span>
                </div>
              </Card>

              {/* Onboarding KPI */}
              <Card className="p-4 border-neutral-200 dark:border-neutral-800 space-y-1">
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>Active Onboarding</span>
                  <UserPlus className="w-4 h-4 text-purple-500" />
                </div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {dashboardData.onboarding.active_cases_count}
                </div>
                <div className="text-[11px] text-neutral-400 flex items-center justify-between">
                  <span>Progress Avg: {dashboardData.onboarding.average_progress_pct}%</span>
                  <span className="text-blue-600 dark:text-blue-400">
                    {dashboardData.onboarding.ready_for_enterpro_count} EnterPro Ready
                  </span>
                </div>
              </Card>

              {/* Attrition Risk KPI */}
              <Card className="p-4 border-neutral-200 dark:border-neutral-800 space-y-1">
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>Priority Retention Flags</span>
                  <Flame className="w-4 h-4 text-rose-500" />
                </div>
                <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                  {dashboardData.attrition_overview.priority_review_count}
                </div>
                <div className="text-[11px] text-neutral-400 flex items-center justify-between">
                  <span>{dashboardData.attrition_overview.total_evaluated} Evaluated</span>
                  <span className="text-rose-500 font-medium">Actionable</span>
                </div>
              </Card>
            </div>

            {/* Operational Alerts Banner */}
            {dashboardData.priority_alerts.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-neutral-500" />
                    Priority Operational Alerts ({dashboardData.priority_alerts.length})
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {dashboardData.priority_alerts.map((alert) => (
                    <Card
                      key={alert.id}
                      className={`p-3.5 border text-xs space-y-2 ${
                        alert.severity === "critical"
                          ? "border-rose-200 bg-rose-50/50 dark:border-rose-800/40 dark:bg-rose-950/20"
                          : alert.severity === "warning"
                          ? "border-amber-200 bg-amber-50/50 dark:border-amber-800/40 dark:bg-amber-950/20"
                          : "border-blue-200 bg-blue-50/50 dark:border-blue-800/40 dark:bg-blue-950/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-neutral-900 dark:text-neutral-100 line-clamp-1">
                          {alert.title}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[9px] uppercase font-bold ${
                            alert.severity === "critical"
                              ? "text-rose-700 border-rose-300 dark:text-rose-300"
                              : alert.severity === "warning"
                              ? "text-amber-700 border-amber-300 dark:text-amber-300"
                              : "text-blue-700 border-blue-300 dark:text-blue-300"
                          }`}
                        >
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-neutral-600 dark:text-neutral-400 text-[11px] leading-relaxed">
                        {alert.evidence_snippet}
                      </p>
                      <div className="pt-1 flex items-center justify-between border-t border-neutral-200/40 dark:border-neutral-700/40">
                        <span className="text-[10px] text-neutral-500">{alert.recommended_action}</span>
                        <Link href={alert.target_route}>
                          <Button variant="outline" size="sm" className="text-[10px] h-6 px-2 bg-white dark:bg-neutral-800">
                            Resolve
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Middle Row: Real Data-Driven Recruitment Funnel & Onboarding Velocity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recruitment Funnel */}
              <Card className="p-5 border-neutral-200 dark:border-neutral-800 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                      Recruitment Velocity Funnel
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      Progression calculated dynamically from verified talent database
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                    Avg Match: {dashboardData.recruitment_funnel.average_candidate_score}%
                  </Badge>
                </div>

                {(() => {
                  const totalApps = Math.max(1, dashboardData.recruitment_funnel.applications_total);
                  const stages = [
                    {
                      label: "1. Total Applications",
                      val: dashboardData.recruitment_funnel.applications_total,
                      pct: Math.min(100, Math.round((dashboardData.recruitment_funnel.applications_total / totalApps) * 100)),
                      conversion: "Baseline (100%)",
                      color: "bg-neutral-300 dark:bg-neutral-600",
                    },
                    {
                      label: "2. Intake Processing",
                      val: dashboardData.recruitment_funnel.processing_total,
                      pct: Math.min(100, Math.round((dashboardData.recruitment_funnel.processing_total / totalApps) * 100)),
                      conversion: `${Math.round((dashboardData.recruitment_funnel.processing_total / totalApps) * 100)}% of total`,
                      color: "bg-blue-300 dark:bg-blue-800",
                    },
                    {
                      label: "3. Shortlisted",
                      val: dashboardData.recruitment_funnel.shortlisted_total,
                      pct: Math.min(100, Math.round((dashboardData.recruitment_funnel.shortlisted_total / totalApps) * 100)),
                      conversion: `${dashboardData.recruitment_funnel.processing_total > 0 ? Math.round((dashboardData.recruitment_funnel.shortlisted_total / dashboardData.recruitment_funnel.processing_total) * 100) : 0}% pass intake`,
                      color: "bg-blue-500 dark:bg-blue-600",
                    },
                    {
                      label: "4. Interviewing",
                      val: dashboardData.recruitment_funnel.interviewed_total,
                      pct: Math.min(100, Math.round((dashboardData.recruitment_funnel.interviewed_total / totalApps) * 100)),
                      conversion: `${dashboardData.recruitment_funnel.shortlisted_total > 0 ? Math.round((dashboardData.recruitment_funnel.interviewed_total / dashboardData.recruitment_funnel.shortlisted_total) * 100) : 0}% interview rate`,
                      color: "bg-purple-400 dark:bg-purple-700",
                    },
                    {
                      label: "5. Offered",
                      val: dashboardData.recruitment_funnel.offered_total,
                      pct: Math.min(100, Math.round((dashboardData.recruitment_funnel.offered_total / totalApps) * 100)),
                      conversion: `${dashboardData.recruitment_funnel.interviewed_total > 0 ? Math.round((dashboardData.recruitment_funnel.offered_total / dashboardData.recruitment_funnel.interviewed_total) * 100) : 0}% offer rate`,
                      color: "bg-purple-600 dark:bg-purple-500",
                    },
                    {
                      label: "6. Hired & Converted",
                      val: dashboardData.recruitment_funnel.converted_total,
                      pct: Math.min(100, Math.round((dashboardData.recruitment_funnel.converted_total / totalApps) * 100)),
                      conversion: `${dashboardData.recruitment_funnel.offered_total > 0 ? Math.round((dashboardData.recruitment_funnel.converted_total / dashboardData.recruitment_funnel.offered_total) * 100) : 0}% acceptance`,
                      color: "bg-emerald-500 dark:bg-emerald-600",
                    },
                  ];

                  return (
                    <div className="space-y-3 text-xs">
                      {stages.map((st, idx) => (
                        <Link
                          key={idx}
                          href="/workforce/candidates"
                          className="block p-1.5 rounded hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors group"
                        >
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-semibold text-neutral-800 dark:text-neutral-200 group-hover:text-brand-primary">
                              {st.label}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-neutral-400 text-[10px] font-mono">{st.conversion}</span>
                              <span className="font-bold text-neutral-900 dark:text-neutral-100">{st.val}</span>
                            </div>
                          </div>
                          <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${st.color} transition-all duration-500`}
                              style={{ width: `${Math.max(4, st.pct)}%` }}
                            />
                          </div>
                        </Link>
                      ))}
                    </div>
                  );
                })()}

                <div className="pt-2 flex justify-between items-center text-[10px] text-neutral-400 border-t border-neutral-100 dark:border-neutral-800">
                  <span>Click any stage to filter candidates</span>
                  <Link href="/workforce/candidates" className="text-brand-primary hover:underline font-medium">
                    Talent Decision Pool →
                  </Link>
                </div>
              </Card>

              {/* Onboarding Health */}
              <Card className="p-5 border-neutral-200 dark:border-neutral-800 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                      Adaptive Onboarding Velocity
                    </h3>
                    <p className="text-[11px] text-neutral-500">Dual-approval and automated execution tracking</p>
                  </div>
                  <Link href="/hr/onboarding">
                    <Button variant="outline" size="sm" className="text-[10px] h-6 px-2">
                      Manage Hub
                    </Button>
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded border border-neutral-100 dark:border-neutral-800 space-y-1">
                    <span className="text-neutral-400 text-[11px]">Active Journeys</span>
                    <div className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                      {dashboardData.onboarding.active_cases_count}
                    </div>
                    <span className="text-[10px] text-neutral-500">Joiners currently in progress</span>
                  </div>

                  <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded border border-neutral-100 dark:border-neutral-800 space-y-1">
                    <span className="text-neutral-400 text-[11px]">Average Completion</span>
                    <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      {dashboardData.onboarding.average_progress_pct}%
                    </div>
                    <span className="text-[10px] text-neutral-500">Across active milestones</span>
                  </div>

                  <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded border border-neutral-100 dark:border-neutral-800 space-y-1">
                    <span className="text-neutral-400 text-[11px]">Blocked Tasks</span>
                    <div className="text-xl font-bold text-rose-600 dark:text-rose-400">
                      {dashboardData.onboarding.blocked_cases_count}
                    </div>
                    <span className="text-[10px] text-neutral-500">Hardware & account provisioning</span>
                  </div>

                  <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded border border-neutral-100 dark:border-neutral-800 space-y-1">
                    <span className="text-neutral-400 text-[11px]">EnterPro Ready</span>
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {dashboardData.onboarding.ready_for_enterpro_count}
                    </div>
                    <span className="text-[10px] text-neutral-500">Awaiting automated dispatch</span>
                  </div>
                </div>

                <div className="pt-2 space-y-1">
                  <div className="text-[11px] text-neutral-400 flex items-center justify-between">
                    <span>Overall Cohort Onboarding Pacing</span>
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                      {dashboardData.onboarding.average_progress_pct}%
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, dashboardData.onboarding.average_progress_pct)}%` }}
                    />
                  </div>
                </div>
              </Card>
            </div>

            {/* Retention & Workforce Health Section with Non-Punitive Cohort View */}
            <Card className="p-5 border-neutral-200 dark:border-neutral-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                      Retention Health & Support Distribution
                    </h3>
                    <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                      Signal Freshness: Live Telemetry
                    </Badge>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Proactive engagement signals evaluated across {dashboardData.attrition_overview.total_evaluated} employees
                  </p>
                </div>
                <Link href="/workforce/intelligence">
                  <Button variant="outline" size="sm" className="text-xs h-7 px-2.5 flex items-center gap-1.5">
                    <span>Workforce Health Hub</span>
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50/40 dark:border-rose-900/40 dark:bg-rose-950/20 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-rose-800 dark:text-rose-300">Proactive Support Needed</span>
                    <Badge variant="outline" className="text-[9px] bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-300">
                      Action Required
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                    {dashboardData.attrition_overview.priority_review_count}
                  </div>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                    Early workload/on-call fatigue signals detected with proposed interventions.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/20 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-amber-800 dark:text-amber-300">Check-in Recommended</span>
                    <Badge variant="outline" className="text-[9px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300">
                      Upcoming 1:1
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {dashboardData.attrition_overview.review_count}
                  </div>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                    Career progression or internal mobility alignment opportunities.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-800 dark:text-emerald-300">Stable & Monitored</span>
                    <Badge variant="outline" className="text-[9px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-300">
                      Healthy
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {dashboardData.attrition_overview.monitor_count}
                  </div>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                    Balanced workload, positive project velocity, and sustainable sentiment.
                  </p>
                </div>
              </div>
            </Card>

            {/* Skill Gap Heatmap */}
            <Card className="p-5 border-neutral-200 dark:border-neutral-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                    Critical Role Capability Heatmap
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Required level vs. demonstrated capability across key engineering and product functions
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Optimal
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Mild Gap
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> Critical Gap
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {dashboardData.skill_heatmap.map((cell, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-lg border space-y-2 transition-all hover:shadow-xs ${
                      cell.coverage_status === "critical_gap"
                        ? "border-rose-200 bg-rose-50/40 dark:border-rose-900/40 dark:bg-rose-950/20"
                        : cell.coverage_status === "mild_gap"
                        ? "border-amber-200 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/20"
                        : "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">{cell.skill_name}</span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] uppercase font-bold ${
                          cell.coverage_status === "critical_gap"
                            ? "text-rose-700 border-rose-300 dark:text-rose-300"
                            : cell.coverage_status === "mild_gap"
                            ? "text-amber-700 border-amber-300 dark:text-amber-300"
                            : "text-emerald-700 border-emerald-300 dark:text-emerald-300"
                        }`}
                      >
                        {cell.coverage_status.replace(/_/g, " ")}
                      </Badge>
                    </div>

                    <div className="text-[11px] text-neutral-500">
                      {cell.role_title} • {cell.department_name}
                    </div>

                    <div className="space-y-1 text-[11px] text-neutral-600 dark:text-neutral-400 pt-1 border-t border-neutral-200/40 dark:border-neutral-700/40">
                      <div className="flex justify-between">
                        <span>Required:</span>
                        <span className="font-semibold">L{cell.required_level}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Demonstrated:</span>
                        <span className="font-semibold">L{cell.average_proficiency.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Gap Delta:</span>
                        <span className={`font-semibold ${cell.gap_magnitude > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600"}`}>
                          {cell.gap_magnitude > 0 ? `-${cell.gap_magnitude.toFixed(1)}` : "None"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : null}
      </div>
    </ProtectedRoute>
  );
}
