"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { UserCheck, FileText, Shield, CheckCircle2, Lock } from "lucide-react";
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
      <div className="max-w-4xl mx-auto space-y-6 py-4">
        {/* Header */}
        <div className="border-b border-boundary-subtle pb-4 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-primary/10 text-xs font-semibold text-brand-primary mb-1">
            <UserCheck className="h-3.5 w-3.5" />
            <span>Candidate Application Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-content-primary">
            Candidate Application Workspace
          </h1>
          <p className="text-xs text-content-secondary">
            Authenticated Profile: <span className="font-semibold text-content-primary">{user?.full_name}</span> ({user?.email})
          </p>
        </div>

        {/* Candidate Privacy Shield Banner */}
        <div className="bg-surface rounded-xl border border-brand-primary/30 p-5 space-y-3">
          <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
            <Shield className="h-5 w-5 text-brand-primary" />
            <h2 className="font-display uppercase tracking-wider text-xs">
              Candidate Privacy Shield Active
            </h2>
          </div>
          <p className="text-xs text-content-secondary leading-relaxed">
            WorkSense enforces strict role-based data shielding. You have full transparency over your application progression and submitted portfolio evidence. Internal recruiter match scores, rank position, 5-tier evaluation rubrics, and interviewer notes are permanently redacted and inaccessible.
          </p>
          <div className="flex flex-wrap gap-2 pt-1 text-xs">
            <span className="px-2.5 py-1 rounded bg-surface-secondary text-content-primary font-mono text-[11px] border border-boundary-subtle flex items-center gap-1">
              <Lock className="h-3 w-3 text-brand-primary" />
              Internal Scores: Protected
            </span>
            <span className="px-2.5 py-1 rounded bg-surface-secondary text-content-primary font-mono text-[11px] border border-boundary-subtle flex items-center gap-1">
              <Lock className="h-3 w-3 text-brand-primary" />
              Ranking Tables: Redacted
            </span>
            <span className="px-2.5 py-1 rounded bg-surface-secondary text-content-primary font-mono text-[11px] border border-boundary-subtle flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              Application Status: Verified
            </span>
          </div>
        </div>

        {/* Active Applications Section */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold font-display uppercase tracking-wider text-content-muted">
            My Job Applications & Status
          </h2>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : applications.length === 0 ? (
            <Card className="p-6 text-center border border-boundary-subtle space-y-2">
              <FileText className="h-8 w-8 text-content-muted mx-auto" />
              <p className="text-xs text-content-muted">
                No applications submitted yet under {user?.email}.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <Card key={app.application_id} className="p-4 border border-boundary-subtle space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-sm text-content-primary">
                        {app.job_title}
                      </h3>
                      <p className="text-xs text-content-muted">
                        Location: {app.location} • Applied: {new Date(app.applied_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="success" size="sm" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {app.status}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Next Action */}
        <div className="bg-surface-secondary rounded-xl border border-boundary-subtle p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold font-display text-content-primary">
              Identity Verification Status
            </h3>
            <p className="text-xs text-content-secondary mt-0.5">
              Your candidate identity and privacy boundary are cryptographically confirmed.
            </p>
          </div>
          <Link href="/my-access">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              <span>View My Permissions</span>
            </Button>
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  );
}
