"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { InlineAlert } from "@/components/feedback/inline-alert";
import {
  getAttritionOverviewApi,
  getEmployeeAttritionRiskApi,
  getPerformanceInsightsApi,
  listInternalMobilityMatchesApi,
} from "@/lib/api/intelligence";
import {
  AttritionAggregateOverview,
  AttritionRiskAssessment,
  InternalMobilityMatch,
  PerformanceInsight,
} from "@/types/intelligence";

export default function WorkforceIntelligencePage() {
  const [activeSection, setActiveSection] = useState<"attrition" | "performance" | "mobility">("attrition");

  // Attrition state
  const [attritionOverview, setAttritionOverview] = useState<AttritionAggregateOverview | null>(null);
  const [employeeRisk, setEmployeeRisk] = useState<AttritionRiskAssessment | null>(null);
  const [isLoadingAttrition, setIsLoadingAttrition] = useState(true);
  const [attritionError, setAttritionError] = useState<string | null>(null);

  // Performance state
  const [performanceInsight, setPerformanceInsight] = useState<PerformanceInsight | null>(null);
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(false);
  const [performanceError, setPerformanceError] = useState<string | null>(null);

  // Mobility state
  const [mobilityMatches, setMobilityMatches] = useState<InternalMobilityMatch[]>([]);
  const [isLoadingMobility, setIsLoadingMobility] = useState(false);
  const [mobilityError, setMobilityError] = useState<string | null>(null);

  // Selected persona ID (Marcus Chen for Golden Demo)
  const marcusChenId = "69000000-0000-0000-0000-000000000002";

  const loadAttritionData = useCallback(async () => {
    setIsLoadingAttrition(true);
    setAttritionError(null);
    try {
      const [overview, emp] = await Promise.all([
        getAttritionOverviewApi(),
        getEmployeeAttritionRiskApi(marcusChenId),
      ]);
      setAttritionOverview(overview);
      setEmployeeRisk(emp);
    } catch (err) {
      console.error("Failed to load attrition data", err);
      setAttritionError(err instanceof Error ? err.message : "Failed to load attrition signals.");
    } finally {
      setIsLoadingAttrition(false);
    }
  }, [marcusChenId]);

  const loadPerformanceData = useCallback(async () => {
    setIsLoadingPerformance(true);
    setPerformanceError(null);
    try {
      const insight = await getPerformanceInsightsApi(marcusChenId);
      setPerformanceInsight(insight);
    } catch (err) {
      console.error("Failed to load performance data", err);
      setPerformanceError(err instanceof Error ? err.message : "Failed to load performance insights.");
    } finally {
      setIsLoadingPerformance(false);
    }
  }, [marcusChenId]);

  const loadMobilityData = useCallback(async () => {
    setIsLoadingMobility(true);
    setMobilityError(null);
    try {
      const matches = await listInternalMobilityMatchesApi();
      setMobilityMatches(Array.isArray(matches) ? matches : []);
    } catch (err) {
      console.error("Failed to load mobility matches", err);
      setMobilityError(err instanceof Error ? err.message : "Failed to evaluate internal mobility matches.");
    } finally {
      setIsLoadingMobility(false);
    }
  }, []);

  useEffect(() => {
    loadAttritionData();
    loadPerformanceData();
    loadMobilityData();
  }, [loadAttritionData, loadPerformanceData, loadMobilityData]);

  // Defensive array extractions
  const riskFactors = employeeRisk?.risk_factors ?? employeeRisk?.contributing_factors ?? [];
  const interventions = employeeRisk?.supportive_interventions ?? employeeRisk?.recommended_interventions ?? [];
  const riskBand = employeeRisk?.risk_band || "review";
  const diagnosisExplanation = employeeRisk?.explanation || employeeRisk?.qwen_explanation || "Evidence-backed retention analysis.";

  const demonstratedStrengths = performanceInsight?.demonstrated_strengths ?? [];
  const discussionPrompts = performanceInsight?.manager_discussion_prompts ?? [];
  const developmentNeeds = performanceInsight?.skill_development_needs ?? [];

  return (
    <ProtectedRoute allowedRoles={["hr", "manager", "leadership", "administrator"]}>
      <div className="space-y-6 pb-12">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                Retention & Mobility Intelligence
              </h1>
              <Badge variant="outline" className="border-blue-500/40 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 text-xs">
                Transparent Evidence Signals
              </Badge>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Ethical workforce retention indicators, evidence-backed performance syntheses, and capability-adjacent mobility matching.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/recommendations">
              <Button variant="primary" size="sm" className="text-xs flex items-center gap-1.5">
                <ArrowRight className="w-3.5 h-3.5" />
                Review Action Queue
              </Button>
            </Link>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveSection("attrition")}
            className={`pb-2.5 flex items-center gap-2 border-b-2 transition-colors ${
              activeSection === "attrition"
                ? "border-brand-primary text-brand-primary font-bold"
                : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Supportive Retention Signals
          </button>
          <button
            onClick={() => setActiveSection("performance")}
            className={`pb-2.5 flex items-center gap-2 border-b-2 transition-colors ${
              activeSection === "performance"
                ? "border-brand-primary text-brand-primary font-bold"
                : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Performance Evidence Synthesis
          </button>
          <button
            onClick={() => setActiveSection("mobility")}
            className={`pb-2.5 flex items-center gap-2 border-b-2 transition-colors ${
              activeSection === "mobility"
                ? "border-brand-primary text-brand-primary font-bold"
                : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            }`}
          >
            <Award className="w-4 h-4" />
            Capability-Adjacent Internal Mobility
          </button>
        </div>

        {/* 7A: Retention / Attrition Intelligence */}
        {activeSection === "attrition" && (
          <div className="space-y-6">
            {attritionError && (
              <InlineAlert variant="danger" title="Retention Signal Error">
                <div className="flex items-center justify-between">
                  <span>{attritionError}</span>
                  <Button size="sm" variant="outline" onClick={loadAttritionData} className="ml-4 h-7 text-xs">
                    <RefreshCw className="w-3 h-3 mr-1" /> Retry
                  </Button>
                </div>
              </InlineAlert>
            )}

            {isLoadingAttrition ? (
              <Card className="p-8 text-center border-neutral-200 dark:border-neutral-800">
                <Spinner className="mx-auto mb-2" />
                <p className="text-xs text-neutral-500">Calculating non-punitive workforce retention indicators...</p>
              </Card>
            ) : (
              <>
                {/* Cohort Distribution */}
                {attritionOverview && (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <Card className="p-4 border-neutral-200 dark:border-neutral-800">
                      <div className="text-xs text-neutral-500 font-medium">Evaluated Workforce</div>
                      <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                        {attritionOverview.total_evaluated}
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">Across active departments</div>
                    </Card>

                    <Card className="p-4 border-neutral-200 dark:border-neutral-800">
                      <div className="text-xs text-neutral-500 font-medium">Stable (Monitor)</div>
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                        {attritionOverview.band_distribution?.monitor ?? 0}
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">Low friction signals</div>
                    </Card>

                    <Card className="p-4 border-neutral-200 dark:border-neutral-800">
                      <div className="text-xs text-neutral-500 font-medium">Review Recommended</div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                        {attritionOverview.band_distribution?.review ?? 0}
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">Moderate growth plateau</div>
                    </Card>

                    <Card className="p-4 border-neutral-200 dark:border-neutral-800">
                      <div className="text-xs text-neutral-500 font-medium">Priority Retention Review</div>
                      <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                        {attritionOverview.band_distribution?.priority_review ?? 0}
                      </div>
                      <div className="text-[11px] text-rose-500 mt-0.5 font-medium">Supportive action ready</div>
                    </Card>
                  </div>
                )}

                {/* Individual Employee Card (Marcus Chen) */}
                {employeeRisk && (
                  <Card className="p-5 border-neutral-200 dark:border-neutral-800 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                            {employeeRisk.employee_name}
                          </h3>
                          <Badge variant="outline" className="text-xs font-mono">
                            {employeeRisk.employee_code}
                          </Badge>
                          <span className="text-xs text-neutral-400">•</span>
                          <span className="text-xs text-neutral-600 dark:text-neutral-300">
                            {employeeRisk.role_title} ({employeeRisk.department_name})
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          Calculated via transparent deterministic weights (Zero automated negative actions)
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-xs text-neutral-400">Retention Index</div>
                          <div className="text-lg font-bold text-rose-600 dark:text-rose-400">
                            {Math.round(employeeRisk.risk_score * 100)}%
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 uppercase text-[10px] tracking-wider px-2 py-1 font-bold"
                        >
                          {riskBand.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    </div>

                    {/* Explanation Quote */}
                    <div className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed bg-neutral-50 dark:bg-neutral-800/40 p-3 rounded border border-neutral-100 dark:border-neutral-800">
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">Deterministic Diagnosis: </span>
                      {diagnosisExplanation}
                    </div>

                    {/* Contributing Factors Grid */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                        Ethical Factor Decomposition (Non-Punitive)
                      </h4>
                      {riskFactors.length === 0 ? (
                        <p className="text-xs text-neutral-500">No active risk factors flagged.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {riskFactors.map((rf, idx) => (
                            <div
                              key={idx}
                              className="p-3 border border-neutral-200 dark:border-neutral-800 rounded bg-white dark:bg-neutral-900 space-y-1 text-xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-neutral-900 dark:text-neutral-100">{rf.signal_name}</span>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] ${
                                    rf.direction === "increases_risk"
                                      ? "text-rose-600 border-rose-200"
                                      : rf.direction === "reduces_risk"
                                      ? "text-emerald-600 border-emerald-200"
                                      : "text-neutral-500 border-neutral-200"
                                  }`}
                                >
                                  {rf.direction === "increases_risk" ? "+ Signal" : "- Signal"} (+{Math.round(rf.score_contribution * 100)}%)
                                </Badge>
                              </div>
                              <p className="text-neutral-500 text-[11px]">Observed: {String(rf.raw_value)}</p>
                              <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1">
                                <span>Source: {rf.evidence_source}</span>
                                <span>Freshness: {rf.data_freshness}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Supportive Interventions */}
                    <div className="pt-2 space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                        Recommended Supportive Interventions
                      </h4>
                      {interventions.length === 0 ? (
                        <p className="text-xs text-neutral-500">No interventions currently required.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {interventions.map((intervention, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/40 rounded text-xs text-neutral-800 dark:text-neutral-200"
                            >
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{intervention}</span>
                              </div>
                              {intervention.toLowerCase().includes("mobility") && (
                                <Link href="/recommendations">
                                  <Button variant="outline" size="sm" className="text-[11px] h-7 px-2">
                                    Review Action
                                  </Button>
                                </Link>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        )}

        {/* 7B: Performance Intelligence */}
        {activeSection === "performance" && (
          <div className="space-y-6">
            {performanceError && (
              <InlineAlert variant="danger" title="Performance Synthesis Error">
                <div className="flex items-center justify-between">
                  <span>{performanceError}</span>
                  <Button size="sm" variant="outline" onClick={loadPerformanceData} className="ml-4 h-7 text-xs">
                    <RefreshCw className="w-3 h-3 mr-1" /> Retry
                  </Button>
                </div>
              </InlineAlert>
            )}

            {isLoadingPerformance ? (
              <Card className="p-8 text-center border-neutral-200 dark:border-neutral-800">
                <Spinner className="mx-auto mb-2" />
                <p className="text-xs text-neutral-500">Synthesizing performance evidence...</p>
              </Card>
            ) : performanceInsight ? (
              <div className="space-y-6">
                {/* Top Metrics Row */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <Card className="p-4 border-neutral-200 dark:border-neutral-800">
                    <div className="text-xs text-neutral-500 font-medium">Evaluation Cycle</div>
                    <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                      {performanceInsight.evaluation_period}
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">{performanceInsight.employee_name}</div>
                  </Card>

                  <Card className="p-4 border-neutral-200 dark:border-neutral-800">
                    <div className="text-xs text-neutral-500 font-medium">Goal Progress Average</div>
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                      {performanceInsight.goal_summary?.average_progress_pct ?? 85}%
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      {performanceInsight.goal_summary?.on_track_goals ?? 3} on track / {performanceInsight.goal_summary?.total_goals ?? 4} active goals
                    </div>
                  </Card>

                  <Card className="p-4 border-neutral-200 dark:border-neutral-800">
                    <div className="text-xs text-neutral-500 font-medium">Verified Strengths</div>
                    <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                      {demonstratedStrengths.length}
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">Multi-tier evidence verified</div>
                  </Card>

                  <Card className="p-4 border-neutral-200 dark:border-neutral-800">
                    <div className="text-xs text-neutral-500 font-medium">Growth Opportunities</div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                      {developmentNeeds.length}
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">Targeted for AI Fraud initiative</div>
                  </Card>
                </div>

                {/* Synthesis Card */}
                <Card className="p-5 border-neutral-200 dark:border-neutral-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                        Evidence-Backed Performance Synthesis
                      </h3>
                    </div>
                    <Badge variant="outline" className="border-neutral-300 text-neutral-700 dark:text-neutral-300 text-xs">
                      {performanceInsight.is_qwen_assisted ? "Evidence Engine Synthesis" : "Deterministic Rule-Based Synthesis"}
                    </Badge>
                  </div>

                  <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line bg-neutral-50 dark:bg-neutral-800/40 p-3.5 rounded border border-neutral-100 dark:border-neutral-800">
                    {performanceInsight.qwen_synthesis || "Marcus demonstrates consistent architectural leadership and Kubernetes platform excellence, with high readiness for cross-departmental leadership."}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
                        Demonstrated Core Strengths
                      </h4>
                      <ul className="space-y-1.5">
                        {demonstratedStrengths.map((str, idx) => (
                          <li key={idx} className="text-xs text-neutral-600 dark:text-neutral-400 flex items-start gap-1.5">
                            <span className="text-emerald-500 font-bold">•</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
                        Manager 1:1 Coaching Prompts
                      </h4>
                      <ul className="space-y-1.5">
                        {discussionPrompts.map((prompt, idx) => (
                          <li key={idx} className="text-xs text-neutral-600 dark:text-neutral-400 flex items-start gap-1.5">
                            <MessageSquare className="w-3 h-3 text-neutral-400 mt-0.5 shrink-0" />
                            <span>{prompt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              </div>
            ) : null}
          </div>
        )}

        {/* 7C: Skill Intelligence & Mobility */}
        {activeSection === "mobility" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>Adjacent capability graph matching & internal mobility opportunities</span>
            </div>

            {mobilityError && (
              <InlineAlert variant="danger" title="Mobility Matching Error">
                <div className="flex items-center justify-between">
                  <span>{mobilityError}</span>
                  <Button size="sm" variant="outline" onClick={loadMobilityData} className="ml-4 h-7 text-xs">
                    <RefreshCw className="w-3 h-3 mr-1" /> Retry
                  </Button>
                </div>
              </InlineAlert>
            )}

            {isLoadingMobility ? (
              <Card className="p-8 text-center border-neutral-200 dark:border-neutral-800">
                <Spinner className="mx-auto mb-2" />
                <p className="text-xs text-neutral-500">Evaluating skill graph matches...</p>
              </Card>
            ) : mobilityMatches.length === 0 ? (
              <Card className="p-6 text-center text-xs text-neutral-500 border-dashed border-neutral-300 dark:border-neutral-700">
                No active internal mobility matches found.
              </Card>
            ) : (
              <div className="space-y-4">
                {mobilityMatches.map((match) => (
                  <Card key={match.id} className="p-5 border-neutral-200 dark:border-neutral-800 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                            {match.employee_name}
                          </span>
                          <span className="text-xs text-neutral-400">({match.current_role_title})</span>
                          <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            {match.target_role_title}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          Department: {match.target_department_name} • Verified competencies: {match.verified_skills_count}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs text-neutral-400">Fit Index</div>
                          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                            {match.fit_percentage}%
                          </div>
                        </div>
                        <Link href="/recommendations">
                          <Button variant="primary" size="sm" className="text-xs flex items-center gap-1.5">
                            Transfer Review
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Transferable Skills */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-neutral-700 dark:text-neutral-300">
                          Adjacent Transferable Capabilities
                        </h4>
                        <div className="space-y-1.5">
                          {(match.adjacent_transferable_skills || []).map((s, idx) => (
                            <div key={idx} className="p-2 bg-neutral-50 dark:bg-neutral-800/40 rounded border border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                              <span className="font-medium text-neutral-800 dark:text-neutral-200">{s.skill_name} (L{s.level})</span>
                              <span className="text-neutral-500 text-[11px]">Transfers to: <strong className="text-neutral-700 dark:text-neutral-300">{s.transfers_to}</strong></span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Remaining Skill Gaps & Learning */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-neutral-700 dark:text-neutral-300">
                          Targeted Bridge Curriculum
                        </h4>
                        <div className="space-y-1.5">
                          {(match.suggested_learning_path || []).map((path, idx) => (
                            <div key={idx} className="p-2 bg-neutral-50 dark:bg-neutral-800/40 rounded border border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                              <span className="font-medium text-neutral-800 dark:text-neutral-200">{path.title}</span>
                              <span className="text-neutral-500 text-[11px]">{path.provider} • {path.hours} hrs</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
