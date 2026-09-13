"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  FileQuestion,
  UserCheck,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Scale,
  X,
  BrainCircuit,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  getCandidateRankingsApi,
  calculateCandidateMatchApi,
  generateInterviewKitApi,
  recordRecruitmentDecisionApi,
} from "@/lib/api/recruitment";
import {
  CandidateMatchEvaluation,
  CandidateRankingListResponse,
} from "@/types/recruitment";

export default function CandidateRankingPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [rankingData, setRankingData] = useState<CandidateRankingListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Feature state
  const [blindReview, setBlindReview] = useState(false);
  const [expandedCandidateId, setExpandedCandidateId] = useState<string | null>(null);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  // Decision Modal state
  const [decisionModalCandidate, setDecisionModalCandidate] = useState<CandidateMatchEvaluation | null>(null);
  const [decisionType, setDecisionType] = useState<string>("advance");
  const [decisionRationale, setDecisionRationale] = useState("");
  const [isOverride, setIsOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [candidateFacingStatus, setCandidateFacingStatus] = useState("Under Review");
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  // Kit generation state
  const [isGeneratingKit, setIsGeneratingKit] = useState<string | null>(null);

  const loadRankings = useCallback(async () => {
    if (!jobId) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await getCandidateRankingsApi(jobId);
      setRankingData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load candidate rankings");
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    loadRankings();
  }, [loadRankings]);

  const handleRecalculateMatch = async (candidateId: string) => {
    try {
      setActionMessage(null);
      await calculateCandidateMatchApi(jobId, candidateId);
      await loadRankings();
      setActionMessage({ type: "success", text: "Candidate match successfully recalculated." });
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to recalculate match.",
      });
    }
  };

  const handleToggleComparison = (candidateId: string) => {
    setSelectedForComparison((prev) => {
      if (prev.includes(candidateId)) {
        return prev.filter((id) => id !== candidateId);
      }
      if (prev.length >= 2) {
        return [prev[1], candidateId];
      }
      return [...prev, candidateId];
    });
  };

  const handleGenerateKit = async (cand: CandidateMatchEvaluation) => {
    try {
      setIsGeneratingKit(cand.candidate_id);
      const kit = await generateInterviewKitApi({
        job_opening_id: jobId,
        candidate_id: cand.candidate_id,
        title: `Technical Interview Kit: ${cand.candidate_name}`,
        stage: "technical_round_1",
      });
      router.push(`/recruitment/interviews/${kit.id}/kit`);
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to generate interview kit.",
      });
      setIsGeneratingKit(null);
    }
  };

  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionModalCandidate) return;

    if (isOverride && !overrideReason.trim()) {
      setActionMessage({
        type: "error",
        text: "Override reason is mandatory when overriding the algorithmic recommendation.",
      });
      return;
    }

    try {
      setIsSubmittingDecision(true);
      await recordRecruitmentDecisionApi(jobId, decisionModalCandidate.candidate_id, {
        decision: decisionType,
        rationale: decisionRationale,
        is_override: isOverride,
        override_reason: isOverride ? overrideReason : null,
        candidate_facing_status: candidateFacingStatus,
      });

      setActionMessage({
        type: "success",
        text: `Decision "${decisionType.toUpperCase()}" recorded with full audit trail.`,
      });
      setDecisionModalCandidate(null);
      setDecisionRationale("");
      setOverrideReason("");
      setIsOverride(false);
      await loadRankings();
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to record human decision.",
      });
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  // Compare candidates
  const comparisonCandidates = useMemo(() => {
    if (!rankingData) return [];
    return rankingData.candidates.filter((c) => selectedForComparison.includes(c.candidate_id));
  }, [rankingData, selectedForComparison]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["recruiter", "hr", "manager", "leadership", "administrator"]}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link href={`/recruitment/jobs/${jobId}`}>
            <Button variant="ghost" size="sm" className="gap-1 text-content-muted">
              <ArrowLeft className="h-4 w-4" />
              Back to Job Requisition
            </Button>
          </Link>

          {/* Blind Review Mode Toggle */}
          <div className="flex items-center gap-3 bg-surface-subtle px-3 py-1.5 rounded-sm border border-boundary-subtle">
            <span className="text-xs font-medium text-content-secondary flex items-center gap-1.5">
              {blindReview ? <EyeOff className="h-3.5 w-3.5 text-interactive" /> : <Eye className="h-3.5 w-3.5 text-content-muted" />}
              Blind Review Mode
            </span>
            <Switch
              checked={blindReview}
              onChange={(e) => setBlindReview(e.target.checked)}
              aria-label="Toggle blind review mode"
            />
          </div>
        </div>

        {/* Page Header */}
        <PageHeader
          title="Candidate Match Rankings"
          description={
            rankingData
              ? `Requisition: ${rankingData.job_title} • Requirement v${rankingData.requirement_version} • Deterministic scoring with evidence grounding`
              : "Evaluated Candidate Rankings"
          }
          actions={
            <div className="flex items-center gap-2">
              {selectedForComparison.length === 2 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-interactive text-interactive"
                  onClick={() => setShowComparisonModal(true)}
                >
                  <Scale className="h-4 w-4" />
                  Compare Selected (2)
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={loadRankings}
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          }
        />

        {actionMessage && (
          <InlineAlert variant={actionMessage.type === "success" ? "info" : "danger"} title="System Notice">
            {actionMessage.text}
          </InlineAlert>
        )}

        {error && (
          <InlineAlert variant="danger" title="Error Loading Rankings">
            {error}
          </InlineAlert>
        )}

        {/* Zero Score Fabrication Architecture Banner */}
        <div className="bg-surface-subtle border border-boundary-subtle p-3.5 rounded-sm flex items-start gap-3">
          <Shield className="h-5 w-5 text-interactive shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-content-primary">
              WorkSense Transparent Deterministic Scoring Guarantee
            </p>
            <p className="text-content-muted">
              Match scores are computed deterministically from verified resume evidence against active requirement weights (Required Skills, Preferred Skills, Evidence Strength, and Experience Alignment). Local Qwen models generate natural-language explanations and interview rubrics, but strictly cannot alter authoritative match scores or make hiring decisions.
            </p>
          </div>
        </div>

        {/* Rankings Table */}
        {rankingData && rankingData.candidates.length === 0 ? (
          <Card className="p-12 text-center border border-boundary-subtle">
            <Sparkles className="h-10 w-10 text-content-muted mx-auto mb-3" />
            <h3 className="text-base font-semibold text-content-primary">No Evaluated Candidates</h3>
            <p className="text-sm text-content-muted max-w-md mx-auto mt-1 mb-4">
              Upload candidate resumes to extract structured evidence and run deterministic match scoring.
            </p>
            <Link href={`/recruitment/jobs/${jobId}/upload`}>
              <Button variant="primary" size="sm">
                Upload Candidate Resumes
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-content-muted px-1">
              <span>Showing {rankingData?.candidates.length || 0} evaluated candidates (ordered by deterministic rank)</span>
              <span>Select up to 2 candidates to compare side-by-side</span>
            </div>

            {rankingData?.candidates.map((cand) => {
              const isExpanded = expandedCandidateId === cand.candidate_id;
              const isCompared = selectedForComparison.includes(cand.candidate_id);
              const displayName = blindReview ? `Candidate #${cand.rank_position}` : cand.candidate_name;
              const displayEmail = blindReview ? "anonymized@candidate.shield" : cand.candidate_email;

              return (
                <Card
                  key={cand.id}
                  className={`border transition-colors ${
                    isCompared ? "border-interactive ring-1 ring-interactive" : "border-boundary-subtle hover:border-interactive/60"
                  }`}
                >
                  <div className="p-4 space-y-3">
                    {/* Top Row: Rank, Identity, Score, Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {/* Comparison Checkbox */}
                        <input
                          type="checkbox"
                          checked={isCompared}
                          onChange={() => handleToggleComparison(cand.candidate_id)}
                          className="h-4 w-4 rounded border-boundary-subtle text-interactive focus:ring-interactive cursor-pointer"
                          title="Select to compare"
                        />

                        {/* Rank Badge */}
                        <div className="h-8 w-8 rounded-full bg-surface-subtle border border-boundary-subtle flex items-center justify-center font-bold text-sm text-content-primary">
                          #{cand.rank_position}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm text-content-primary">
                              {displayName}
                            </h3>
                            {cand.is_stale && (
                              <Badge variant="warning" size="sm">
                                Stale Req
                              </Badge>
                            )}
                            {/* Grounding Status Badge */}
                            {cand.explanation_grounding_status === "grounded" && (
                              <Badge variant="success" size="sm" className="gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Grounded
                              </Badge>
                            )}
                            {cand.explanation_grounding_status === "degraded_mode" && (
                              <Badge variant="muted" size="sm" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Fallback
                              </Badge>
                            )}
                            {cand.explanation_grounding_status === "failed_grounding" && (
                              <Badge variant="danger" size="sm" className="gap-1">
                                Critic Flagged
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-content-muted">{displayEmail}</p>
                        </div>
                      </div>

                      {/* Score Metrics */}
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-interactive">
                              {Math.round(cand.overall_match_score)}
                            </span>
                            <span className="text-xs text-content-muted">/ 100</span>
                          </div>
                          <span className="text-[10px] uppercase tracking-wider text-content-muted">
                            Deterministic Score
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedCandidateId(isExpanded ? null : cand.candidate_id)}
                            className="gap-1 text-xs"
                          >
                            {isExpanded ? (
                              <>
                                Hide Breakdown <ChevronUp className="h-3.5 w-3.5" />
                              </>
                            ) : (
                              <>
                                View Breakdown <ChevronDown className="h-3.5 w-3.5" />
                              </>
                            )}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-xs"
                            onClick={() => handleGenerateKit(cand)}
                            disabled={isGeneratingKit === cand.candidate_id}
                          >
                            <FileQuestion className="h-3.5 w-3.5" />
                            {isGeneratingKit === cand.candidate_id ? "Generating..." : "Interview Kit"}
                          </Button>

                          <Button
                            variant="primary"
                            size="sm"
                            className="gap-1 text-xs"
                            onClick={() => {
                              setDecisionModalCandidate(cand);
                              setDecisionRationale("");
                              setIsOverride(false);
                            }}
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            Decision Gate
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-boundary-subtle">
                      <div>
                        <div className="flex justify-between text-[11px] text-content-muted mb-1">
                          <span>Required Skills</span>
                          <span className="font-semibold text-content-primary">{Math.round(cand.required_skill_coverage)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-surface-subtle rounded-full overflow-hidden">
                          <div
                            className="h-full bg-interactive"
                            style={{ width: `${cand.required_skill_coverage}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] text-content-muted mb-1">
                          <span>Preferred Skills</span>
                          <span className="font-semibold text-content-primary">{Math.round(cand.preferred_skill_coverage)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-surface-subtle rounded-full overflow-hidden">
                          <div
                            className="h-full bg-interactive/80"
                            style={{ width: `${cand.preferred_skill_coverage}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] text-content-muted mb-1">
                          <span>Evidence Strength</span>
                          <span className="font-semibold text-content-primary">{Math.round(cand.evidence_strength_score)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-surface-subtle rounded-full overflow-hidden">
                          <div
                            className="h-full bg-interactive/70"
                            style={{ width: `${cand.evidence_strength_score}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] text-content-muted mb-1">
                          <span>Tenure Alignment</span>
                          <span className="font-semibold text-content-primary">{Math.round(cand.experience_alignment_score)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-surface-subtle rounded-full overflow-hidden">
                          <div
                            className="h-full bg-interactive/60"
                            style={{ width: `${cand.experience_alignment_score}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expandable Breakdown Drawer */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-boundary-subtle space-y-4 bg-surface-subtle/40 -mx-4 -mb-4 p-4 rounded-b-sm">
                        {/* Qwen Rationale */}
                        {cand.qwen_explanation && (
                          <div className="p-3 bg-surface-canvas border border-boundary-subtle rounded-sm">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-content-primary mb-1">
                              <BrainCircuit className="h-4 w-4 text-interactive" />
                              AI Evidence-Grounded Explanation (Critic Validated)
                            </div>
                            <p className="text-xs text-content-secondary leading-relaxed">
                              {cand.qwen_explanation}
                            </p>
                          </div>
                        )}

                        {/* Criterion Details Table */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-content-primary">
                            Transparent Mathematical Criterion Breakdown
                          </h4>
                          <div className="border border-boundary-subtle rounded-sm overflow-hidden bg-surface-canvas">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-surface-subtle border-b border-boundary-subtle text-content-muted">
                                <tr>
                                  <th className="py-2 px-3">Criterion</th>
                                  <th className="py-2 px-3">Weight</th>
                                  <th className="py-2 px-3">Raw Score</th>
                                  <th className="py-2 px-3">Weighted Points</th>
                                  <th className="py-2 px-3">Evidence Citations</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-boundary-subtle">
                                {Object.entries(cand.criterion_breakdown).map(([key, detail]) => (
                                  <tr key={key}>
                                    <td className="py-2.5 px-3 font-medium text-content-primary capitalize">
                                      {detail.criterion_name.replace(/_/g, " ")}
                                    </td>
                                    <td className="py-2.5 px-3 text-content-muted">
                                      {(detail.weight * 100).toFixed(0)}%
                                    </td>
                                    <td className="py-2.5 px-3 font-semibold text-content-primary">
                                      {detail.raw_score.toFixed(1)} / 100
                                    </td>
                                    <td className="py-2.5 px-3 font-bold text-interactive">
                                      {detail.weighted_contribution.toFixed(1)} pts
                                    </td>
                                    <td className="py-2.5 px-3 text-content-muted max-w-xs truncate">
                                      {detail.evidence_citations && detail.evidence_citations.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                          {detail.evidence_citations.slice(0, 3).map((cit, i) => (
                                            <span
                                              key={i}
                                              className="bg-surface-subtle border border-boundary-subtle px-1.5 py-0.5 rounded text-[10px] text-content-secondary"
                                            >
                                              {typeof cit === "string" ? cit : JSON.stringify(cit)}
                                            </span>
                                          ))}
                                          {detail.evidence_citations.length > 3 && (
                                            <span className="text-[10px] text-content-muted">
                                              +{detail.evidence_citations.length - 3} more
                                            </span>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-content-muted italic">No citations</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Re-calculate Button */}
                        <div className="flex justify-end pt-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-xs text-content-muted"
                            onClick={() => handleRecalculateMatch(cand.candidate_id)}
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Recalculate Match Score
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Side-by-Side Comparison Modal */}
        {showComparisonModal && comparisonCandidates.length === 2 && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-surface-canvas border border-boundary-subtle rounded-sm max-w-4xl w-full max-h-[90vh] overflow-y-auto space-y-4 p-6">
              <div className="flex items-center justify-between pb-3 border-b border-boundary-subtle">
                <div className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-interactive" />
                  <h3 className="text-base font-semibold text-content-primary">
                    Candidate Side-by-Side Comparison
                  </h3>
                </div>
                <button
                  onClick={() => setShowComparisonModal(false)}
                  className="text-content-muted hover:text-content-primary cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {comparisonCandidates.map((cand) => (
                  <Card key={cand.candidate_id} className="p-4 space-y-4 border border-boundary-subtle">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs text-interactive font-bold">
                          Rank #{cand.rank_position}
                        </span>
                        <h4 className="font-semibold text-sm text-content-primary">
                          {blindReview ? `Candidate #${cand.rank_position}` : cand.candidate_name}
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-interactive">
                          {Math.round(cand.overall_match_score)}
                        </span>
                        <span className="text-xs text-content-muted">/100</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <div className="flex justify-between text-content-muted mb-1">
                          <span>Required Skills ({Math.round(cand.required_skill_coverage)}%)</span>
                        </div>
                        <div className="h-1.5 bg-surface-subtle rounded-full overflow-hidden">
                          <div className="h-full bg-interactive" style={{ width: `${cand.required_skill_coverage}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-content-muted mb-1">
                          <span>Preferred Skills ({Math.round(cand.preferred_skill_coverage)}%)</span>
                        </div>
                        <div className="h-1.5 bg-surface-subtle rounded-full overflow-hidden">
                          <div className="h-full bg-interactive/80" style={{ width: `${cand.preferred_skill_coverage}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-content-muted mb-1">
                          <span>Evidence Strength ({Math.round(cand.evidence_strength_score)}%)</span>
                        </div>
                        <div className="h-1.5 bg-surface-subtle rounded-full overflow-hidden">
                          <div className="h-full bg-interactive/70" style={{ width: `${cand.evidence_strength_score}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-content-muted mb-1">
                          <span>Tenure Alignment ({Math.round(cand.experience_alignment_score)}%)</span>
                        </div>
                        <div className="h-1.5 bg-surface-subtle rounded-full overflow-hidden">
                          <div className="h-full bg-interactive/60" style={{ width: `${cand.experience_alignment_score}%` }} />
                        </div>
                      </div>
                    </div>

                    {cand.qwen_explanation && (
                      <div className="p-2.5 bg-surface-subtle border border-boundary-subtle rounded text-xs text-content-secondary">
                        <span className="font-semibold text-content-primary block mb-1">Grounding Summary:</span>
                        {cand.qwen_explanation}
                      </div>
                    )}
                  </Card>
                ))}
              </div>

              <div className="flex justify-end pt-3 border-t border-boundary-subtle">
                <Button variant="secondary" size="sm" onClick={() => setShowComparisonModal(false)}>
                  Close Comparison
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Human Decision Gate Modal */}
        {decisionModalCandidate && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-surface-canvas border border-boundary-subtle rounded-sm max-w-xl w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-boundary-subtle">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-interactive" />
                  <h3 className="text-base font-semibold text-content-primary">
                    Accountable Human Decision Gate
                  </h3>
                </div>
                <button
                  onClick={() => setDecisionModalCandidate(null)}
                  className="text-content-muted hover:text-content-primary cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-3 bg-surface-subtle border border-boundary-subtle rounded-sm text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-content-muted">Evaluating:</span>
                  <span className="font-semibold text-content-primary">
                    {blindReview ? `Candidate #${decisionModalCandidate.rank_position}` : decisionModalCandidate.candidate_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-content-muted">Deterministic Match Score:</span>
                  <span className="font-bold text-interactive">{Math.round(decisionModalCandidate.overall_match_score)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-content-muted">Algorithmic Recommendation:</span>
                  <span className="font-semibold text-emerald-600">Advance to Technical Round</span>
                </div>
              </div>

              <form onSubmit={handleSubmitDecision} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-content-primary mb-1">
                    Hiring Authority Decision *
                  </label>
                  <select
                    value={decisionType}
                    onChange={(e) => setDecisionType(e.target.value)}
                    className="w-full bg-surface-canvas border border-boundary-subtle p-2 rounded-sm text-content-primary"
                    required
                  >
                    <option value="advance">Advance to Interview (Aligned)</option>
                    <option value="shortlist">Shortlist for Next Batch</option>
                    <option value="schedule_interview">Schedule Live Evaluation</option>
                    <option value="hold">Hold Application</option>
                    <option value="request_info">Request Additional Portfolio / Work Samples</option>
                    <option value="offer">Extend Employment Offer</option>
                    <option value="reject">Reject Application</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-content-primary mb-1">
                    Candidate-Facing Status Display *
                  </label>
                  <input
                    type="text"
                    value={candidateFacingStatus}
                    onChange={(e) => setCandidateFacingStatus(e.target.value)}
                    placeholder="e.g. Application Under Review, Technical Round Scheduled"
                    className="w-full bg-surface-canvas border border-boundary-subtle p-2 rounded-sm text-content-primary"
                    required
                  />
                  <span className="text-[11px] text-content-muted mt-0.5 block">
                    Privacy Shield: Candidates only see this sanitized label. They will never see internal scores or rubrics.
                  </span>
                </div>

                {/* Override Toggle */}
                <div className="p-3 border border-boundary-subtle rounded-sm space-y-2 bg-surface-subtle/30">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-content-primary">
                      Override Algorithmic Recommendation?
                    </span>
                    <Switch
                      checked={isOverride}
                      onChange={(e) => setIsOverride(e.target.checked)}
                      aria-label="Toggle recommendation override"
                    />
                  </div>

                  {isOverride && (
                    <div>
                      <label className="block font-semibold text-amber-700 dark:text-amber-400 mb-1">
                        Mandatory Override Justification *
                      </label>
                      <textarea
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        placeholder="State clear operational rationale for overriding the recommendation (e.g., headcount changes, specialized seniority mismatch, or alternative team placement)."
                        rows={2}
                        className="w-full bg-surface-canvas border border-amber-300 dark:border-amber-700 p-2 rounded-sm text-content-primary"
                        required={isOverride}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-content-primary mb-1">
                    Auditable Decision Rationale *
                  </label>
                  <textarea
                    value={decisionRationale}
                    onChange={(e) => setDecisionRationale(e.target.value)}
                    placeholder="Summarize evidence observed, skill coverage analysis, and justification for this stage decision."
                    rows={3}
                    className="w-full bg-surface-canvas border border-boundary-subtle p-2 rounded-sm text-content-primary"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-boundary-subtle">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDecisionModalCandidate(null)}
                    disabled={isSubmittingDecision}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isSubmittingDecision}
                  >
                    {isSubmittingDecision ? "Recording Decision..." : "Commit Decision to Ledger"}
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
