"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { Spinner } from "@/components/ui/spinner";
import { createOnboardingCaseApi, previewOnboardingCaseApi } from "@/lib/api/onboarding";
import { OnboardingCasePreview } from "@/types/onboarding";

export default function NewOnboardingPage() {
  const router = useRouter();

  // Selected IDs (Defaulted to Golden Demo Elena Rostova)
  const candidateId = "30000000-0000-0000-0000-000000000001";
  const jobOpeningId = "40000000-0000-0000-0000-000000000001";
  const departmentId = "60000000-0000-0000-0000-000000000002";
  const jobRoleId = "61000000-0000-0000-0000-000000000002";
  const managerEmployeeId = "69000000-0000-0000-0000-000000000001";

  // Form Fields
  const [employeeCode, setEmployeeCode] = useState(`EMP-${Math.floor(10000 + Math.random() * 90000)}`);
  const [hireDate, setHireDate] = useState("2026-10-15");
  const [workLocation, setWorkLocation] = useState("San Francisco, CA (Remote)");
  const employmentType = "full_time";

  // Preview & Processing State
  const [preview, setPreview] = useState<OnboardingCasePreview | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStep, setSubmissionStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPreview() {
      if (!candidateId || !jobOpeningId) return;
      try {
        setIsPreviewLoading(true);
        setError(null);
        const data = await previewOnboardingCaseApi(candidateId, jobOpeningId);
        setPreview(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate onboarding preview");
      } finally {
        setIsPreviewLoading(false);
      }
    }

    fetchPreview();
  }, [candidateId, jobOpeningId]);

  async function handleInitiateOnboarding(e: React.FormEvent) {
    e.preventDefault();
    if (!preview?.is_eligible) {
      setError(preview?.eligibility_message || "Candidate is not eligible for employment conversion.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      setSubmissionStep("Converting Candidate Twin to Employee Twin (Preserving Lineage)...");
      await new Promise((r) => setTimeout(r, 600));

      setSubmissionStep("Executing Multi-Brain Pipeline (Qwen Journey Architect & Dependency Scheduler)...");

      const res = await createOnboardingCaseApi({
        candidate_id: candidateId,
        job_opening_id: jobOpeningId,
        department_id: departmentId,
        job_role_id: jobRoleId,
        employee_code: employeeCode,
        hire_date: hireDate,
        manager_employee_id: managerEmployeeId,
        work_location: workLocation,
        employment_type: employmentType,
      });

      setSubmissionStep("Journey Created! Redirecting to Review Hub...");
      await new Promise((r) => setTimeout(r, 400));

      router.push(`/hr/onboarding/${res.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initiate onboarding journey");
      setIsSubmitting(false);
      setSubmissionStep(null);
    }
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-2 text-xs text-content-muted">
          <Link href="/hr/onboarding" className="hover:text-content-primary flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Onboarding Hub</span>
          </Link>
        </div>

        <PageHeader
          title="Initiate Adaptive Onboarding Journey"
          description="Convert an offered candidate into an employee and generate a multi-brain, evidence-backed onboarding plan."
        />

        {error && (
          <InlineAlert
            variant="danger"
            title="Eligibility or Configuration Notice"
            onClose={() => setError(null)}
          >
            {error}
          </InlineAlert>
        )}

        <form onSubmit={handleInitiateOnboarding} className="space-y-6">
          {/* Candidate & Role Selection */}
          <Card className="p-5 border-boundary-subtle bg-surface space-y-4">
            <div className="flex items-center justify-between border-b border-boundary-subtle pb-3">
              <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                <UserCheck className="h-4 w-4" />
                <span>Candidate & Role Continuity</span>
              </div>
              <Badge variant="outline" className="text-[11px] font-mono">
                Stage 4 Offer Continuity Gate
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-content-secondary">Candidate Profile</label>
                <div className="p-2.5 rounded bg-surface-secondary border border-boundary-subtle font-medium text-content-primary">
                  Elena Rostova (candidate@worksense.local)
                </div>
                <p className="text-[11px] text-content-muted">
                  Offered candidate from Stage 4 recruitment intelligence pipeline.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-content-secondary">Target Job Requisition</label>
                <div className="p-2.5 rounded bg-surface-secondary border border-boundary-subtle font-medium text-content-primary">
                  REQ-DIST-SYS-2026: Lead Distributed Systems Engineer
                </div>
                <p className="text-[11px] text-content-muted">
                  Department: Engineering | Hiring Manager: Marcus Vance
                </p>
              </div>
            </div>
          </Card>

          {/* Live Skill Gap & Template Preview */}
          {isPreviewLoading ? (
            <Card className="p-8 border-boundary-subtle flex flex-col items-center justify-center gap-2">
              <Spinner className="h-6 w-6 text-brand-primary" />
              <p className="text-xs text-content-muted">Analyzing Candidate Twin and computing skill gaps...</p>
            </Card>
          ) : preview ? (
            <Card className="p-5 border-boundary-subtle bg-surface space-y-4">
              <div className="flex items-center justify-between border-b border-boundary-subtle pb-3">
                <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                  <Sparkles className="h-4 w-4" />
                  <span>Deterministic Skill-Gap Analysis & Template Retention Preview</span>
                </div>
                <Badge
                  variant={preview.is_eligible ? "success" : "danger"}
                  className="text-[11px]"
                >
                  {preview.is_eligible ? "Eligible for Conversion" : "Pending Human Offer"}
                </Badge>
              </div>

              <p className="text-xs text-content-secondary leading-relaxed">
                {preview.eligibility_message}
              </p>

              {/* Skill Gaps Breakdown */}
              <div className="space-y-2 pt-1">
                <h4 className="text-xs font-bold text-content-primary uppercase tracking-wider">
                  Target Competency Gaps ({preview.skill_gaps.length})
                </h4>
                {preview.skill_gaps.length === 0 ? (
                  <p className="text-xs text-content-muted">Candidate meets 100% of role requirement proficiencies.</p>
                ) : (
                  <div className="space-y-2">
                    {preview.skill_gaps.map((gap) => (
                      <div
                        key={gap.skill_id}
                        className="p-3 rounded bg-surface-secondary border border-boundary-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-semibold text-content-primary flex items-center gap-2">
                            <span>{gap.skill_name}</span>
                            <Badge variant="outline" className="text-[10px]">
                              {gap.importance}
                            </Badge>
                          </div>
                          <p className="text-content-muted text-[11px]">
                            Candidate Proficiency: Level {gap.candidate_level} / Required: Level {gap.required_level} (Gap: {gap.gap_size} tiers)
                          </p>
                        </div>
                        {gap.recommended_resources.length > 0 && (
                          <div className="text-right sm:max-w-xs">
                            <span className="text-[10px] text-content-muted block">Curated Resource:</span>
                            <span className="text-brand-primary font-medium text-[11px] truncate block">
                              {gap.recommended_resources[0].title}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Retained Policy Tasks */}
              <div className="p-3 bg-surface-secondary rounded border border-boundary-subtle text-xs space-y-1">
                <div className="font-semibold text-content-primary flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Mandatory Policy Retainment: {preview.mandatory_task_count} Tasks Pre-Seeded</span>
                </div>
                <p className="text-content-muted text-[11px]">
                  All standard organization SOC2 compliance, IT hardware receipt, direct deposit, and engineering baseline tasks will be retained without modification.
                </p>
              </div>
            </Card>
          ) : null}

          {/* Conversion Details Form */}
          <Card className="p-5 border-boundary-subtle bg-surface space-y-4">
            <div className="flex items-center gap-2 text-brand-primary font-bold text-sm border-b border-boundary-subtle pb-3">
              <Briefcase className="h-4 w-4" />
              <span>Employment & Team Parameters</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-content-secondary">Employee Code</label>
                <Input
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  placeholder="e.g. EMP-90210"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-content-secondary">Official Start / Hire Date</label>
                <Input
                  type="date"
                  value={hireDate}
                  onChange={(e) => setHireDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-content-secondary">Work Location</label>
                <Input
                  value={workLocation}
                  onChange={(e) => setWorkLocation(e.target.value)}
                  placeholder="e.g. Remote / Bengaluru"
                  required
                />
              </div>
            </div>
          </Card>

          {/* Submit Action */}
          <div className="flex items-center justify-between p-4 bg-surface rounded-xl border border-boundary-subtle">
            <div>
              <p className="text-xs font-semibold text-content-primary">
                Multi-Brain Pipeline Ready
              </p>
              <p className="text-[11px] text-content-muted mt-0.5">
                Will invoke canonical conversion, run Qwen Journey Architect, schedule dependencies, and generate Plan v1.
              </p>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !preview?.is_eligible}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Spinner className="h-4 w-4" />
                  <span>{submissionStep || "Processing..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Adaptive Journey</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
