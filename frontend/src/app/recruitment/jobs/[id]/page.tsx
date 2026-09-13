"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Sparkles,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Building2,
  MapPin,
  Clock,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { Spinner } from "@/components/ui/spinner";
import { getJobOpeningApi } from "@/lib/api/recruitment";
import { JobOpening } from "@/types/recruitment";

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<JobOpening | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadJob() {
      if (!jobId) return;
      try {
        setIsLoading(true);
        setError(null);
        const data = await getJobOpeningApi(jobId);
        setJob(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load job details");
      } finally {
        setIsLoading(false);
      }
    }
    loadJob();
  }, [jobId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Link href="/recruitment/jobs">
          <Button variant="ghost" size="sm" className="gap-1 text-content-muted">
            <ArrowLeft className="h-4 w-4" />
            Back to Requisitions
          </Button>
        </Link>
        <InlineAlert variant="danger" title="Job Opening Not Found">
          {error || "Unable to find the specified job requisition."}
        </InlineAlert>
      </div>
    );
  }

  const req = job.active_requirement;

  return (
    <ProtectedRoute allowedRoles={["recruiter", "hr", "manager", "leadership", "administrator"]}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/recruitment/jobs">
            <Button variant="ghost" size="sm" className="gap-1 text-content-muted">
              <ArrowLeft className="h-4 w-4" />
              Back to Requisitions
            </Button>
          </Link>
        </div>

        <PageHeader
          title={job.title}
          description={`Requisition Code: ${job.requisition_code} • Version v${job.current_requirement_version}`}
          actions={
            <div className="flex items-center gap-2">
              <Link href={`/recruitment/jobs/${job.id}/upload`}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Users className="h-4 w-4" />
                  Upload Resumes
                </Button>
              </Link>
              <Link href={`/recruitment/jobs/${job.id}/ranking`}>
                <Button variant="primary" size="sm" className="gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  Candidate Rankings
                </Button>
              </Link>
            </div>
          }
        />

        {/* Overview Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 border border-boundary-subtle">
            <div className="flex items-center gap-2 text-content-muted text-xs mb-1">
              <Building2 className="h-3.5 w-3.5" />
              <span>Department</span>
            </div>
            <p className="text-sm font-semibold text-content-primary">
              {job.department_name || "Unassigned"}
            </p>
          </Card>

          <Card className="p-4 border border-boundary-subtle">
            <div className="flex items-center gap-2 text-content-muted text-xs mb-1">
              <MapPin className="h-3.5 w-3.5" />
              <span>Location</span>
            </div>
            <p className="text-sm font-semibold text-content-primary">
              {job.location || "Remote"}
            </p>
          </Card>

          <Card className="p-4 border border-boundary-subtle">
            <div className="flex items-center gap-2 text-content-muted text-xs mb-1">
              <Clock className="h-3.5 w-3.5" />
              <span>Employment Type</span>
            </div>
            <p className="text-sm font-semibold text-content-primary capitalize">
              {job.employment_type.replace("_", " ")}
            </p>
          </Card>

          <Card className="p-4 border border-boundary-subtle">
            <div className="flex items-center gap-2 text-content-muted text-xs mb-1">
              <Users className="h-3.5 w-3.5" />
              <span>Target Headcount</span>
            </div>
            <p className="text-sm font-semibold text-content-primary">
              {job.target_headcount} position(s)
            </p>
          </Card>
        </div>

        {/* Active Requirement Version */}
        <Card className="p-6 space-y-5 border border-boundary-subtle">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-boundary-subtle pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand-primary" />
              <h3 className="text-base font-semibold text-content-primary">
                Active Requirement Specification (Version v{job.current_requirement_version})
              </h3>
            </div>
            <Badge variant="success">Active Baseline</Badge>
          </div>

          {/* Quality Audit Flags */}
          {req?.quality_audit_flags && req.quality_audit_flags.length > 0 ? (
            <div className="p-3.5 bg-status-warning/10 border border-status-warning/30 rounded-md space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-status-warning">
                <AlertTriangle className="h-4 w-4" />
                Quality Audit Advisories ({req.quality_audit_flags.length})
              </div>
              <ul className="text-xs text-content-primary space-y-1 pl-5 list-disc">
                {req.quality_audit_flags.map((flag, i) => (
                  <li key={i}>{flag}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-status-success font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Audit passed: Specification free of recognized demographic or ambiguity flags.
            </div>
          )}

          {/* Responsibilities */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-semibold text-content-muted uppercase">
              Mandate & Responsibilities
            </h4>
            <div className="p-3.5 bg-surface-subtle border border-boundary-subtle rounded-md text-sm text-content-primary whitespace-pre-wrap">
              {req?.responsibilities || "No specific responsibilities documented."}
            </div>
          </div>

          {/* Required Skills */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-content-muted uppercase">
              Required Competencies ({req?.required_skills?.length || 0})
            </h4>
            {req?.required_skills && req.required_skills.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {req.required_skills.map((s) => (
                  <div
                    key={s.skill_id}
                    className="p-3 bg-surface-base border border-boundary-subtle rounded-md space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-content-primary">
                        {s.skill_name}
                      </span>
                      <Badge variant="muted">Level {s.min_proficiency}+</Badge>
                    </div>
                    <div className="text-[11px] text-content-muted">
                      Weight: {(s.weight * 100).toFixed(0)}% • Importance: Required
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-content-muted italic">No required competencies configured.</p>
            )}
          </div>

          {/* Preferred Skills */}
          {req?.preferred_skills && req.preferred_skills.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-content-muted uppercase">
                Preferred Competencies ({req.preferred_skills.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {req.preferred_skills.map((s) => (
                  <div
                    key={s.skill_id}
                    className="p-3 bg-surface-base border border-boundary-subtle rounded-md space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-content-primary">
                        {s.skill_name}
                      </span>
                      <Badge variant="outline">Level {s.min_proficiency}+</Badge>
                    </div>
                    <div className="text-[11px] text-content-muted">
                      Weight: {(s.weight * 100).toFixed(0)}% • Importance: Preferred
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Experience & Deterministic Weights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-boundary-subtle">
            <div>
              <h4 className="text-xs font-semibold text-content-muted uppercase mb-1">
                Minimum Tenure Benchmark
              </h4>
              <p className="text-sm font-semibold text-content-primary">
                {req?.min_years_experience || 0} Years Experience
              </p>
              <p className="text-xs text-content-muted mt-0.5">
                Compared directly with candidate verified career timeline.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-content-muted uppercase mb-1">
                Scoring Criterion Weights
              </h4>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 bg-surface-subtle border border-boundary-subtle rounded">
                  Required: {((req?.weights?.required_skills || 0.45) * 100).toFixed(0)}%
                </span>
                <span className="px-2 py-1 bg-surface-subtle border border-boundary-subtle rounded">
                  Preferred: {((req?.weights?.preferred_skills || 0.20) * 100).toFixed(0)}%
                </span>
                <span className="px-2 py-1 bg-surface-subtle border border-boundary-subtle rounded">
                  Evidence: {((req?.weights?.evidence_strength || 0.20) * 100).toFixed(0)}%
                </span>
                <span className="px-2 py-1 bg-surface-subtle border border-boundary-subtle rounded">
                  Tenure: {((req?.weights?.experience_alignment || 0.15) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
