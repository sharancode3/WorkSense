"use client";

import React from "react";
import Link from "next/link";
import {
  UserSearch,
  Layers,
  UserPlus,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Briefcase,
  ShieldCheck,
  FileSpreadsheet,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function RecruiterPortalPage() {
  const { user, activeOrg } = useAuth();

  return (
    <ProtectedRoute requiredCapability="portal.recruiter.access">
      <div className="max-w-5xl mx-auto space-y-6 py-4">
        {/* Header */}
        <div className="border-b border-boundary-subtle pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-primary/10 text-xs font-semibold text-brand-primary">
              <UserSearch className="h-3.5 w-3.5" />
              <span>Talent Acquisition Command Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-content-primary">
              Recruitment Workspace
            </h1>
            <p className="text-xs text-content-secondary">
              Organization: <span className="font-semibold text-content-primary">{activeOrg?.name}</span> | Technical Recruiter: <span className="font-semibold text-content-primary">{user?.full_name}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/recruitment/jobs/new">
              <Button size="sm" className="gap-1.5 shadow-sm">
                <UserPlus className="h-3.5 w-3.5" />
                <span>New Requisition</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Operational Pipeline Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <Card className="p-4 border-boundary-subtle bg-surface">
            <div className="flex items-center justify-between text-content-muted mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wider">Active Requisitions</span>
              <Layers className="h-4 w-4 text-brand-primary" />
            </div>
            <div className="text-2xl font-bold font-display text-content-primary">4</div>
            <p className="text-[11px] text-content-secondary mt-0.5">Open Engineering Roles</p>
          </Card>

          <Card className="p-4 border-boundary-subtle bg-surface">
            <div className="flex items-center justify-between text-content-muted mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wider">Candidates in Pipeline</span>
              <UserSearch className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold font-display text-content-primary">18</div>
            <p className="text-[11px] text-content-secondary mt-0.5">Verified Digital Twins</p>
          </Card>

          <Card className="p-4 border-boundary-subtle bg-surface">
            <div className="flex items-center justify-between text-content-muted mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wider">Pending Decisions</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold font-display text-content-primary">1</div>
            <p className="text-[11px] text-content-secondary mt-0.5">Elena Rostova (Ready)</p>
          </Card>

          <Card className="p-4 border-boundary-subtle bg-surface">
            <div className="flex items-center justify-between text-content-muted mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wider">Avg Match Confidence</span>
              <Sparkles className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-display text-content-primary">82%</div>
            <p className="text-[11px] text-content-secondary mt-0.5">Deterministic Evidence Score</p>
          </Card>
        </div>

        {/* Priority Action Card: Elena Rostova Candidate Evaluation */}
        <Card className="p-5 border-boundary-subtle bg-surface-secondary/40 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 mt-0.5">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-content-primary">
                    Interview Synthesis Ready: Elena Rostova
                  </h2>
                  <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                    84.5% Match Score
                  </Badge>
                </div>
                <p className="text-xs text-content-secondary mt-1 max-w-2xl leading-relaxed">
                  Candidate for <span className="font-semibold text-content-primary">Senior Distributed Systems Engineer</span>. The structured technical architecture interview has concluded with positive evidence across Consensus Protocols and High-Throughput Pipelines. Review rubric breakdown and commit human hiring recommendation.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link href="/recruitment/interviews/50000000-0000-0000-0000-000000000001/insights">
                <Button size="sm" variant="primary" className="whitespace-nowrap text-xs gap-1.5">
                  <span>View Evidence Insights</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Active Job Requisitions List */}
        <Card className="p-5 border-boundary-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-boundary-subtle pb-3">
            <div>
              <h2 className="text-sm font-bold text-content-primary">
                Active Job Requisitions
              </h2>
              <p className="text-xs text-content-muted">
                Governed requisitions with deterministic evidence scoring enabled.
              </p>
            </div>
            <Link href="/recruitment/jobs">
              <Button variant="outline" size="sm" className="text-xs gap-1">
                <span>View All Jobs</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>

          <div className="divide-y divide-boundary-subtle">
            <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-content-primary">Senior Distributed Systems Engineer</span>
                  <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                    Active Hiring
                  </Badge>
                </div>
                <div className="text-[11px] text-content-muted mt-0.5">
                  Engineering Department • Requisition REQ-2026-001 • 4 Candidates Ranked
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/recruitment/jobs/40000000-0000-0000-0000-000000000001/ranking">
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                    <UserSearch className="h-3.5 w-3.5" />
                    <span>Candidate Rankings</span>
                  </Button>
                </Link>
                <Link href="/recruitment/jobs/40000000-0000-0000-0000-000000000001/upload">
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    + Upload Resumes
                  </Button>
                </Link>
              </div>
            </div>

            <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-content-primary">Staff Cloud Security Architect</span>
                  <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                    Sourcing
                  </Badge>
                </div>
                <div className="text-[11px] text-content-muted mt-0.5">
                  Security Operations • Requisition REQ-2026-004 • 2 Candidates Ranked
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/recruitment/jobs">
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    View Requisition
                  </Button>
                </Link>
              </div>
            </div>

            <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-content-primary">Senior Frontend Engineer (Next.js)</span>
                  <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                    Sourcing
                  </Badge>
                </div>
                <div className="text-[11px] text-content-muted mt-0.5">
                  Product Engineering • Requisition REQ-2026-007 • 6 Candidates Ranked
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/recruitment/jobs">
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    View Requisition
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>

        {/* Talent Tools */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold font-display uppercase tracking-wider text-content-muted">
            Recruitment Intelligence Workspaces
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/recruitment/jobs"
              className="bg-surface rounded-xl border border-boundary-subtle p-4 space-y-2 hover:border-brand-primary transition-colors block group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                  <Layers className="h-4 w-4" />
                  <span>Job Requisitions</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-content-muted group-hover:text-brand-primary transition-colors" />
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Configure job requirements, set canonical competency weights, and review bias audits.
              </p>
            </Link>

            <Link
              href="/recruitment/jobs/40000000-0000-0000-0000-000000000001/ranking"
              className="bg-surface rounded-xl border border-boundary-subtle p-4 space-y-2 hover:border-brand-primary transition-colors block group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                  <UserSearch className="h-4 w-4" />
                  <span>Candidate Rankings</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-content-muted group-hover:text-brand-primary transition-colors" />
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Inspect transparent 0–100 deterministic scoring, side-by-side comparisons, and evidence.
              </p>
            </Link>

            <Link
              href="/recruitment/interviews/50000000-0000-0000-0000-000000000001/kit"
              className="bg-surface rounded-xl border border-boundary-subtle p-4 space-y-2 hover:border-brand-primary transition-colors block group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                  <Briefcase className="h-4 w-4" />
                  <span>Interview Kits</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-content-muted group-hover:text-brand-primary transition-colors" />
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Launch calibrated rubrics, record live candidate responses, and synthesize evidence.
              </p>
            </Link>

            <Link
              href="/workforce/candidates"
              className="bg-surface rounded-xl border border-boundary-subtle p-4 space-y-2 hover:border-brand-primary transition-colors block group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Candidate Twins</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-content-muted group-hover:text-brand-primary transition-colors" />
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Browse verified skill evidence ledgers, extraction confidence scores, and profile completeness.
              </p>
            </Link>
          </div>
        </div>

        {/* Recruiter Privacy Scope Guarantee */}
        <div className="bg-surface rounded-xl border border-boundary-subtle p-4 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-brand-primary shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h3 className="font-bold text-content-primary">
              Talent Pipeline Access Boundary & Compliance
            </h3>
            <p className="text-content-secondary leading-relaxed">
              Recruiter authority covers active candidates, job specifications, and interview rubrics. To protect internal employee trust, individual employee attrition risk metrics, peer performance appraisals, and enterprise administrative settings are strictly withheld.
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
