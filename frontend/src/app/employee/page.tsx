"use client";

import React from "react";
import Link from "next/link";
import { User, BookOpen, Target, Network, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";

export default function EmployeePortalPage() {
  const { user, activeOrg } = useAuth();

  return (
    <ProtectedRoute requiredCapability="portal.employee.access">
      <div className="max-w-4xl mx-auto space-y-6 py-4">
        {/* Header */}
        <div className="border-b border-boundary-subtle pb-4 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-primary/10 text-xs font-semibold text-brand-primary mb-1">
            <User className="h-3.5 w-3.5" />
            <span>Employee Self-Service Foundation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-content-primary">
            Employee Workspace
          </h1>
          <p className="text-xs text-content-secondary">
            Active Organization: <span className="font-semibold text-content-primary">{activeOrg?.name}</span> | Workforce Member: <span className="font-semibold text-content-primary">{user?.full_name}</span>
          </p>
        </div>

        {/* Access Scope Banner */}
        <div className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-3">
          <h2 className="text-sm font-bold font-display uppercase tracking-wider text-content-muted">
            Current Access Scope & Identity Boundary
          </h2>
          <p className="text-xs text-content-secondary leading-relaxed">
            As an active workforce member, you have access to your personal Employee Digital Twin, longitudinal capability growth records, and internal policy reasoning. You cannot view confidential records of peers, organization-wide attrition hazard predictions, or access administration.
          </p>
          <div className="flex flex-wrap gap-2 pt-1 text-xs">
            <span className="px-2.5 py-1 rounded bg-surface-secondary text-content-primary font-mono text-[11px] border border-boundary-subtle">
              Role: employee
            </span>
            <span className="px-2.5 py-1 rounded bg-surface-secondary text-content-primary font-mono text-[11px] border border-boundary-subtle">
              Scope: Self-Service Only
            </span>
            <span className="px-2.5 py-1 rounded bg-surface-secondary text-content-primary font-mono text-[11px] border border-boundary-subtle">
              Tenant: {activeOrg?.slug}
            </span>
          </div>
        </div>

        {/* Stage 3 Workforce Foundation Navigation */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold font-display uppercase tracking-wider text-content-muted">
            Workforce Foundation Modules (Stage 3 Live)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/workforce/skills"
              className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-2 hover:border-brand-primary transition-colors block"
            >
              <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                <Network className="h-4 w-4" />
                <span>Skill Taxonomy & Graph</span>
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Relational graph, capability taxonomy, and alias resolution.
              </p>
            </Link>

            <Link
              href="/workforce/policies"
              className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-2 hover:border-brand-primary transition-colors block"
            >
              <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                <BookOpen className="h-4 w-4" />
                <span>Policy Governance</span>
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Audited policy library, active revisions, and version supersessions.
              </p>
            </Link>

            <Link
              href="/workforce/employees"
              className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-2 hover:border-brand-primary transition-colors block"
            >
              <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                <Target className="h-4 w-4" />
                <span>Employee Directory</span>
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Team reporting lines, temporal twins, and performance goals.
              </p>
            </Link>
          </div>
        </div>

        {/* Adaptive Onboarding (Stage 5 Live) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold font-display uppercase tracking-wider text-content-muted">
              Adaptive Onboarding Journey (Stage 5 Live)
            </h2>
            <Link href="/onboarding">
              <Button size="sm" className="h-7 text-xs gap-1.5">
                <span>Open Journey</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          <Link
            href="/onboarding"
            className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-2 hover:border-brand-primary transition-colors block"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                <Target className="h-4 w-4" />
                <span>My Adaptive Onboarding Journey</span>
              </div>
              <ArrowRight className="h-4 w-4 text-content-muted" />
            </div>
            <p className="text-xs text-content-secondary leading-relaxed">
              Track your day-by-day onboarding milestones, complete compliance and IT setup tasks, access personalized learning curricula, and report blockers directly to your manager.
            </p>
          </Link>
        </div>

        {/* Actions */}
        <div className="bg-surface-secondary rounded-xl border border-boundary-subtle p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold font-display text-content-primary">
              Identity Verification Status
            </h3>
            <p className="text-xs text-content-secondary mt-0.5">
              Active tenant membership confirmed.
            </p>
          </div>
          <Link href="/my-access">
            <Button variant="outline" size="sm" className="gap-1.5">
              <span>View Access Details</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  );
}
