"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Play,
  Edit3,
  Save,
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
  getInterviewKitApi,
  approveInterviewKitApi,
  updateInterviewKitApi,
  createInterviewSessionApi,
} from "@/lib/api/recruitment";
import { InterviewKit, InterviewQuestionItem } from "@/types/recruitment";

export default function InterviewKitPage() {
  const params = useParams();
  const router = useRouter();
  const kitId = params.id as string;

  const [kit, setKit] = useState<InterviewKit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuestions, setEditedQuestions] = useState<InterviewQuestionItem[]>([]);
  const [editedTitle, setEditedTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Session launcher modal
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [launchNotes, setLaunchNotes] = useState("");
  const [isLaunching, setIsLaunching] = useState(false);

  const loadKit = useCallback(async () => {
    if (!kitId) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await getInterviewKitApi(kitId);
      setKit(data);
      setEditedQuestions(data.questions);
      setEditedTitle(data.title);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load interview kit");
    } finally {
      setIsLoading(false);
    }
  }, [kitId]);

  useEffect(() => {
    loadKit();
  }, [loadKit]);

  const handleApprove = async () => {
    try {
      setActionMessage(null);
      const updated = await approveInterviewKitApi(kitId);
      setKit(updated);
      setActionMessage({
        type: "success",
        text: "Interview kit approved! Rubrics are officially validated for live evaluation.",
      });
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to approve kit.",
      });
    }
  };

  const handleSaveEdits = async () => {
    try {
      setIsSaving(true);
      setActionMessage(null);
      const updated = await updateInterviewKitApi(kitId, {
        title: editedTitle,
        questions: editedQuestions,
      });
      setKit(updated);
      setIsEditing(false);
      setActionMessage({
        type: "success",
        text: "Interview kit questions and rubrics saved successfully.",
      });
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save edits.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLaunchSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kit) return;

    if (!kit.candidate_id) {
      setActionMessage({
        type: "error",
        text: "Cannot launch session without an associated candidate.",
      });
      return;
    }

    try {
      setIsLaunching(true);
      const session = await createInterviewSessionApi({
        interview_kit_id: kit.id,
        candidate_id: kit.candidate_id,
        scheduled_at: new Date().toISOString(),
        notes: launchNotes.trim() || undefined,
      });

      router.push(`/recruitment/interviews/${session.id}/session`);
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to schedule live session.",
      });
      setIsLaunching(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !kit) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Link href="/recruitment/jobs">
          <Button variant="ghost" size="sm" className="gap-1 text-content-muted">
            <ArrowLeft className="h-4 w-4" />
            Back to Recruitment
          </Button>
        </Link>
        <InlineAlert variant="danger" title="Interview Kit Not Found">
          {error || "Unable to load the requested interview kit."}
        </InlineAlert>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["recruiter", "hr", "manager", "administrator"]}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link href={`/recruitment/jobs/${kit.job_opening_id}/ranking`}>
            <Button variant="ghost" size="sm" className="gap-1 text-content-muted">
              <ArrowLeft className="h-4 w-4" />
              Back to Candidate Rankings
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <Badge variant={kit.status === "approved" ? "success" : "muted"} size="sm" className="capitalize">
              {kit.status} Kit
            </Badge>
            <Badge variant="muted" size="sm" className="capitalize">
              {kit.stage.replace(/_/g, " ")}
            </Badge>
          </div>
        </div>

        {/* Page Header */}
        <PageHeader
          title={isEditing ? editedTitle : kit.title}
          description={`Standardized 5-tier observable rubric kit • Candidate: ${kit.candidate_name || "General Pool"}`}
          actions={
            <div className="flex items-center gap-2">
              {kit.status === "draft" && !isEditing && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit Questions
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700"
                    onClick={handleApprove}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve Interview Kit
                  </Button>
                </>
              )}

              {isEditing && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      setEditedQuestions(kit.questions);
                      setEditedTitle(kit.title);
                      setIsEditing(false);
                    }}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={handleSaveEdits}
                    disabled={isSaving}
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              )}

              <Button
                variant="primary"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setShowLaunchModal(true)}
              >
                <Play className="h-4 w-4" />
                Launch Live Session
              </Button>
            </div>
          }
        />

        {actionMessage && (
          <InlineAlert variant={actionMessage.type === "success" ? "info" : "danger"} title="Interview Kit Notice">
            {actionMessage.text}
          </InlineAlert>
        )}

        {/* Rubric Framework Architecture Banner */}
        <div className="bg-surface-subtle border border-boundary-subtle p-3.5 rounded-sm flex items-start gap-3">
          <Shield className="h-5 w-5 text-interactive shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-content-primary">
              Observable Rubric Governance Guarantee
            </p>
            <p className="text-content-muted">
              Every question is calibrated to an observable 5-point competency rubric (Novice to Expert). Interviewers record raw responses and empirical notes. AI evaluates strictly demonstrated competency evidence against these rubrics without sentiment analysis, demographic inference, or unauthorized hiring decisions.
            </p>
          </div>
        </div>

        {/* Questions & Rubrics List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-content-primary">
              Structured Questions & 5-Level Rubrics ({kit.questions.length} Items)
            </h3>
            <span className="text-xs text-content-muted">
              Tier 1 (Novice) through Tier 5 (Expert)
            </span>
          </div>

          {kit.questions.map((q, qIndex) => (
            <Card key={q.question_index} className="p-5 border border-boundary-subtle space-y-4">
              {/* Question Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-boundary-subtle">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-surface-subtle border border-boundary-subtle flex items-center justify-center font-bold text-xs text-interactive">
                    Q{q.question_index}
                  </span>
                  <Badge variant="muted" size="sm" className="capitalize">
                    {q.question_type.replace(/_/g, " ")}
                  </Badge>
                  <span className="text-xs font-semibold text-content-primary">
                    Competency: {q.competency}
                  </span>
                </div>
              </div>

              {/* Question Text */}
              <div>
                {isEditing ? (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-content-primary">Question Prompt:</label>
                    <textarea
                      value={editedQuestions[qIndex]?.question_text || ""}
                      onChange={(e) => {
                        const next = [...editedQuestions];
                        next[qIndex] = { ...next[qIndex], question_text: e.target.value };
                        setEditedQuestions(next);
                      }}
                      rows={2}
                      className="w-full text-xs p-2 bg-surface-canvas border border-boundary-subtle rounded-sm"
                    />
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-content-primary leading-relaxed">
                    &ldquo;{q.question_text}&rdquo;
                  </p>
                )}
              </div>

              {/* Why Asking & Expected Evidence Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-surface-subtle/50 p-3 rounded-sm border border-boundary-subtle">
                <div>
                  <span className="font-semibold text-content-secondary block mb-0.5">
                    Objective / Why Asking:
                  </span>
                  <p className="text-content-muted leading-relaxed">{q.why_asking}</p>
                </div>
                <div>
                  <span className="font-semibold text-content-secondary block mb-0.5">
                    Observable Expected Evidence:
                  </span>
                  <p className="text-content-muted leading-relaxed">{q.expected_evidence}</p>
                </div>
              </div>

              {/* 5-Level Rubric Table */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-content-primary block">
                  Observable Evaluation Rubric (1 - 5 Scale)
                </span>
                <div className="border border-boundary-subtle rounded-sm overflow-hidden bg-surface-canvas">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-subtle border-b border-boundary-subtle text-content-muted">
                      <tr>
                        <th className="py-2 px-3 w-16 text-center">Level</th>
                        <th className="py-2 px-3 w-32">Proficiency</th>
                        <th className="py-2 px-3">Observable Behavioral Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-boundary-subtle">
                      {q.rubric.map((lvl) => (
                        <tr key={lvl.level} className="hover:bg-surface-subtle/30">
                          <td className="py-2.5 px-3 text-center font-bold text-interactive">
                            L{lvl.level}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-content-primary">
                            {lvl.title}
                          </td>
                          <td className="py-2.5 px-3 text-content-secondary leading-relaxed">
                            {lvl.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Follow-up Prompts */}
              {q.follow_up_prompts && q.follow_up_prompts.length > 0 && (
                <div className="text-xs space-y-1 pt-1">
                  <span className="font-semibold text-content-muted flex items-center gap-1">
                    <HelpCircle className="h-3.5 w-3.5" />
                    Probing / Follow-Up Questions:
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-content-secondary pl-1">
                    {q.follow_up_prompts.map((p, idx) => (
                      <li key={idx}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Launch Live Session Modal */}
        {showLaunchModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-surface-canvas border border-boundary-subtle rounded-sm max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-boundary-subtle">
                <div className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-interactive" />
                  <h3 className="text-base font-semibold text-content-primary">
                    Launch Live Evaluation Session
                  </h3>
                </div>
                <button
                  onClick={() => setShowLaunchModal(false)}
                  className="text-content-muted hover:text-content-primary cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <div className="p-3 bg-surface-subtle border border-boundary-subtle rounded-sm text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-content-muted">Candidate:</span>
                  <span className="font-semibold text-content-primary">
                    {kit.candidate_name || "Elena Rostova"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-content-muted">Interview Kit:</span>
                  <span className="font-semibold text-content-primary">{kit.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-content-muted">Rubric Coverage:</span>
                  <span className="font-semibold text-interactive">{kit.questions.length} Standardized Questions</span>
                </div>
              </div>

              <form onSubmit={handleLaunchSession} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-content-primary mb-1">
                    Interviewer Preparation Notes (Optional)
                  </label>
                  <textarea
                    value={launchNotes}
                    onChange={(e) => setLaunchNotes(e.target.value)}
                    placeholder="Focus areas, specialized topics, or interview coordination guidelines..."
                    rows={3}
                    className="w-full bg-surface-canvas border border-boundary-subtle p-2 rounded-sm text-content-primary"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-boundary-subtle">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowLaunchModal(false)}
                    disabled={isLaunching}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isLaunching}
                    className="gap-1.5"
                  >
                    <Play className="h-4 w-4" />
                    {isLaunching ? "Initiating Session..." : "Start Live Session"}
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
