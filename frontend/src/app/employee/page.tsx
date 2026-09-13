"use client";

import React from "react";
import Link from "next/link";
import {
  User,
  BookOpen,
  Target,
  Network,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function EmployeePortalPage() {
  const { user, activeOrg } = useAuth();

  return (
    <ProtectedRoute requiredCapability="portal.employee.access">
      <div className="max-w-5xl mx-auto space-y-6 py-4">
        {/* Header */}
        <div className="border-b border-boundary-subtle pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-primary/10 text-xs font-semibold text-brand-primary">
              <User className="h-3.5 w-3.5" />
              <span>Employee Action Center</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-content-primary">
              Welcome back, {user?.full_name || "Colleague"}
            </h1>
            <p className="text-xs text-content-secondary">
              Organization: <span className="font-semibold text-content-primary">{activeOrg?.name}</span> | Workspace Member: <span className="font-semibold text-content-primary">{user?.email}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/onboarding">
              <Button size="sm" className="gap-1.5 shadow-sm">
                <span>Resume My Journey</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Snapshot Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <Card className="p-4 border-boundary-subtle bg-surface">
            <div className="flex items-center justify-between text-content-muted mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wider">Journey Progress</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-display text-content-primary">75%</div>
            <p className="text-[11px] text-content-secondary mt-0.5">Day 45 of 90 Milestones</p>
          </Card>

          <Card className="p-4 border-boundary-subtle bg-surface">
            <div className="flex items-center justify-between text-content-muted mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wider">Pending Action</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold font-display text-content-primary">1 Task</div>
            <p className="text-[11px] text-content-secondary mt-0.5">Compliance Sign-off Due</p>
          </Card>

          <Card className="p-4 border-boundary-subtle bg-surface">
            <div className="flex items-center justify-between text-content-muted mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wider">Verified Skills</span>
              <Sparkles className="h-4 w-4 text-brand-primary" />
            </div>
            <div className="text-2xl font-bold font-display text-content-primary">8 Skills</div>
            <p className="text-[11px] text-content-secondary mt-0.5">Validated on Twin</p>
          </Card>

          <Card className="p-4 border-boundary-subtle bg-surface">
            <div className="flex items-center justify-between text-content-muted mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wider">Company Policies</span>
              <BookOpen className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold font-display text-content-primary">100%</div>
            <p className="text-[11px] text-content-secondary mt-0.5">Handbook Acknowledged</p>
          </Card>
        </div>

        {/* Priority Action Card */}
        <Card className="p-5 border-boundary-subtle bg-surface-secondary/40 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary mt-0.5">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-content-primary">
                    Next Recommended Milestone: Security & Operational Compliance
                  </h2>
                  <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                    Action Required
                  </Badge>
                </div>
                <p className="text-xs text-content-secondary mt-1 max-w-2xl leading-relaxed">
                  Review the updated enterprise remote access and incident reporting protocols. Once confirmed, this milestone will update your verified digital twin and unlock team deployment credentials.
                </p>
              </div>
            </div>

            <Link href="/onboarding">
              <Button size="sm" variant="primary" className="whitespace-nowrap text-xs gap-1.5">
                <span>Complete Task</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* Core Workspaces Grid */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold font-display uppercase tracking-wider text-content-muted">
            Personal Workspaces & Resources
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/onboarding"
              className="bg-surface rounded-xl border border-boundary-subtle p-4 space-y-2 hover:border-brand-primary transition-colors block group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                  <Target className="h-4 w-4" />
                  <span>My Journey</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-content-muted group-hover:text-brand-primary transition-colors" />
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Track your active onboarding roadmaps, learning curricula, and milestone sign-offs.
              </p>
            </Link>

            <Link
              href="/workforce/skills"
              className="bg-surface rounded-xl border border-boundary-subtle p-4 space-y-2 hover:border-brand-primary transition-colors block group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                  <Network className="h-4 w-4" />
                  <span>Skill Graph</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-content-muted group-hover:text-brand-primary transition-colors" />
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Explore canonical skills, capability relationships, and your career development pathways.
              </p>
            </Link>

            <Link
              href="/workforce/policies"
              className="bg-surface rounded-xl border border-boundary-subtle p-4 space-y-2 hover:border-brand-primary transition-colors block group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                  <BookOpen className="h-4 w-4" />
                  <span>Policy Assistant</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-content-muted group-hover:text-brand-primary transition-colors" />
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Consult the governed handbook on leave policies, expense guidelines, and benefits.
              </p>
            </Link>

            <Link
              href="/workforce/employees"
              className="bg-surface rounded-xl border border-boundary-subtle p-4 space-y-2 hover:border-brand-primary transition-colors block group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                  <User className="h-4 w-4" />
                  <span>Team Directory</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-content-muted group-hover:text-brand-primary transition-colors" />
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Look up teammates, functional disciplines, and organizational reporting lines.
              </p>
            </Link>
          </div>
        </div>

        {/* Personal Privacy & Self-Service Boundary Guarantee */}
        <div className="bg-surface rounded-xl border border-boundary-subtle p-4 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-brand-primary shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h3 className="font-bold text-content-primary">
              Personal Data Boundary & Privacy Standards
            </h3>
            <p className="text-content-secondary leading-relaxed">
              Your employee view provides secure self-service access to your personal digital twin, learning progress, and organization policies. In accordance with WorkSense privacy principles, individual peer evaluations, manager retention projections, and organizational access controls are strictly isolated from employee self-service accounts.
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
