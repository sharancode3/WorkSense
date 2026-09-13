"use client";

import React from "react";
import Link from "next/link";
import { Briefcase, AlertTriangle, ShieldCheck, FileCheck, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";

export default function HrPortalPage() {
  const { user, activeOrg } = useAuth();

  return (
    <ProtectedRoute requiredCapability="portal.hr.access">
      <div className="max-w-4xl mx-auto space-y-6 py-4">
        {/* Header */}
        <div className="border-b border-boundary-subtle pb-4 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-primary/10 text-xs font-semibold text-brand-primary mb-1">
            <Briefcase className="h-3.5 w-3.5" />
            <span>HR Workforce Operations Foundation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-content-primary">
            People & Workforce Operations Workspace
          </h1>
          <p className="text-xs text-content-secondary">
            Organization: <span className="font-semibold text-content-primary">{activeOrg?.name}</span> | Strategic HR Partner: <span className="font-semibold text-content-primary">{user?.full_name}</span>
          </p>
        </div>

        {/* Access Scope Banner */}
        <div className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-3">
          <h2 className="text-sm font-bold font-display uppercase tracking-wider text-content-muted">
            Workforce Lifecycle Governance Scope
          </h2>
          <p className="text-xs text-content-secondary leading-relaxed">
            As an HR Business Partner, you oversee workforce risk governance, retention interventions, policy grounding, and lifecycle transitions. All high-stakes decisions require explicit human approvals and are logged to the immutable audit trail. Self-role modification and cross-organization access remain strictly prohibited.
          </p>
          <div className="flex flex-wrap gap-2 pt-1 text-xs">
            <span className="px-2.5 py-1 rounded bg-surface-secondary text-content-primary font-mono text-[11px] border border-boundary-subtle">
              Role: hr
            </span>
            <span className="px-2.5 py-1 rounded bg-surface-secondary text-content-primary font-mono text-[11px] border border-boundary-subtle">
              Scope: Workforce Risk & Lifecycle
            </span>
            <span className="px-2.5 py-1 rounded bg-surface-secondary text-content-primary font-mono text-[11px] border border-boundary-subtle">
              Audit Mandate: Full Append-Only Event Trail
            </span>
          </div>
        </div>

        {/* Workforce Data Modules (Stage 3 Live) */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold font-display uppercase tracking-wider text-content-muted">
            Workforce Governance Modules (Stage 3 Live)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/workforce/departments"
              className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-2 hover:border-brand-primary transition-colors block"
            >
              <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                <Briefcase className="h-4 w-4" />
                <span>Departments</span>
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Topological hierarchy, reporting units, and cycle prevention.
              </p>
            </Link>

            <Link
              href="/workforce/roles"
              className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-2 hover:border-brand-primary transition-colors block"
            >
              <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                <FileCheck className="h-4 w-4" />
                <span>Job Roles</span>
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Catalog definitions, skill requirements, and seniority levels.
              </p>
            </Link>

            <Link
              href="/workforce/policies"
              className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-2 hover:border-brand-primary transition-colors block"
            >
              <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                <ShieldCheck className="h-4 w-4" />
                <span>Policy Library</span>
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Version supersessions, revision audit ledger, and active policies.
              </p>
            </Link>

            <Link
              href="/workforce/data-quality"
              className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-2 hover:border-brand-primary transition-colors block"
            >
              <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>Data Quality</span>
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Automated rule audit engine and 1-click issue resolution console.
              </p>
            </Link>
          </div>
        </div>

        {/* Adaptive Onboarding (Stage 5 Live) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold font-display uppercase tracking-wider text-content-muted">
              Adaptive Onboarding Intelligence (Stage 5 Live)
            </h2>
            <Link href="/hr/onboarding/new">
              <Button size="sm" className="h-7 text-xs gap-1.5">
                <span>+ Initiate Onboarding</span>
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/hr/onboarding"
              className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-2 hover:border-brand-primary transition-colors block"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                  <Briefcase className="h-4 w-4" />
                  <span>HR Onboarding Command Center</span>
                </div>
                <ArrowRight className="h-4 w-4 text-content-muted" />
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Monitor multi-brain candidate journeys, approve HR review gates, unblock joiners, and dispatch to EnterPro.
              </p>
            </Link>

            <Link
              href="/hr/onboarding/new"
              className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-2 hover:border-brand-primary transition-colors block"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                  <FileCheck className="h-4 w-4" />
                  <span>Initiate New Joiner Onboarding</span>
                </div>
                <ArrowRight className="h-4 w-4 text-content-muted" />
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Convert offered candidates (e.g. Elena Rostova), run deterministic skill-gap analysis, and generate Plan v1.
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
