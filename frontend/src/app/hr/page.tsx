"use client";

import React from "react";
import Link from "next/link";
import {
  Briefcase,
  AlertTriangle,
  ShieldCheck,
  FileCheck,
  ArrowRight,
  TrendingUp,
  UserCheck,
  BookOpen,
  Building2,
  Clock,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function HrPortalPage() {
  const { user, activeOrg } = useAuth();

  return (
    <ProtectedRoute requiredCapability="portal.hr.access">
      <div className="max-w-5xl mx-auto space-y-6 py-4">
        {/* Header */}
        <div className="border-b border-boundary-subtle pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-primary/10 text-xs font-semibold text-brand-primary">
              <Briefcase className="h-3.5 w-3.5" />
              <span>Workforce Operations & Governance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-content-primary">
              People Operations Hub
            </h1>
            <p className="text-xs text-content-secondary">
              Organization: <span className="font-semibold text-content-primary">{activeOrg?.name}</span> | Strategic HR Partner: <span className="font-semibold text-content-primary">{user?.full_name}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/hr/onboarding/new">
              <Button size="sm" className="gap-1.5 shadow-sm">
                <span>+ Initiate Onboarding</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Operational Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <Card className="p-4 border-boundary-subtle bg-surface">
            <div className="flex items-center justify-between text-content-muted mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wider">Active Workforce</span>
              <Building2 className="h-4 w-4 text-brand-primary" />
            </div>
            <div className="text-2xl font-bold font-display text-content-primary">142</div>
            <p className="text-[11px] text-content-secondary mt-0.5">Across 6 Departments</p>
          </Card>

          <Card className="p-4 border-boundary-subtle bg-surface">
            <div className="flex items-center justify-between text-content-muted mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wider">Active Onboarding</span>
              <UserCheck className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold font-display text-content-primary">3 Plans</div>
            <p className="text-[11px] text-content-secondary mt-0.5">1 Awaiting HR Sign-off</p>
          </Card>

          <Card className="p-4 border-boundary-subtle bg-surface">
            <div className="flex items-center justify-between text-content-muted mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wider">Data Quality</span>
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-display text-content-primary">98.5%</div>
            <p className="text-[11px] text-content-secondary mt-0.5">1 Minor Anomaly Flagged</p>
          </Card>

          <Card className="p-4 border-boundary-subtle bg-surface">
            <div className="flex items-center justify-between text-content-muted mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wider">Retention Health</span>
              <TrendingUp className="h-4 w-4 text-brand-primary" />
            </div>
            <div className="text-2xl font-bold font-display text-content-primary">94%</div>
            <p className="text-[11px] text-content-secondary mt-0.5">Low Hazard Baseline</p>
          </Card>
        </div>

        {/* Priority Action Card: Onboarding Gate & EnterPro Dispatch */}
        <Card className="p-5 border-boundary-subtle bg-surface-secondary/40 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 mt-0.5">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-content-primary">
                    HR Gate Sign-off Ready: Marcus Chen (Senior Distributed Systems Engineer)
                  </h2>
                  <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                    Manager Approved
                  </Badge>
                </div>
                <p className="text-xs text-content-secondary mt-1 max-w-2xl leading-relaxed">
                  Manager Alex Rivera has signed off on Marcus Chen&apos;s Day 30 milestones. Complete final HR review to dispatch automated IT asset and role permission provisioning to the EnterPro enterprise gateway.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link href="/hr/onboarding">
                <Button size="sm" variant="primary" className="whitespace-nowrap text-xs gap-1.5">
                  <span>Open Onboarding Hub</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Core People Operations Workspaces */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold font-display uppercase tracking-wider text-content-muted">
            Workforce Governance & Lifecycle Workspaces
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/hr/onboarding"
              className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-2 hover:border-brand-primary transition-colors block group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                  <UserCheck className="h-4 w-4" />
                  <span>Onboarding Command Center</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-content-muted group-hover:text-brand-primary transition-colors" />
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Supervise active multi-brain candidate journeys, resolve joiner blockers, and manage EnterPro dispatches.
              </p>
            </Link>

            <Link
              href="/workforce/intelligence"
              className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-2 hover:border-brand-primary transition-colors block group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                  <TrendingUp className="h-4 w-4" />
                  <span>Workforce Intelligence & Risk</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-content-muted group-hover:text-brand-primary transition-colors" />
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Track retention hazard trends, analyze policy grounding, and review internal mobility recommendations.
              </p>
            </Link>

            <Link
              href="/workforce/departments"
              className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-2 hover:border-brand-primary transition-colors block group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                  <Building2 className="h-4 w-4" />
                  <span>Department Topology</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-content-muted group-hover:text-brand-primary transition-colors" />
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Manage organizational hierarchy, parent units, reporting structures, and cycle validation.
              </p>
            </Link>

            <Link
              href="/workforce/roles"
              className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-2 hover:border-brand-primary transition-colors block group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                  <FileCheck className="h-4 w-4" />
                  <span>Job Role Catalog</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-content-muted group-hover:text-brand-primary transition-colors" />
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Define job families, competency matrices, seniority expectations, and canonical skill profiles.
              </p>
            </Link>

            <Link
              href="/workforce/policies"
              className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-2 hover:border-brand-primary transition-colors block group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                  <BookOpen className="h-4 w-4" />
                  <span>Policy Governance</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-content-muted group-hover:text-brand-primary transition-colors" />
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Maintain governed policy documents, active revisions, version supersessions, and compliance rules.
              </p>
            </Link>

            <Link
              href="/workforce/data-quality"
              className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-2 hover:border-brand-primary transition-colors block group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Data Quality Console</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-content-muted group-hover:text-brand-primary transition-colors" />
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Run automated integrity checks, isolate orphaned entities, and execute one-click anomaly repairs.
              </p>
            </Link>
          </div>
        </div>

        {/* HR Governance Mandate Guarantee */}
        <div className="bg-surface rounded-xl border border-boundary-subtle p-4 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-brand-primary shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h3 className="font-bold text-content-primary">
              Human Accountability & Recorded Decision History Mandate
            </h3>
            <p className="text-content-secondary leading-relaxed">
              In accordance with WorkSense enterprise safeguards, all high-stakes personnel decisions (offers, onboarding gate approvals, role reassignments, and policy modifications) require verified human sign-offs and are permanently recorded in the append-oriented audit history.
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
