"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  BrainCircuit,
  Shield,
  HelpCircle,
  MessageSquare,
  FileText,
  Scale,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  getInterviewSessionApi,
  getInterviewInsightsApi,
  completeInterviewApi,
  getInterviewKitApi,
  recordRecruitmentDecisionApi,
} from "@/lib/api/recruitment";
import {
  InterviewInsight,
  InterviewKit,
  InterviewSession,
} from "@/types/recruitment";

export default function InterviewInsightsPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [kit, setKit] = useState<InterviewKit | null>(null);
  const [insight, setInsight] = useState<InterviewInsight | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // Human Decision Gate State
  const [decisionType, setDecisionType] = useState<string>("advance");
  const [decisionRationale, setDecisionRationale] = useState("");
  const [isOverride, setIsOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [candidateFacingStatus, setCandidateFacingStatus] = useState("Technical Round Concluded");
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [decisionRecorded, setDecisionRecorded] = useState(false);

  const loadData = useCallback(async () => {
    if (!sessionId) return;
    try {
      setIsLoading(true);
      setError(null);
      const sessData = await getInterviewSessionApi(sessionId);
      setSession(sessData);

      const kitData = await getInterviewKitApi(sessData.interview_kit_id);
      setKit(kitData);

      try {
        const insightData = await getInterviewInsightsApi(sessionId);
        setInsight(insightData);
      } catch {
        // Insights may not be synthesized yet
        setInsight(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load interview insight details");
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSynthesizeInsights = async () => {
    try {
      setIsSynthesizing(true);
      setActionMessage(null);
      const generated = await completeInterviewApi(sessionId);
      setInsight(generated);
      setActionMessage({
        type: "success",
        text: "Interview evidence successfully synthesized into 5-tier rubric ratings.",
      });
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to synthesize insights.",
      });
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !kit) return;

    if (isOverride && !overrideReason.trim()) {
      setActionMessage({
        type: "error",
        text: "An explicit override reason is mandatory when overriding the algorithmic recommendation.",
      });
      return;
    }

    try {
      setIsSubmittingDecision(true);
      setActionMessage(null);

      await recordRecruitmentDecisionApi(kit.job_opening_id, session.candidate_id, {
        decision: decisionType,
        rationale: decisionRationale,
        is_override: isOverride,
        override_reason: isOverride ? overrideReason : null,
        candidate_facing_status: candidateFacingStatus,
      });

      setDecisionRecorded(true);
      setActionMessage({
        type: "success",
        text: `Human decision "${decisionType.toUpperCase()}" committed to enterprise immutable audit ledger.`,
      });
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to commit human decision.",
      });
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex justify-center items-center py-32">
          <Spinner size="lg" />
        </div>
      </AppShell>
    );
  }

  if (error || !session || !kit) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto space-y-4">
          <Link href="/recruitment/jobs">
            <Button variant="ghost" size="sm" className="gap-1 text-content-muted">
              <ArrowLeft className="h-4 w-4" />
              Back to Recruitment
            </Button>
          </Link>
          <InlineAlert variant="danger" title="Session Not Found">
            {error || "Unable to load interview session."}
          </InlineAlert>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href={`/recruitment/interviews/${sessionId}/session`}>
              <Button variant="ghost" size="sm" className="gap-1 text-content-muted">
                <ArrowLeft className="h-4 w-4" />
                Live Session
              </Button>
            </Link>
            <span className="text-content-muted">•</span>
            <Link href={`/recruitment/jobs/${kit.job_opening_id}/ranking`}>
              <Button variant="ghost" size="sm" className="gap-1 text-content-muted">
                Candidate Rankings
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {insight && (
              <Badge
                variant={
                  insight.confidence_band === "high"
                    ? "success"
                    : insight.confidence_band === "moderate"
                    ? "muted"
                    : "warning"
                }
                size="sm"
                className="capitalize"
              >
                Confidence: {insight.confidence_band}
              </Badge>
            )}
            <Badge variant="muted" size="sm" className="capitalize">
              {session.session_status}
            </Badge>
          </div>
        </div>

        {/* Page Header */}
        <PageHeader
          title={`Interview Evidence Synthesis: ${session.candidate_name}`}
          description={`Kit: ${kit.title} • Interviewer: ${session.interviewer_name || "Authorized Staff"}`}
          actions={
            !insight ? (
              <Button
                variant="primary"
                size="sm"
                className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700"
                onClick={handleSynthesizeInsights}
                disabled={isSynthesizing || session.responses.length === 0}
              >
                <Sparkles className="h-4 w-4" />
                {isSynthesizing ? "Synthesizing Rubrics..." : "Generate Rubric Insights"}
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Link href={`/recruitment/jobs/${kit.job_opening_id}/ranking`}>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                    <Scale className="h-3.5 w-3.5" />
                    Return to Rankings
                  </Button>
                </Link>
              </div>
            )
          }
        />

        {actionMessage && (
          <InlineAlert variant={actionMessage.type === "success" ? "info" : "danger"} title="Synthesis Notice">
            {actionMessage.text}
          </InlineAlert>
        )}

        {/* Zero Score Fabrication Architecture Banner */}
        <div className="bg-surface-subtle border border-boundary-subtle p-3.5 rounded-sm flex items-start gap-3">
          <Shield className="h-5 w-5 text-interactive shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-content-primary">
              Interview Evidence Analyst Architecture
            </p>
            <p className="text-content-muted">
              AI maps observed candidate responses and interviewer empirical notes against 5-point rubrics to highlight demonstrated strengths and missing proof. AI strictly does not generate authoritative hiring decisions; final employment outcomes remain solely under accountable human authority.
            </p>
          </div>
        </div>

        {!insight ? (
          <Card className="p-12 text-center border border-boundary-subtle">
            <Sparkles className="h-10 w-10 text-interactive mx-auto mb-3" />
            <h3 className="text-base font-semibold text-content-primary">
              Interview Concluded: Ready for Synthesis
            </h3>
            <p className="text-sm text-content-muted max-w-md mx-auto mt-1 mb-4">
              {session.responses.length} responses recorded. Run the Interview Evidence Analyst to map evidence to 5-tier rubrics and extract competency gaps.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSynthesizeInsights}
              disabled={isSynthesizing}
              className="gap-1.5"
            >
              <Sparkles className="h-4 w-4" />
              {isSynthesizing ? "Synthesizing Evidence..." : "Run Evidence Analyst"}
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Executive Synthesis Summary */}
            <Card className="p-5 border border-boundary-subtle space-y-3 bg-surface-canvas">
              <div className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-interactive" />
                <h3 className="text-sm font-semibold text-content-primary">
                  AI Evidence-Grounded Synthesis Summary
                </h3>
              </div>
              <p className="text-xs text-content-secondary leading-relaxed bg-surface-subtle p-3 rounded-sm border border-boundary-subtle">
                {insight.summary}
              </p>
            </Card>

            {/* Visual Separation: 3-Way Evidence Columns for each question */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-content-primary">
                Multi-Source Evidence Alignment (Candidate vs Interviewer vs AI Rubric)
              </h3>

              {session.responses.map((resp) => {
                const rubricItem = insight.rubric_analysis.find(
                  (r) => r.competency.toLowerCase() === resp.competency.toLowerCase()
                );

                return (
                  <Card key={resp.question_index} className="p-4 border border-boundary-subtle space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-boundary-subtle">
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-interactive text-white flex items-center justify-center font-bold text-xs">
                          {resp.question_index}
                        </span>
                        <h4 className="font-semibold text-xs text-content-primary">
                          {resp.competency}
                        </h4>
                      </div>
                      {rubricItem && (
                        <Badge
                          variant={
                            rubricItem.assessed_level >= 4
                              ? "success"
                              : rubricItem.assessed_level === 3
                              ? "muted"
                              : "warning"
                          }
                          size="sm"
                        >
                          Assessed: Level {rubricItem.assessed_level} / 5
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-content-muted italic">&ldquo;{resp.question_text}&rdquo;</p>

                    {/* 3 Distinct Evidence Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
                      {/* 1. Candidate Demonstrated Statement */}
                      <div className="p-3 bg-surface-subtle/70 rounded-sm border border-boundary-subtle space-y-1">
                        <span className="font-semibold text-content-primary flex items-center gap-1">
                          <MessageSquare className="h-3.5 w-3.5 text-interactive" />
                          Candidate Observed Response:
                        </span>
                        <p className="text-content-secondary leading-relaxed">
                          {resp.candidate_response_text}
                        </p>
                      </div>

                      {/* 2. Recruiter Empirical Notes */}
                      <div className="p-3 bg-surface-subtle/70 rounded-sm border border-boundary-subtle space-y-1">
                        <span className="font-semibold text-content-primary flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5 text-interactive" />
                          Interviewer Field Notes:
                        </span>
                        <p className="text-content-secondary leading-relaxed">
                          {resp.interviewer_notes || "No additional observational notes recorded."}
                        </p>
                      </div>

                      {/* 3. AI Synthesized Rubric Evaluation */}
                      <div className="p-3 bg-interactive/5 rounded-sm border border-interactive/20 space-y-1">
                        <span className="font-semibold text-content-primary flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5 text-interactive" />
                          Synthesized Rubric Evaluation:
                        </span>
                        {rubricItem ? (
                          <div className="space-y-1">
                            <p className="text-content-primary font-medium">
                              <span className="text-interactive font-bold">Demonstrated:</span> {rubricItem.evidence_demonstrated}
                            </p>
                            {rubricItem.evidence_missing && (
                              <p className="text-amber-700 dark:text-amber-400">
                                <span className="font-bold">Missing Proof:</span> {rubricItem.evidence_missing}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-content-muted italic">No rubric assessment mapped.</p>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Strengths & Gaps Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Demonstrated Strengths */}
              <Card className="p-4 border border-boundary-subtle space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Demonstrated Competency Strengths ({insight.demonstrated_strengths.length})
                </div>
                <ul className="space-y-1 text-xs text-content-secondary pl-1">
                  {insight.demonstrated_strengths.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Evidence Gaps */}
              <Card className="p-4 border border-boundary-subtle space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  Identified Evidence Gaps ({insight.evidence_gaps.length})
                </div>
                <ul className="space-y-1 text-xs text-content-secondary pl-1">
                  {insight.evidence_gaps.map((gap, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{gap}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            {/* Follow-up Recommendations */}
            {insight.follow_up_recommendations && insight.follow_up_recommendations.length > 0 && (
              <Card className="p-4 border border-boundary-subtle space-y-2 bg-surface-subtle/30">
                <div className="flex items-center gap-2 text-xs font-semibold text-content-primary">
                  <HelpCircle className="h-4 w-4 text-interactive" />
                  Follow-Up Debrief Recommendations
                </div>
                <ul className="space-y-1 text-xs text-content-secondary pl-1">
                  {insight.follow_up_recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-interactive font-bold">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Accountable Human Decision Gate */}
            <Card className="p-5 border border-interactive ring-1 ring-interactive space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-boundary-subtle">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-interactive" />
                  <h3 className="text-sm font-semibold text-content-primary">
                    Accountable Human Decision Gate
                  </h3>
                </div>
                <Badge variant={decisionRecorded ? "success" : "muted"} size="sm">
                  {decisionRecorded ? "Decision Committed" : "Pending Authorization"}
                </Badge>
              </div>

              <div className="p-3 bg-surface-subtle border border-boundary-subtle rounded-sm text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-content-muted">Candidate:</span>
                  <span className="font-semibold text-content-primary">{session.candidate_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-content-muted">Evaluation Stage:</span>
                  <span className="font-semibold text-content-primary">{kit.stage.replace(/_/g, " ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-content-muted">AI Synthesized Recommendation:</span>
                  <span className="font-semibold text-emerald-600">
                    {insight.demonstrated_strengths.length > insight.evidence_gaps.length
                      ? "Advance Candidate to Team Debrief / Next Round"
                      : "Review Technical Gaps Before Advancing"}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmitDecision} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-content-primary mb-1">
                    Hiring Authority Formal Decision *
                  </label>
                  <select
                    value={decisionType}
                    onChange={(e) => setDecisionType(e.target.value)}
                    className="w-full bg-surface-canvas border border-boundary-subtle p-2 rounded-sm text-content-primary"
                    required
                  >
                    <option value="advance">Advance Candidate (Aligned)</option>
                    <option value="offer">Extend Formal Employment Offer</option>
                    <option value="shortlist">Shortlist for Future Requisitions</option>
                    <option value="schedule_interview">Schedule Additional Deep Dive</option>
                    <option value="hold">Hold Application</option>
                    <option value="request_info">Request Reference Checks / Work Sample</option>
                    <option value="reject">Reject Application</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-content-primary mb-1">
                    Candidate-Facing Status Mask *
                  </label>
                  <input
                    type="text"
                    value={candidateFacingStatus}
                    onChange={(e) => setCandidateFacingStatus(e.target.value)}
                    placeholder="e.g. Technical Round Completed, In Review"
                    className="w-full bg-surface-canvas border border-boundary-subtle p-2 rounded-sm text-content-primary"
                    required
                  />
                  <span className="text-[11px] text-content-muted mt-0.5 block">
                    Privacy Shield: Candidates view only this status. Internal scores, rubrics, and recruiter notes are permanently redacted.
                  </span>
                </div>

                {/* Override Recommendation Toggle */}
                <div className="p-3 border border-boundary-subtle rounded-sm space-y-2 bg-surface-subtle/30">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-content-primary">
                      Override AI Evaluated Recommendation?
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
                        Mandatory Human Override Justification *
                      </label>
                      <textarea
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        placeholder="Detail specific hiring manager or team criteria for overriding the algorithmic recommendation..."
                        rows={2}
                        className="w-full bg-surface-canvas border border-amber-300 dark:border-amber-700 p-2 rounded-sm text-content-primary"
                        required={isOverride}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-content-primary mb-1">
                    Accountable Decision Rationale *
                  </label>
                  <textarea
                    value={decisionRationale}
                    onChange={(e) => setDecisionRationale(e.target.value)}
                    placeholder="Document interview findings, technical competency validation, and business justification..."
                    rows={3}
                    className="w-full bg-surface-canvas border border-boundary-subtle p-2 rounded-sm text-content-primary"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-boundary-subtle">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isSubmittingDecision}
                    className="gap-1.5"
                  >
                    <UserCheck className="h-4 w-4" />
                    {isSubmittingDecision ? "Committing to Ledger..." : "Commit Decision to Immutable Ledger"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
