"use client";

import React from "react";
import Link from "next/link";
import { UserSearch, Layers, UserPlus, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";

export default function RecruiterPortalPage() {
  const { user, activeOrg } = useAuth();

  return (
    <ProtectedRoute requiredCapability="portal.recruiter.access">
      <div className="max-w-4xl mx-auto space-y-6 py-4">
        {/* Header */}
        <div className="border-b border-boundary-subtle pb-4 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-primary/10 text-xs font-semibold text-brand-primary mb-1">
            <UserSearch className="h-3.5 w-3.5" />
            <span>Recruiter Talent Intelligence Foundation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-content-primary">
            Talent Acquisition Workspace
          </h1>
          <p className="text-xs text-content-secondary">
            Organization: <span className="font-semibold text-content-primary">{activeOrg?.name}</span> | Technical Recruiter: <span className="font-semibold text-content-primary">{user?.full_name}</span>
          </p>
        </div>

        {/* Access Scope Banner */}
        <div className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-3">
          <h2 className="text-sm font-bold font-display uppercase tracking-wider text-content-muted">
            Talent Pipeline Access Boundary
          </h2>
          <p className="text-xs text-content-secondary leading-relaxed">
            Recruiter access is tailored to candidate evaluation, interview rubrics, and requisition matching. You do not possess access to internal employee attrition hazard metrics, confidential peer performance reviews, compensation datasets, or platform administration.
          </p>
          <div className="flex flex-wrap gap-2 pt-1 text-xs">
            <span className="px-2.5 py-1 rounded bg-surface-secondary text-content-primary font-mono text-[11px] border border-boundary-subtle">
              Role: recruiter
            </span>
            <span className="px-2.5 py-1 rounded bg-surface-secondary text-content-primary font-mono text-[11px] border border-boundary-subtle">
              Scope: Candidate Pipeline & Requisitions
            </span>
            <span className="px-2.5 py-1 rounded bg-surface-secondary text-content-primary font-mono text-[11px] border border-boundary-subtle">
              Confidentiality: Strict HR Data Separation
            </span>
          </div>
        </div>

        {/* Stage 4 Recruitment & Interview Intelligence (Live) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold font-display uppercase tracking-wider text-content-muted">
              Recruitment & Interview Intelligence (Stage 4 Live)
            </h2>
            <span className="text-[11px] font-semibold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded">
              Zero Score Fabrication
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/recruitment/jobs"
              className="bg-surface rounded-xl border border-boundary-subtle p-4 space-y-2 hover:border-brand-primary transition-colors block"
            >
              <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                <Layers className="h-4 w-4" />
                <span>Job Requisitions</span>
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Active job requisitions, quality audit bias checks, and versioned competency weights.
              </p>
            </Link>

            <Link
              href="/recruitment/jobs/new"
              className="bg-surface rounded-xl border border-boundary-subtle p-4 space-y-2 hover:border-brand-primary transition-colors block"
            >
              <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                <UserPlus className="h-4 w-4" />
                <span>New Requisition Wizard</span>
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Create requisition with real-time bias detection and deterministic weight validator.
              </p>
            </Link>

            <Link
              href="/recruitment/jobs/40000000-0000-0000-0000-000000000001/ranking"
              className="bg-surface rounded-xl border border-boundary-subtle p-4 space-y-2 hover:border-brand-primary transition-colors block"
            >
              <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                <UserSearch className="h-4 w-4" />
                <span>Match Rankings</span>
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Transparent 0-100 deterministic scoring, blind review mode, and comparison drawer.
              </p>
            </Link>

            <Link
              href="/recruitment/interviews/50000000-0000-0000-0000-000000000001/kit"
              className="bg-surface rounded-xl border border-boundary-subtle p-4 space-y-2 hover:border-brand-primary transition-colors block"
            >
              <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                <Layers className="h-4 w-4" />
                <span>Interview Kits</span>
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Role-calibrated 5-tier observable rubrics and live response recording runner.
              </p>
            </Link>
          </div>
        </div>

        {/* Workforce Data Modules (Stage 3 Live) */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold font-display uppercase tracking-wider text-content-muted">
            Talent Pipeline Modules (Stage 3 Live)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/workforce/candidates"
              className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-2 hover:border-brand-primary transition-colors block"
            >
              <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                <UserSearch className="h-4 w-4" />
                <span>Candidate Twins</span>
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Candidate Digital Twins, verified skill evidence items, and completeness scores.
              </p>
            </Link>

            <Link
              href="/workforce/roles"
              className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-2 hover:border-brand-primary transition-colors block"
            >
              <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                <Layers className="h-4 w-4" />
                <span>Job Role Catalog</span>
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Requisition requirements, target competencies, and proficiency baselines.
              </p>
            </Link>

            <Link
              href="/workforce/candidates"
              className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-2 hover:border-brand-primary transition-colors block"
            >
              <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                <UserPlus className="h-4 w-4" />
                <span>Idempotent Conversion</span>
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Atomic candidate-to-employee transition carrying forward verified evidence.
              </p>
            </Link>
          </div>
        </div>

        {/* Action Callout */}
        <div className="bg-surface-secondary rounded-xl border border-boundary-subtle p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold font-display text-content-primary">
              Access Governance Verified
            </h3>
            <p className="text-xs text-content-secondary mt-0.5">
              Review your authorized capabilities within {activeOrg?.name}.
            </p>
          </div>
          <Link href="/my-access">
            <Button variant="outline" size="sm" className="gap-1.5">
              <span>View My Permissions</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  );
}
