"use client";

import React from "react";
import Link from "next/link";
import { Users, CheckSquare, TrendingUp, ShieldCheck, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";

export default function ManagerPortalPage() {
  const { user, activeOrg } = useAuth();

  return (
    <ProtectedRoute requiredCapability="portal.manager.access">
      <div className="max-w-4xl mx-auto space-y-6 py-4">
        {/* Header */}
        <div className="border-b border-boundary-subtle pb-4 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-primary/10 text-xs font-semibold text-brand-primary mb-1">
            <Users className="h-3.5 w-3.5" />
            <span>Manager Team Workspace Foundation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-content-primary">
            Team Leadership Workspace
          </h1>
          <p className="text-xs text-content-secondary">
            Organization: <span className="font-semibold text-content-primary">{activeOrg?.name}</span> | Team Lead: <span className="font-semibold text-content-primary">{user?.full_name}</span>
          </p>
        </div>

        {/* Access Scope Banner */}
        <div className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-3">
          <h2 className="text-sm font-bold font-display uppercase tracking-wider text-content-muted">
            Relationship-Scoped Access Boundary
          </h2>
          <p className="text-xs text-content-secondary leading-relaxed">
            Manager authority is strictly scoped to assigned direct reports. You possess oversight over onboarding progress, skill validation, and approval workflows within your unit. You cannot view confidential HR compensation records, unassigned divisions, or system access administration.
          </p>
          <div className="flex flex-wrap gap-2 pt-1 text-xs">
            <span className="px-2.5 py-1 rounded bg-surface-secondary text-content-primary font-mono text-[11px] border border-boundary-subtle">
              Role: manager
            </span>
            <span className="px-2.5 py-1 rounded bg-surface-secondary text-content-primary font-mono text-[11px] border border-boundary-subtle">
              Scope: Assigned Direct Reports
            </span>
            <span className="px-2.5 py-1 rounded bg-surface-secondary text-content-primary font-mono text-[11px] border border-boundary-subtle">
              Enforcement: Relationship Data Validation
            </span>
          </div>
        </div>

        {/* Workforce Modules (Stage 3 Live) */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold font-display uppercase tracking-wider text-content-muted">
            Workforce Management (Stage 3 Live)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/workforce/employees"
              className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-2 hover:border-brand-primary transition-colors block"
            >
              <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                <Users className="h-4 w-4" />
                <span>Team & Employees</span>
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Browse active personnel, reporting hierarchy, and verified twins.
              </p>
            </Link>

            <Link
              href="/workforce/skills"
              className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-2 hover:border-brand-primary transition-colors block"
            >
              <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                <ShieldCheck className="h-4 w-4" />
                <span>Skills & Graph</span>
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Skill taxonomy, proficiency tiers, and relational graph edges.
              </p>
            </Link>

            <Link
              href="/workforce/policies"
              className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-2 hover:border-brand-primary transition-colors block"
            >
              <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                <CheckSquare className="h-4 w-4" />
                <span>Company Policies</span>
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Active governed policy documents, leave rules, and remote guidelines.
              </p>
            </Link>
          </div>
        </div>

        {/* Adaptive Onboarding (Stage 5 Live) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold font-display uppercase tracking-wider text-content-muted">
              Team Onboarding Oversight (Stage 5 Live)
            </h2>
            <Link href="/manager/onboarding">
              <Button size="sm" className="h-7 text-xs gap-1.5">
                <span>View Team Journeys</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          <Link
            href="/manager/onboarding"
            className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-2 hover:border-brand-primary transition-colors block"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                <Users className="h-4 w-4" />
                <span>Manager Onboarding & Review Workspace</span>
              </div>
              <ArrowRight className="h-4 w-4 text-content-muted" />
            </div>
            <p className="text-xs text-content-secondary leading-relaxed">
              Review new joiner onboarding plans, inject custom 1:1 and team integration milestones, approve review gates, and trigger controlled adaptive replanning for blocked milestones.
            </p>
          </Link>
        </div>

        {/* Roadmap Modules */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-2">
            <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
              <CheckSquare className="h-4 w-4" />
              <span>EnterPro Approvals (Stage 7)</span>
            </div>
            <p className="text-xs text-content-secondary leading-relaxed">
              Governed workflow approvals for internal team requisitions and mobility assignments.
            </p>
          </div>

          <div className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-2">
            <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
              <TrendingUp className="h-4 w-4" />
              <span>Performance Feedback (Stage 10)</span>
            </div>
            <p className="text-xs text-content-secondary leading-relaxed">
              Objective milestone evaluation and delivery artifact synthesis for direct reports.
            </p>
          </div>

          <div className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-2">
            <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
              <ShieldCheck className="h-4 w-4" />
              <span>Evidence Validation (Stage 3)</span>
            </div>
            <p className="text-xs text-content-secondary leading-relaxed">
              Verification of peer reviews and technical PR evidence commit to capability twins.
            </p>
          </div>
        </div>

        {/* Action Callout */}
        <div className="bg-surface-secondary rounded-xl border border-boundary-subtle p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold font-display text-content-primary">
              Access Governance Verified
            </h3>
            <p className="text-xs text-content-secondary mt-0.5">
              Review your relationship-scoped permissions and tenant boundaries.
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
