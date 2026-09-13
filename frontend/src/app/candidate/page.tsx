"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  UserCheck,
  FileText,
  Shield,
  CheckCircle2,
  Clock,
  Calendar,
  Upload,
  ArrowRight,
  Briefcase,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { getMyApplicationsApi } from "@/lib/api/recruitment";
import { CandidateApplication } from "@/types/recruitment";

export default function CandidatePortalPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadApplications() {
      try {
        setIsLoading(true);
        const data = await getMyApplicationsApi();
        setApplications(data);
      } catch (err) {
        console.error("Failed to load candidate applications", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadApplications();
  }, []);

  return (
    <ProtectedRoute requiredCapability="portal.candidate.access">
      <div className="max-w-4xl mx-auto space-y-6 py-2">
        {/* Header */}
        <div className="border-b border-boundary-subtle pb-4 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-primary/10 text-xs font-semibold text-brand-primary mb-1">
            <UserCheck className="h-3.5 w-3.5" />
            <span>Candidate Journey</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-content-primary">
            Welcome, {user?.full_name || "Candidate"}
          </h1>
          <p className="text-xs text-content-secondary">
            Track your application status, interview schedules, and next steps in your hiring journey.
          </p>
        </div>

        {/* Primary Priority / Next Action Card */}
        {applications.length > 0 ? (
        <div className="bg-brand-primary/5 border border-brand-primary/30 rounded-xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary font-mono">
                  Current Application Status
                </span>
                <h2 className="text-base sm:text-lg font-bold text-content-primary">
                  {applications[0].job_title}: {applications[0].status || "Preboarding Active"}
                </h2>
                <p className="text-xs text-content-secondary">
                  {(applications[0].lifecycle_state === "preboarding_active" || applications[0].status === "Preboarding Active")
                    ? `Offer accepted for ${applications[0].job_title} (${applications[0].location}). Your personalized onboarding plan and hardware provisioning are in active review.`
                    : `Your application for ${applications[0].job_title} (${applications[0].location}) is progressing through the evidence evaluation pipeline.`}
                </p>
              </div>
              <Link href="/candidate#journey">
                <Button size="sm" className="whitespace-nowrap gap-1.5">
                  <span>{(applications[0].lifecycle_state === "preboarding_active" || applications[0].status === "Preboarding Active") ? "View Preboarding Steps" : "View Guidelines"}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-brand-primary/15 text-xs text-content-secondary">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-brand-primary" />
                <span>
                  {(applications[0].lifecycle_state === "preboarding_active" || applications[0].status === "Preboarding Active")
                    ? "Target Start Date: Oct 1, 2026"
                    : "Next Round: Technical Systems Discussion"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-brand-primary" />
                <span>
                  {(applications[0].lifecycle_state === "preboarding_active" || applications[0].status === "Preboarding Active")
                    ? "Preboarding Review: Manager In Review"
                    : "Format: 45 Min Architecture Review"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-brand-primary" />
                <span>
                  {(applications[0].lifecycle_state === "preboarding_active" || applications[0].status === "Preboarding Active")
                    ? "Offer Decision: Accepted (92% Score)"
                    : "Resume Evidence: Verified"}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-surface-secondary/60 border border-boundary-subtle rounded-xl p-5 sm:p-6 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-content-muted font-mono">
              Application Status
            </span>
            <h2 className="text-base sm:text-lg font-bold text-content-primary">
              No Active Requisitions in Progress
            </h2>
            <p className="text-xs text-content-secondary">
              You are signed in as an external candidate. Submissions made via corporate career portals will appear here once registered.
            </p>
          </div>
        )}

        {/* Applications Progress */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold font-display uppercase tracking-wider text-content-muted">
            My Applications
          </h2>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : applications.length === 0 ? (
            <Card className="p-8 text-center border border-boundary-subtle space-y-2">
              <Briefcase className="h-10 w-10 text-content-muted mx-auto" />
              <h3 className="text-sm font-bold text-content-primary">No Active Applications</h3>
              <p className="text-xs text-content-secondary max-w-sm mx-auto">
                You do not currently have any active applications under {user?.email}. Open positions will appear here once submitted.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <Card key={app.application_id} className="p-5 border border-boundary-subtle space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-boundary-subtle pb-3">
                    <div>
                      <h3 className="font-bold text-base text-content-primary">
                        {app.job_title}
                      </h3>
                      <p className="text-xs text-content-muted">
                        Location: {app.location} • Applied: {new Date(app.applied_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="success" size="sm" className="gap-1 font-semibold">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>{app.status || "In Review"}</span>
                      </Badge>
                    </div>
                  </div>

                  {/* Journey Progress Bar */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-content-muted uppercase tracking-wider">
                      Application Progression
                    </div>
                    <div className="grid grid-cols-5 gap-1.5 text-center text-[10px]">
                      <div className="p-1.5 rounded bg-status-success/15 border border-status-success/30 text-status-success font-semibold">
                        1. Submitted
                      </div>
                      <div className="p-1.5 rounded bg-status-success/15 border border-status-success/30 text-status-success font-semibold">
                        2. Verified
                      </div>
                      <div className="p-1.5 rounded bg-status-success/15 border border-status-success/30 text-status-success font-semibold">
                        3. Evaluated
                      </div>
                      <div className={`p-1.5 rounded font-bold ${
                        (app.lifecycle_state === "preboarding_active" || app.status === "Preboarding Active")
                          ? "bg-brand-primary/15 border border-brand-primary/30 text-brand-primary"
                          : "bg-status-success/15 border border-status-success/30 text-status-success"
                      }`}>
                        4. Offer Accepted
                      </div>
                      <div className={`p-1.5 rounded font-bold ${
                        (app.lifecycle_state === "preboarding_active" || app.status === "Preboarding Active")
                          ? "bg-brand-primary/15 border border-brand-primary/30 text-brand-primary animate-pulse"
                          : "bg-surface-secondary text-content-muted border border-boundary-subtle"
                      }`}>
                        5. Preboarding
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Candidate Profile & Documents */}
        <div id="interview-guide" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5 border border-boundary-subtle space-y-3">
            <h3 className="font-bold text-sm text-content-primary flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand-primary" />
              <span>Resume & Verified Documents</span>
            </h3>
            <p className="text-xs text-content-secondary leading-relaxed">
              Your resume evidence is locked for current review rounds. You can submit an updated version if your competencies or certifications have changed.
            </p>
            <div className="pt-1 flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Upload className="h-3.5 w-3.5" />
                <span>Upload Updated Resume</span>
              </Button>
            </div>
          </Card>

          <Card className="p-5 border border-boundary-subtle space-y-3">
            <h3 className="font-bold text-sm text-content-primary flex items-center gap-2">
              <Shield className="h-4 w-4 text-status-success" />
              <span>Candidate Privacy Guarantee</span>
            </h3>
            <p className="text-xs text-content-secondary leading-relaxed">
              WorkSense enforces strict privacy shielding. Internal recruiter notes, peer rankings, and administrative logs remain confidential and separated by Row-Level Security.
            </p>
            <div className="pt-1">
              <Link href="/my-access" className="text-xs text-brand-primary font-semibold hover:underline flex items-center gap-1">
                <span>View My Data Rights</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
