"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Save,
  Sparkles,
  HelpCircle,
  Shield,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { Spinner } from "@/components/ui/spinner";
import {
  getInterviewSessionApi,
  getInterviewKitApi,
  recordInterviewResponseApi,
  completeInterviewApi,
} from "@/lib/api/recruitment";
import {
  InterviewKit,
  InterviewQuestionItem,
  InterviewResponseRecord,
  InterviewSession,
} from "@/types/recruitment";

export default function InterviewSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [kit, setKit] = useState<InterviewKit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Active question index (0-based in array)
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);

  // Inputs for active question
  const [responseText, setResponseText] = useState("");
  const [notesText, setNotesText] = useState("");
  const [isSavingResponse, setIsSavingResponse] = useState(false);
  const [isCompletingSession, setIsCompletingSession] = useState(false);

  const syncActiveQuestionForm = (
    responses: InterviewResponseRecord[],
    qIndex: number,
    questions: InterviewQuestionItem[]
  ) => {
    const activeQ = questions[qIndex];
    if (!activeQ) return;
    const existing = responses.find((r) => r.question_index === activeQ.question_index);
    if (existing) {
      setResponseText(existing.candidate_response_text || "");
      setNotesText(existing.interviewer_notes || "");
    } else {
      setResponseText("");
      setNotesText("");
    }
  };

  const loadSessionAndKit = useCallback(async () => {
    if (!sessionId) return;
    try {
      setIsLoading(true);
      setError(null);
      const sessData = await getInterviewSessionApi(sessionId);
      setSession(sessData);

      const kitData = await getInterviewKitApi(sessData.interview_kit_id);
      setKit(kitData);

      syncActiveQuestionForm(sessData.responses, 0, kitData.questions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load interview session");
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadSessionAndKit();
  }, [loadSessionAndKit]);

  const handleSelectQuestion = (qIndex: number) => {
    if (!kit || !session) return;
    setActiveQuestionIdx(qIndex);
    syncActiveQuestionForm(session.responses, qIndex, kit.questions);
  };

  const handleSaveResponse = async () => {
    if (!kit || !session) return;
    const currentQ = kit.questions[activeQuestionIdx];
    if (!currentQ) return;

    if (!responseText.trim()) {
      setActionMessage({
        type: "error",
        text: "Please enter candidate response statements before saving.",
      });
      return;
    }

    try {
      setIsSavingResponse(true);
      setActionMessage(null);

      const recorded = await recordInterviewResponseApi(sessionId, {
        question_index: currentQ.question_index,
        question_text: currentQ.question_text,
        competency: currentQ.competency,
        candidate_response_text: responseText.trim(),
        interviewer_notes: notesText.trim() || undefined,
      });

      // Update local session responses
      const updatedResponses = [...session.responses];
      const existingIdx = updatedResponses.findIndex((r) => r.question_index === currentQ.question_index);
      if (existingIdx >= 0) {
        updatedResponses[existingIdx] = recorded;
      } else {
        updatedResponses.push(recorded);
      }

      setSession({
        ...session,
        session_status: "in_progress",
        responses: updatedResponses,
      });

      setActionMessage({
        type: "success",
        text: `Response recorded for Question ${currentQ.question_index} (${currentQ.competency}).`,
      });

      // Auto-advance to next question if available
      if (activeQuestionIdx < kit.questions.length - 1) {
        setActiveQuestionIdx(activeQuestionIdx + 1);
        syncActiveQuestionForm(updatedResponses, activeQuestionIdx + 1, kit.questions);
      }
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to record response.",
      });
    } finally {
      setIsSavingResponse(false);
    }
  };

  const handleCompleteInterview = async () => {
    if (!session || session.responses.length === 0) {
      setActionMessage({
        type: "error",
        text: "You must record at least one response before completing the interview.",
      });
      return;
    }

    try {
      setIsCompletingSession(true);
      setActionMessage(null);
      await completeInterviewApi(sessionId);
      router.push(`/recruitment/interviews/${sessionId}/insights`);
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to complete interview analysis.",
      });
      setIsCompletingSession(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !session || !kit) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Link href="/recruitment/jobs">
          <Button variant="ghost" size="sm" className="gap-1 text-content-muted">
            <ArrowLeft className="h-4 w-4" />
            Back to Recruitment
          </Button>
        </Link>
        <InlineAlert variant="danger" title="Session Not Found">
          {error || "Unable to load the requested interview session."}
        </InlineAlert>
      </div>
    );
  }

  const currentQ = kit.questions[activeQuestionIdx];
  const recordedCount = session.responses.length;
  const totalQuestions = kit.questions.length;

  return (
    <ProtectedRoute allowedRoles={["recruiter", "hr", "manager", "administrator"]}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link href={`/recruitment/interviews/${session.interview_kit_id}/kit`}>
            <Button variant="ghost" size="sm" className="gap-1 text-content-muted">
              <ArrowLeft className="h-4 w-4" />
              Back to Interview Kit
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <Badge
              variant={session.session_status === "completed" ? "success" : "muted"}
              size="sm"
              className="capitalize"
            >
              Session: {session.session_status.replace(/_/g, " ")}
            </Badge>
            <span className="text-xs text-content-muted">
              {recordedCount} of {totalQuestions} answered
            </span>
          </div>
        </div>

        {/* Page Header */}
        <PageHeader
          title={`Live Evaluation: ${session.candidate_name}`}
          description={`Kit: ${kit.title} • Interviewer: ${session.interviewer_name || "Authorized Staff"}`}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700"
                onClick={handleCompleteInterview}
                disabled={isCompletingSession || session.responses.length === 0}
              >
                <Sparkles className="h-4 w-4" />
                {isCompletingSession ? "Synthesizing Insights..." : "Complete & Generate Insights"}
              </Button>
            </div>
          }
        />

        {actionMessage && (
          <InlineAlert variant={actionMessage.type === "success" ? "info" : "danger"} title="Session Notice">
            {actionMessage.text}
          </InlineAlert>
        )}

        {/* Question Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-boundary-subtle">
          {kit.questions.map((q, idx) => {
            const isAnswered = session.responses.some((r) => r.question_index === q.question_index);
            const isActive = idx === activeQuestionIdx;

            return (
              <button
                key={q.question_index}
                onClick={() => handleSelectQuestion(idx)}
                className={`flex items-center gap-2 px-3 py-2 rounded-sm text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                  isActive
                    ? "bg-interactive text-white border-interactive"
                    : isAnswered
                    ? "bg-surface-subtle text-content-primary border-boundary-subtle hover:border-interactive"
                    : "bg-surface-canvas text-content-muted border-boundary-subtle hover:border-content-muted"
                }`}
              >
                {isAnswered && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
                <span>
                  Q{q.question_index}: {q.competency}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Question Evaluation Area */}
        {currentQ && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Question Prompt & Response Form (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="p-5 border border-boundary-subtle space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-boundary-subtle">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-interactive text-white flex items-center justify-center font-bold text-xs">
                      {currentQ.question_index}
                    </span>
                    <h3 className="font-semibold text-sm text-content-primary">
                      {currentQ.competency}
                    </h3>
                  </div>
                  <Badge variant="muted" size="sm" className="capitalize">
                    {currentQ.question_type.replace(/_/g, " ")}
                  </Badge>
                </div>

                <div className="p-3 bg-surface-subtle/50 rounded-sm border border-boundary-subtle">
                  <p className="text-sm font-semibold text-content-primary leading-relaxed">
                    &ldquo;{currentQ.question_text}&rdquo;
                  </p>
                </div>

                {/* Candidate Response Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-content-primary">
                    Candidate Demonstrated Response & Evidence Statements *
                  </label>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Transcribe or summarize the candidate's actual architectural decisions, technical trade-offs, and quantified evidence..."
                    rows={6}
                    className="w-full bg-surface-canvas border border-boundary-subtle p-3 rounded-sm text-xs leading-relaxed text-content-primary focus:border-interactive"
                  />
                  <span className="text-[11px] text-content-muted block">
                    Record factual statements only. AI evaluates strictly against observable rubrics.
                  </span>
                </div>

                {/* Interviewer Notes Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-content-primary">
                    Interviewer Observation Notes (Optional)
                  </label>
                  <textarea
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    placeholder="Empirical interviewer observations (e.g. candidate referenced Raft quorum leases, addressed edge failure modes independently)..."
                    rows={3}
                    className="w-full bg-surface-canvas border border-boundary-subtle p-3 rounded-sm text-xs text-content-primary focus:border-interactive"
                  />
                </div>

                {/* Question Action Controls */}
                <div className="flex items-center justify-between pt-3 border-t border-boundary-subtle">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSelectQuestion(activeQuestionIdx - 1)}
                      disabled={activeQuestionIdx === 0}
                      className="gap-1 text-xs"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" /> Previous
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSelectQuestion(activeQuestionIdx + 1)}
                      disabled={activeQuestionIdx === kit.questions.length - 1}
                      className="gap-1 text-xs"
                    >
                      Next <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={handleSaveResponse}
                    disabled={isSavingResponse}
                  >
                    <Save className="h-3.5 w-3.5" />
                    {isSavingResponse ? "Recording..." : "Save Question Response"}
                  </Button>
                </div>
              </Card>
            </div>

            {/* Right Column: Question Rubric Reference & Probing Guide (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="p-4 border border-boundary-subtle space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-boundary-subtle">
                  <Shield className="h-4 w-4 text-interactive" />
                  <h4 className="text-xs font-semibold text-content-primary">
                    Observable 5-Tier Rubric Reference
                  </h4>
                </div>

                {/* Why Asking */}
                <div className="text-xs space-y-1 bg-surface-subtle p-2.5 rounded-sm border border-boundary-subtle">
                  <span className="font-semibold text-content-primary block">Objective:</span>
                  <p className="text-content-muted">{currentQ.why_asking}</p>
                </div>

                {/* Rubric Levels */}
                <div className="space-y-2">
                  {currentQ.rubric.map((lvl) => (
                    <div
                      key={lvl.level}
                      className="p-2.5 rounded-sm border border-boundary-subtle bg-surface-canvas space-y-0.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-interactive">Level {lvl.level}</span>
                        <span className="font-semibold text-content-primary">{lvl.title}</span>
                      </div>
                      <p className="text-[11px] text-content-secondary leading-relaxed">
                        {lvl.description}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Probing Prompts */}
                {currentQ.follow_up_prompts && currentQ.follow_up_prompts.length > 0 && (
                  <div className="pt-2 border-t border-boundary-subtle text-xs space-y-1">
                    <span className="font-semibold text-content-muted flex items-center gap-1">
                      <HelpCircle className="h-3.5 w-3.5" />
                      Suggested Follow-Up Prompts:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-content-secondary pl-1">
                      {currentQ.follow_up_prompts.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
