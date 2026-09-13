"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  FileCheck,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { Spinner } from "@/components/ui/spinner";
import {
  getJobOpeningApi,
  uploadResumeApi,
  extractResumeEvidenceApi,
  listCandidateSkillNormalizationsApi,
} from "@/lib/api/recruitment";
import { listCandidatesApi } from "@/lib/api/workforce";
import { JobOpening, ResumeDocument, ResumeExtraction, SkillNormalizationItem } from "@/types/recruitment";
import { CandidateProfile } from "@/types/workforce";

export default function ResumeUploadPage() {
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobOpening | null>(null);
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [isLoadingRefs, setIsLoadingRefs] = useState(true);

  // File upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedResume, setUploadedResume] = useState<ResumeDocument | null>(null);

  // Extraction state
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<ResumeExtraction | null>(null);
  const [normalizations, setNormalizations] = useState<SkillNormalizationItem[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!jobId) return;
      try {
        setIsLoadingRefs(true);
        const [jobData, candsData] = await Promise.all([
          getJobOpeningApi(jobId),
          listCandidatesApi(),
        ]);
        setJob(jobData);
        setCandidates(candsData);
        if (candsData.length > 0) {
          setSelectedCandidateId(candsData[0].id);
        }
      } catch (err) {
        console.error("Failed to load candidates or job", err);
      } finally {
        setIsLoadingRefs(false);
      }
    }
    loadData();
  }, [jobId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedCandidateId) {
      setUploadError("Please select both a candidate profile and a resume file.");
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);
      setUploadedResume(null);
      setExtractionResult(null);
      setNormalizations([]);

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("candidate_id", selectedCandidateId);
      formData.append("job_opening_id", jobId);

      const resumeDoc = await uploadResumeApi(formData);
      setUploadedResume(resumeDoc);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload resume");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRunExtraction = async () => {
    if (!uploadedResume) return;

    try {
      setIsExtracting(true);
      const extraction = await extractResumeEvidenceApi(uploadedResume.id);
      setExtractionResult(extraction);

      // Load skill normalizations
      const norms = await listCandidateSkillNormalizationsApi(uploadedResume.candidate_id);
      setNormalizations(norms);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Evidence extraction failed");
    } finally {
      setIsExtracting(false);
    }
  };

  if (isLoadingRefs) {
    return (
      <AppShell>
        <div className="flex justify-center items-center py-32">
          <Spinner size="lg" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Link href={`/recruitment/jobs/${jobId}`}>
            <Button variant="ghost" size="sm" className="gap-1 text-content-muted">
              <ArrowLeft className="h-4 w-4" />
              Back to Job Requisition
            </Button>
          </Link>
        </div>

        <PageHeader
          title="Resume Intake & Text Extraction"
          description={`Requisition: ${job?.title || "Staff Engineer"} (${job?.requisition_code || ""})`}
        />

        {uploadError && (
          <InlineAlert variant="danger" title="Intake Advisory">
            {uploadError}
          </InlineAlert>
        )}

        {/* Upload Card */}
        <Card className="p-6 space-y-5 border border-boundary-subtle">
          <h3 className="text-base font-semibold text-content-primary">
            1. Candidate Association & Document Intake
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-muted uppercase mb-1">
                Select Candidate Twin *
              </label>
              <Select
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                options={candidates.map((c) => ({
                  value: c.id,
                  label: `${c.full_name || "Candidate"} (${c.email || "No Email"})`,
                }))}
                className="w-full"
              />
              <p className="text-[11px] text-content-muted mt-1">
                Extracted evidence will link directly into this candidate&apos;s Stage 3 Evidence Ledger.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-content-muted uppercase mb-1">
                Resume File (.pdf, .txt, .md) *
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-4 border-2 border-dashed border-boundary-subtle hover:border-brand-primary/60 rounded-md cursor-pointer text-center transition-colors bg-surface-subtle"
              >
                <Upload className="h-6 w-6 text-content-muted mx-auto mb-1" />
                <p className="text-xs font-medium text-content-primary">
                  {selectedFile ? selectedFile.name : "Click to select or drop resume file"}
                </p>
                <p className="text-[10px] text-content-muted mt-0.5">
                  Max 10MB • Text PDF or plaintext supported
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              onClick={handleUpload}
              disabled={!selectedFile || !selectedCandidateId || isUploading}
              className="gap-1.5"
            >
              {isUploading ? (
                <>
                  <Spinner size="sm" />
                  Ingesting Document...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Ingest & Parse Text
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Upload Result Card */}
        {uploadedResume && (
          <Card className="p-6 space-y-4 border border-boundary-subtle">
            <div className="flex items-center justify-between border-b border-boundary-subtle pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-status-success" />
                <h3 className="text-base font-semibold text-content-primary">
                  2. Intake Controller Output
                </h3>
              </div>
              <Badge
                variant={
                  uploadedResume.parsing_status === "extracted"
                    ? "success"
                    : uploadedResume.parsing_status === "ocr_required"
                    ? "warning"
                    : "danger"
                }
              >
                {uploadedResume.parsing_status.toUpperCase()}
              </Badge>
            </div>

            {uploadedResume.is_ocr_required && (
              <div className="p-3 bg-status-warning/10 border border-status-warning/30 rounded-md flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-status-warning shrink-0 mt-0.5" />
                <div className="text-xs text-content-primary">
                  <span className="font-semibold">OCR Required Advisory:</span> Scanned or empty PDF page detected with 0 extracted glyphs. Optical Character Recognition or text export recommended for complete evidence coverage.
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 bg-surface-subtle border border-boundary-subtle rounded">
                <span className="text-content-muted block mb-0.5">File Name</span>
                <span className="font-medium text-content-primary truncate block" title={uploadedResume.file_name}>
                  {uploadedResume.file_name}
                </span>
              </div>
              <div className="p-2.5 bg-surface-subtle border border-boundary-subtle rounded">
                <span className="text-content-muted block mb-0.5">Parser Engine</span>
                <span className="font-mono text-content-primary">{uploadedResume.parser_name}</span>
              </div>
              <div className="p-2.5 bg-surface-subtle border border-boundary-subtle rounded">
                <span className="text-content-muted block mb-0.5">Pages</span>
                <span className="font-semibold text-content-primary">{uploadedResume.page_count} page(s)</span>
              </div>
              <div className="p-2.5 bg-surface-subtle border border-boundary-subtle rounded">
                <span className="text-content-muted block mb-0.5">SHA256 Hash</span>
                <span className="font-mono text-[10px] text-content-muted truncate block" title={uploadedResume.sha256_hash}>
                  {uploadedResume.sha256_hash.substring(0, 16)}...
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-boundary-subtle">
              <span className="text-xs text-content-muted">
                Sanitized against prompt injection tags & executable macros
              </span>
              <Button
                variant="primary"
                onClick={handleRunExtraction}
                disabled={isExtracting}
                className="gap-1.5"
              >
                {isExtracting ? (
                  <>
                    <Spinner size="sm" />
                    Extracting Evidence with Qwen...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Run Evidence Extraction (Qwen)
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Structured Extraction Results */}
        {extractionResult && (
          <Card className="p-6 space-y-5 border border-boundary-subtle">
            <div className="flex items-center justify-between border-b border-boundary-subtle pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-brand-primary" />
                <h3 className="text-base font-semibold text-content-primary">
                  3. Structured Evidence & Canonical Normalization
                </h3>
              </div>
              <Badge variant="muted">Model: {extractionResult.model_version}</Badge>
            </div>

            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-content-muted uppercase">
                Candidate Career Summary
              </h4>
              <p className="p-3 bg-surface-subtle border border-boundary-subtle rounded text-sm text-content-primary">
                {extractionResult.summary || "No executive summary provided."}
              </p>
              <span className="text-xs text-content-muted">
                Calculated Experience Tenure: {extractionResult.total_years_experience.toFixed(1)} Years
              </span>
            </div>

            {/* Canonical Normalizations */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-content-muted uppercase">
                Resolved Skill Graph Entities ({normalizations.length})
              </h4>
              {normalizations.length === 0 ? (
                <p className="text-xs text-content-muted italic">No canonical skills normalized yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {normalizations.map((n) => (
                    <div
                      key={n.id}
                      className="p-2.5 bg-surface-base border border-boundary-subtle rounded flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-content-primary block">
                          {n.raw_phrase}
                        </span>
                        <span className="text-[10px] text-content-muted">
                          Resolved: {n.canonical_skill_name || "Unmapped"} • Confidence: {(n.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Badge
                        variant={
                          n.match_method === "exact_canonical"
                            ? "success"
                            : n.match_method === "exact_alias"
                            ? "muted"
                            : "outline"
                        }
                      >
                        {n.match_method.replace("_", " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-boundary-subtle flex justify-end">
              <Link href={`/recruitment/jobs/${jobId}/ranking`}>
                <Button variant="primary" className="gap-1.5">
                  Proceed to Candidate Rankings
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
