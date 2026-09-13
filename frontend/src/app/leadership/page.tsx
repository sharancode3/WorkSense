"use client";

import React from "react";
import Link from "next/link";
import { BarChart3, Cpu, PieChart, Shield, Building2, Users, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";

export default function LeadershipPortalPage() {
  const { user, activeOrg } = useAuth();

  return (
    <ProtectedRoute requiredCapability="portal.leadership.access">
      <div className="max-w-4xl mx-auto space-y-6 py-4">
        {/* Header */}
        <div className="border-b border-boundary-subtle pb-4 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-primary/10 text-xs font-semibold text-brand-primary mb-1">
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Leadership Decision Intelligence Foundation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-content-primary">
            Executive Decision Intelligence Console
          </h1>
          <p className="text-xs text-content-secondary">
            Organization: <span className="font-semibold text-content-primary">{activeOrg?.name}</span> | Executive Leader: <span className="font-semibold text-content-primary">{user?.full_name}</span>
          </p>
        </div>

        {/* Access Scope Banner */}
        <div className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-3">
          <h2 className="text-sm font-bold font-display uppercase tracking-wider text-content-muted">
            Aggregate-First Decision Boundary
          </h2>
          <p className="text-xs text-content-secondary leading-relaxed">
            Executive leadership access is designed to be aggregate-first. You view division-level capability trends, headcount allocation optimizations, and workforce risk patterns across the organization. Raw candidate resumes, ungrounded private feedback, and technical system secrets are withheld to preserve privacy and governance integrity.
          </p>
          <div className="flex flex-wrap gap-2 pt-1 text-xs">
            <span className="px-2.5 py-1 rounded bg-surface-secondary text-content-primary font-mono text-[11px] border border-boundary-subtle">
              Role: leadership
            </span>
            <span className="px-2.5 py-1 rounded bg-surface-secondary text-content-primary font-mono text-[11px] border border-boundary-subtle">
              Scope: Aggregate Organization Intelligence
            </span>
            <span className="px-2.5 py-1 rounded bg-surface-secondary text-content-primary font-mono text-[11px] border border-boundary-subtle">
              Privacy Standard: Individual Identifiers Masked by Default
            </span>
          </div>
        </div>

        {/* Workforce Overview (Stage 3 Live) */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold font-display uppercase tracking-wider text-content-muted">
            Workforce Structural Topology (Stage 3 Live)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/workforce/departments"
              className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-2 hover:border-brand-primary transition-colors block"
            >
              <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                <Building2 className="h-4 w-4" />
                <span>Department Topology</span>
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Organizational hierarchy, parent units, and structure breakdown.
              </p>
            </Link>

            <Link
              href="/workforce/employees"
              className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-2 hover:border-brand-primary transition-colors block"
            >
              <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                <Users className="h-4 w-4" />
                <span>Headcount & Roster</span>
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Active personnel distribution across departments and career bands.
              </p>
            </Link>

            <Link
              href="/workforce/data-quality"
              className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-2 hover:border-brand-primary transition-colors block"
            >
              <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>Data Health & Quality</span>
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Workforce layer integrity audit, orphaned entity detection, and health score.
              </p>
            </Link>
          </div>
        </div>

        {/* Roadmap Modules */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-2">
            <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
              <Cpu className="h-4 w-4" />
              <span>Workforce Decision Simulator (Stage 12)</span>
            </div>
            <p className="text-xs text-content-secondary leading-relaxed">
              Google OR-Tools CP-SAT discrete optimization for the 90-day AI Fraud Team requisition, evaluating cost vs ramp-time trade-offs.
            </p>
          </div>

          <div className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-2">
            <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
              <PieChart className="h-4 w-4" />
              <span>Executive Dashboard (Stage 13)</span>
            </div>
            <p className="text-xs text-content-secondary leading-relaxed">
              Cross-module workforce metrics combining recruitment velocities, skill coverage gaps, and retention hazard distributions.
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
              Review your authorized aggregate scopes within {activeOrg?.name}.
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
