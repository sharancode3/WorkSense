"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FileSearch,
  FileText,
  HelpCircle,
  PlusCircle,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  UploadCloud,
} from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { Spinner } from "@/components/ui/spinner";
import {
  listPolicyActionsApi,
  listPolicyChunksApi,
  queryPolicyApi,
  requestPolicyActionApi,
  uploadPolicyDocumentApi,
} from "@/lib/api/policy";
import {
  PolicyActionResponse,
  PolicyChunk,
  PolicyQueryResponse,
} from "@/types/policy";

const QUICK_PROMPTS = [
  "Can a new hire work remotely from day 1?",
  "What is the standard probationary period and Day 45 check-in requirement?",
  "What is the annual professional learning and development stipend?",
  "What home office equipment subsidy is provided for remote employees?",
];

export default function PolicyReasoningPage() {
  const [queryInput, setQueryInput] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryResult, setQueryResult] = useState<PolicyQueryResponse | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  // Active view tab: "reasoning" | "chunks" | "actions"
  const [activeTab, setActiveTab] = useState<"reasoning" | "chunks" | "actions">("reasoning");

  // Pre-indexed chunks
  const [chunks, setChunks] = useState<PolicyChunk[]>([]);
  const [isLoadingChunks, setIsLoadingChunks] = useState(false);
  const [selectedChunk, setSelectedChunk] = useState<PolicyChunk | null>(null);

  // Policy actions
  const [actions, setActions] = useState<PolicyActionResponse[]>([]);
  const [isLoadingActions, setIsLoadingActions] = useState(false);

  // Action submission modal
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionPolicyCode, setActionPolicyCode] = useState("POL-REM-01");
  const [actionType, setActionType] = useState("remote_work_request");
  const [actionJustification, setActionJustification] = useState("");
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Upload modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCode, setUploadCode] = useState("");
  const [uploadCategory, setUploadCategory] = useState("general");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  // Execute initial search on mount or prompt click
  const handleRunQuery = async (textToQuery: string) => {
    if (!textToQuery.trim()) return;
    setIsQuerying(true);
    setQueryError(null);
    try {
      const res = await queryPolicyApi({
        query_text: textToQuery,
        max_citations: 4,
      });
      setQueryResult(res);
      setActiveTab("reasoning");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reason over policies.";
      setQueryError(msg);
    } finally {
      setIsQuerying(false);
    }
  };

  const loadChunks = useCallback(async () => {
    setIsLoadingChunks(true);
    try {
      const data = await listPolicyChunksApi(undefined, 60);
      setChunks(data);
    } catch {
      // Non-blocking
    } finally {
      setIsLoadingChunks(false);
    }
  }, []);

  const loadActions = useCallback(async () => {
    setIsLoadingActions(true);
    try {
      const data = await listPolicyActionsApi();
      setActions(data);
    } catch {
      // Non-blocking
    } finally {
      setIsLoadingActions(false);
    }
  }, []);

  useEffect(() => {
    loadChunks();
    loadActions();
  }, [loadChunks, loadActions]);

  const handleSubmitAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionJustification.trim()) return;
    setIsSubmittingAction(true);
    setActionSuccessMsg(null);
    try {
      const newAction = await requestPolicyActionApi({
        policy_code: actionPolicyCode,
        action_type: actionType,
        requested_by_employee_id: "69000000-0000-0000-0000-000000000002", // Marcus Chen
        justification: actionJustification,
      });
      setActions((prev) => [newAction, ...prev]);
      setActionSuccessMsg(`Action submitted successfully (Ref: ${newAction.id.slice(0, 8)}).`);
      setActionJustification("");
      setTimeout(() => {
        setIsActionModalOpen(false);
        setActionSuccessMsg(null);
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit action.";
      alert(msg);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !uploadTitle || !uploadCode) return;
    setIsUploading(true);
    setUploadMsg(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", uploadTitle);
      formData.append("policy_code", uploadCode);
      formData.append("version_number", "1.0");
      formData.append("effective_date", new Date().toISOString().split("T")[0]);
      formData.append("category", uploadCategory);
      formData.append("access_classification", "all_employees");

      const res = await uploadPolicyDocumentApi(formData);
      setUploadMsg(`Document indexed! Created ${res.total_chunks_created} searchable chunks.`);
      setSelectedFile(null);
      setUploadTitle("");
      setUploadCode("");
      await loadChunks();
      setTimeout(() => {
        setIsUploadModalOpen(false);
        setUploadMsg(null);
      }, 1800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload document.";
      alert(msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 pb-12">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                Policy Reasoning & Compliance RAG
              </h1>
              <Badge variant="outline" className="border-neutral-300 dark:border-neutral-700 text-xs">
                Stage 6
              </Badge>
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 text-xs">
                Local Qwen Assisted
              </Badge>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Deterministic clause retrieval, exact verbatim citations, and bounded Qwen synthesis. No hallucinated entitlements.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsUploadModalOpen(true)}
              className="text-xs flex items-center gap-1.5"
            >
              <UploadCloud className="w-3.5 h-3.5 text-neutral-500" />
              Upload Policy Doc
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsActionModalOpen(true)}
              className="text-xs flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Request Policy Action
            </Button>
          </div>
        </div>

        {/* Search Bar and Quick Prompts */}
        <Card className="p-4 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRunQuery(queryInput);
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Ask any policy question (e.g. eligibility for remote work, probation extension, learning budget)..."
                className="pl-9 text-xs"
              />
            </div>
            <Button
              type="submit"
              disabled={isQuerying || !queryInput.trim()}
              variant="primary"
              size="sm"
              className="text-xs flex items-center gap-1.5 px-4"
            >
              {isQuerying ? <Spinner size="sm" /> : <Send className="w-3.5 h-3.5" />}
              Reason Policy
            </Button>
          </form>

          {/* Quick prompt suggestions */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs">
            <span className="text-neutral-400 font-medium">Quick Prompts:</span>
            {QUICK_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setQueryInput(prompt);
                  handleRunQuery(prompt);
                }}
                className="text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 px-2.5 py-1 rounded transition-colors text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        </Card>

        {queryError && (
          <InlineAlert variant="danger" title="Reasoning Error">{queryError}</InlineAlert>
        )}

        {/* View Tabs */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab("reasoning")}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === "reasoning"
                ? "border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100 font-semibold"
                : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            }`}
          >
            RAG Reasoning & Citations {queryResult ? "(1 Result)" : ""}
          </button>
          <button
            onClick={() => setActiveTab("chunks")}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === "chunks"
                ? "border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100 font-semibold"
                : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            }`}
          >
            Pre-Indexed Document Chunks ({chunks.length})
          </button>
          <button
            onClick={() => setActiveTab("actions")}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === "actions"
                ? "border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100 font-semibold"
                : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            }`}
          >
            Policy Action Requests ({actions.length})
          </button>
        </div>

        {/* Tab 1: Reasoning Result */}
        {activeTab === "reasoning" && (
          <div className="space-y-4">
            {isQuerying && (
              <Card className="p-8 text-center border-neutral-200 dark:border-neutral-800">
                <Spinner className="mx-auto mb-3" />
                <p className="text-xs text-neutral-500">Searching indexed clauses & reasoning with Qwen...</p>
              </Card>
            )}

            {!isQuerying && !queryResult && (
              <Card className="p-8 text-center border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
                <FileSearch className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
                <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                  No Active Policy Query
                </h3>
                <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1">
                  Type a question above or click one of the quick prompts to retrieve authoritative clauses, exact citations, and bounded Qwen synthesis.
                </p>
              </Card>
            )}

            {!isQuerying && queryResult && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Direct Answer */}
                <div className="lg:col-span-2 space-y-4">
                  <Card className="p-5 border-neutral-200 dark:border-neutral-800 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                          Direct Answer
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-xs capitalize ${
                            queryResult.confidence_band === "high"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : queryResult.confidence_band === "medium"
                              ? "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300"
                              : "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300"
                          }`}
                        >
                          Confidence: {queryResult.confidence_band.replace("_", " ")}
                        </Badge>
                        {queryResult.qwen_assisted && (
                          <Badge variant="outline" className="text-xs border-purple-300 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                            Qwen Verified
                          </Badge>
                        )}
                        {queryResult.is_authoritative && (
                          <Badge variant="outline" className="text-xs border-neutral-300 text-neutral-700 dark:text-neutral-300">
                            Authoritative
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 leading-relaxed bg-neutral-50 dark:bg-neutral-800/40 p-3 rounded border border-neutral-100 dark:border-neutral-800">
                      {queryResult.direct_answer}
                    </div>

                    <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
                      <p className="font-semibold text-neutral-700 dark:text-neutral-300">Synthesized Summary:</p>
                      <p className="whitespace-pre-line">{queryResult.reasoning_summary}</p>
                    </div>

                    {queryResult.applicable_clauses.length > 0 && (
                      <div className="pt-2">
                        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Governing Clauses:</span>
                        <ul className="mt-1 space-y-1">
                          {queryResult.applicable_clauses.map((clause, idx) => (
                            <li key={idx} className="text-xs text-neutral-600 dark:text-neutral-400 flex items-start gap-1.5">
                              <span className="text-emerald-500 font-bold">•</span>
                              <span>{clause}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {queryResult.escalation_required && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded flex items-start gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                        <div className="text-xs">
                          <p className="font-semibold text-amber-800 dark:text-amber-200">Formal Human Escalation Required</p>
                          <p className="text-amber-700 dark:text-amber-300 mt-0.5">{queryResult.escalation_reason || "This request involves an exception to standard operating guidelines."}</p>
                        </div>
                      </div>
                    )}
                  </Card>
                </div>

                {/* Right Side: Exact Citations */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-neutral-500" />
                      Exact Citations ({queryResult.citations.length})
                    </h3>
                  </div>

                  {queryResult.citations.map((cite, idx) => (
                    <Card key={idx} className="p-3.5 border-neutral-200 dark:border-neutral-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {cite.policy_code} v{cite.version_number}
                        </Badge>
                        <span className="text-[10px] text-neutral-400">
                          Pg. {cite.page_number} • Match: {Math.round(cite.relevance_score * 100)}%
                        </span>
                      </div>
                      <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {cite.section_heading}
                      </div>
                      <div className="text-[11px] text-neutral-600 dark:text-neutral-400 italic bg-neutral-50 dark:bg-neutral-800/30 p-2 rounded border border-neutral-100 dark:border-neutral-800">
                        &ldquo;{cite.verbatim_quote}&rdquo;
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Document Chunks Library */}
        {activeTab === "chunks" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>Displaying authoritative pre-chunked policy sections for transparent verification</span>
              <Button variant="outline" size="sm" onClick={loadChunks} disabled={isLoadingChunks} className="text-xs">
                Refresh Chunks
              </Button>
            </div>

            {isLoadingChunks ? (
              <Card className="p-8 text-center border-neutral-200 dark:border-neutral-800">
                <Spinner className="mx-auto mb-2" />
                <p className="text-xs text-neutral-500">Loading indexed chunks...</p>
              </Card>
            ) : chunks.length === 0 ? (
              <Card className="p-6 text-center text-xs text-neutral-500 border-dashed border-neutral-300 dark:border-neutral-700">
                No indexed policy chunks found.
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {chunks.map((chunk) => (
                  <Card
                    key={chunk.id}
                    className="p-4 border-neutral-200 dark:border-neutral-800 space-y-2 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors cursor-pointer"
                    onClick={() => setSelectedChunk(chunk)}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {chunk.policy_code} v{chunk.version_number}
                      </Badge>
                      <span className="text-[10px] text-neutral-400">
                        Page {chunk.page_number} • {chunk.token_count} words
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                      {chunk.section_heading}
                    </h4>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-3 leading-relaxed">
                      {chunk.chunk_text}
                    </p>
                    <div className="pt-1 flex items-center justify-between text-[11px] text-neutral-400">
                      <span>{chunk.policy_title}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">Click to inspect</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Action Requests */}
        {activeTab === "actions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>Submitted policy requests, remote exceptions, and confirmation workflows</span>
              <Button variant="primary" size="sm" onClick={() => setIsActionModalOpen(true)} className="text-xs flex items-center gap-1">
                <PlusCircle className="w-3.5 h-3.5" />
                Submit New Request
              </Button>
            </div>

            {isLoadingActions ? (
              <Card className="p-8 text-center border-neutral-200 dark:border-neutral-800">
                <Spinner className="mx-auto mb-2" />
                <p className="text-xs text-neutral-500">Loading policy action requests...</p>
              </Card>
            ) : actions.length === 0 ? (
              <Card className="p-6 text-center text-xs text-neutral-500 border-dashed border-neutral-300 dark:border-neutral-700">
                No policy action requests submitted yet.
              </Card>
            ) : (
              <div className="space-y-3">
                {actions.map((act) => (
                  <Card key={act.id} className="p-4 border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {act.policy_code}
                        </Badge>
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100 capitalize">
                          {act.action_type.replace(/_/g, " ")}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            act.status === "approved"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : act.status === "rejected"
                              ? "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300"
                              : "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300"
                          }
                        >
                          {act.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <p className="text-neutral-600 dark:text-neutral-400">{act.justification}</p>
                      {act.approval_notes && (
                        <p className="text-neutral-500 italic">Reviewer Notes: {act.approval_notes}</p>
                      )}
                    </div>
                    <div className="text-neutral-400 text-[11px] shrink-0">
                      {new Date(act.created_at).toLocaleDateString()}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Chunk Inspection Modal */}
        {selectedChunk && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <Card className="w-full max-w-xl p-6 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
                <div>
                  <Badge variant="outline" className="font-mono text-[10px] mr-2">
                    {selectedChunk.policy_code} v{selectedChunk.version_number}
                  </Badge>
                  <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                    {selectedChunk.section_heading}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedChunk(null)}
                  className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  Close
                </button>
              </div>
              <div className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed bg-neutral-50 dark:bg-neutral-800/40 p-4 rounded border border-neutral-100 dark:border-neutral-800 whitespace-pre-wrap">
                {selectedChunk.chunk_text}
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] text-neutral-500 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <div>Page: <span className="font-medium text-neutral-700 dark:text-neutral-300">{selectedChunk.page_number}</span></div>
                <div>Word Count: <span className="font-medium text-neutral-700 dark:text-neutral-300">{selectedChunk.token_count}</span></div>
                <div>Access: <span className="font-medium text-neutral-700 dark:text-neutral-300">{selectedChunk.access_classification}</span></div>
              </div>
            </Card>
          </div>
        )}

        {/* Policy Action Submission Modal */}
        {isActionModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg p-6 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Request Policy Action / Exception
                </h3>
                <button
                  onClick={() => setIsActionModalOpen(false)}
                  className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  Cancel
                </button>
              </div>

              {actionSuccessMsg && (
                <InlineAlert variant="success" title="Success">{actionSuccessMsg}</InlineAlert>
              )}

              <form onSubmit={handleSubmitAction} className="space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Governing Policy
                  </label>
                  <select
                    value={actionPolicyCode}
                    onChange={(e) => setActionPolicyCode(e.target.value)}
                    className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-900 dark:text-neutral-100"
                  >
                    <option value="POL-REM-01">POL-REM-01: Global Remote Work Policy</option>
                    <option value="POL-PROB-01">POL-PROB-01: Probationary Period Policy</option>
                    <option value="POL-BEN-01">POL-BEN-01: Learning & Development Stipend</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Action Type
                  </label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-900 dark:text-neutral-100"
                  >
                    <option value="remote_work_request">Remote Work Arrangement Request</option>
                    <option value="equipment_stipend_claim">Home Office Equipment Stipend ($1,000 USD)</option>
                    <option value="learning_reimbursement">Learning Stipend Reimbursement</option>
                    <option value="probation_extension">Probation Extension Request (Manager)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Business Justification & Dates
                  </label>
                  <textarea
                    rows={4}
                    value={actionJustification}
                    onChange={(e) => setActionJustification(e.target.value)}
                    placeholder="Provide context, proposed effective dates, and equipment requirements..."
                    className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded p-2 text-xs text-neutral-900 dark:text-neutral-100"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsActionModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isSubmittingAction || !actionJustification.trim()}
                  >
                    {isSubmittingAction ? <Spinner size="sm" /> : "Submit for Approval"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Upload Document Modal */}
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg p-6 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Upload & Index Policy Document
                </h3>
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  Cancel
                </button>
              </div>

              {uploadMsg && (
                <InlineAlert variant="success" title="Upload Complete">{uploadMsg}</InlineAlert>
              )}

              <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Document Title
                  </label>
                  <Input
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="e.g. Information Security & Device Standard"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Policy Code
                    </label>
                    <Input
                      value={uploadCode}
                      onChange={(e) => setUploadCode(e.target.value)}
                      placeholder="e.g. POL-SEC-01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Category
                    </label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-900 dark:text-neutral-100"
                    >
                      <option value="security">Information Security</option>
                      <option value="remote_work">Remote Work</option>
                      <option value="benefits">Benefits & Compensation</option>
                      <option value="compliance">Regulatory Compliance</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    File (PDF or Text)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.txt,.md"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                    className="w-full text-xs text-neutral-500 border border-neutral-300 dark:border-neutral-700 rounded p-1.5"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsUploadModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isUploading || !selectedFile || !uploadTitle || !uploadCode}
                  >
                    {isUploading ? <Spinner size="sm" /> : "Index Document"}
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
