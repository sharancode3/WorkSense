"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  CheckSquare,
  ShieldCheck,
  ArrowRight,
  Clock,
  AlertCircle,
  Network,
  BookOpen,
  UserCheck,
  Award,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ManagerPortalPage() {
  const { user, activeOrg } = useAuth();

  return (
    <ProtectedRoute requiredCapability="portal.manager.access">
      <div className="max-w-5xl mx-auto space-y-6 py-4">
        {/* Header */}
        <div className="border-b border-boundary-subtle pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-primary/10 text-xs font-semibold text-brand-primary">
              <Users className="h-3.5 w-3.5" />
              <span>Team Leadership Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-content-primary">
              Engineering Team Hub
            </h1>
            <p className="text-xs text-content-secondary">
              Organization: <span className="font-semibold text-content-primary">{activeOrg?.name}</span> | Team Lead: <span className="font-semibold text-content-primary">{user?.full_name}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/manager/onboarding">
              <Button size="sm" className="gap-1.5 shadow-sm">
                <span>Manage Onboarding</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Operational Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <Card className="p-4 border-boundary-subtle bg-surface">
            <div className="flex items-center justify-between text-content-muted mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wider">Direct Reports</span>
              <Users className="h-4 w-4 text-brand-primary" />
            </div>
            <div className="text-2xl font-bold font-display text-content-primary">6</div>
            <p className="text-[11px] text-content-secondary mt-0.5">Assigned Engineers</p>
          </Card>

          <Card className="p-4 border-boundary-subtle bg-surface">
            <div className="flex items-center justify-between text-content-muted mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wider">Pending Gates</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold font-display text-content-primary">1 Review</div>
            <p className="text-[11px] text-content-secondary mt-0.5">Day 30 Gate Pending</p>
          </Card>

          <Card className="p-4 border-boundary-subtle bg-surface">
            <div className="flex items-center justify-between text-content-muted mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wider">Skill Coverage</span>
              <Award className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-display text-content-primary">88%</div>
            <p className="text-[11px] text-content-secondary mt-0.5">Benchmark Target Match</p>
          </Card>

          <Card className="p-4 border-boundary-subtle bg-surface">
            <div className="flex items-center justify-between text-content-muted mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wider">Active Onboarding</span>
              <UserCheck className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold font-display text-content-primary">1 Joiner</div>
            <p className="text-[11px] text-content-secondary mt-0.5">Marcus Chen (Day 32)</p>
          </Card>
        </div>

        {/* Priority Action Card: Manager Gate Approval */}
        <Card className="p-5 border-boundary-subtle bg-surface-secondary/40 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 mt-0.5">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-content-primary">
                    Action Required: Marcus Chen — Day 30 Onboarding Gate Review
                  </h2>
                  <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                    Awaiting Approval
                  </Badge>
                </div>
                <p className="text-xs text-content-secondary mt-1 max-w-2xl leading-relaxed">
                  Marcus Chen has submitted proof of completion for the Core Pipeline Architecture and Local Dev Harness milestones. As hiring manager, review the PR evidence and sign off to advance Marcus to the next operational phase.
                </p>
              </div>
            </div>

            <Link href="/manager/onboarding">
              <Button size="sm" variant="primary" className="whitespace-nowrap text-xs gap-1.5">
                <span>Review & Sign Off</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* Direct Reports Overview */}
        <Card className="p-5 border-boundary-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-boundary-subtle pb-3">
            <div>
              <h2 className="text-sm font-bold text-content-primary">
                Direct Reports Roster
              </h2>
              <p className="text-xs text-content-muted">
                Authorized within your engineering reporting hierarchy.
              </p>
            </div>
            <Link href="/workforce/employees">
              <Button variant="outline" size="sm" className="text-xs gap-1">
                <span>Full Team Directory</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>

          <div className="divide-y divide-boundary-subtle">
            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-brand-primary/10 flex items-center justify-center font-bold text-xs text-brand-primary">
                  MC
                </div>
                <div>
                  <div className="text-xs font-bold text-content-primary">Marcus Chen</div>
                  <div className="text-[11px] text-content-muted">Senior Distributed Systems Engineer • Onboarding (Day 32)</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                  Gate Review Ready
                </Badge>
                <Link href="/manager/onboarding">
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    Inspect
                  </Button>
                </Link>
              </div>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center font-bold text-xs text-emerald-600">
                  DK
                </div>
                <div>
                  <div className="text-xs font-bold text-content-primary">David Kim</div>
                  <div className="text-[11px] text-content-muted">Staff Platform Architect • Active Full-Time</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-200">
                  Optimal Delivery
                </Badge>
              </div>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center font-bold text-xs text-purple-600">
                  PP
                </div>
                <div>
                  <div className="text-xs font-bold text-content-primary">Priya Patel</div>
                  <div className="text-[11px] text-content-muted">Senior Site Reliability Engineer • Active Full-Time</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-200">
                  Optimal Delivery
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Manager Workspaces */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold font-display uppercase tracking-wider text-content-muted">
            Management Workspaces & Capabilities
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/manager/onboarding"
              className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-2 hover:border-brand-primary transition-colors block group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                  <CheckSquare className="h-4 w-4" />
                  <span>Onboarding Review</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-content-muted group-hover:text-brand-primary transition-colors" />
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Approve milestone gates, inject customized team tasks, and resolve new joiner blockers.
              </p>
            </Link>

            <Link
              href="/workforce/skills"
              className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-2 hover:border-brand-primary transition-colors block group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                  <Network className="h-4 w-4" />
                  <span>Team Skill Graph</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-content-muted group-hover:text-brand-primary transition-colors" />
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Evaluate proficiency coverage against requisition benchmarks and identify upskilling targets.
              </p>
            </Link>

            <Link
              href="/workforce/policies"
              className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-2 hover:border-brand-primary transition-colors block group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                  <BookOpen className="h-4 w-4" />
                  <span>Governed Policies</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-content-muted group-hover:text-brand-primary transition-colors" />
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Review active leave, remote work guidelines, and organizational policy supersessions.
              </p>
            </Link>
          </div>
        </div>

        {/* Manager Authority Boundary */}
        <div className="bg-surface rounded-xl border border-boundary-subtle p-4 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-brand-primary shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h3 className="font-bold text-content-primary">
              Relationship-Scoped Governance & Confidentiality
            </h3>
            <p className="text-content-secondary leading-relaxed">
              Manager oversight is automatically constrained to assigned direct reports. Access to executive compensation formulas, unassigned departments, and administrative system settings is restricted by design to protect enterprise governance.
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
