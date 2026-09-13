"use client";

import React from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  ShieldCheck,
  Building2,
  Users,
  Network,
  ArrowRight,
  Sparkles,
  PieChart,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LeadershipPortalPage() {
  const { user, activeOrg } = useAuth();

  return (
    <ProtectedRoute requiredCapability="portal.leadership.access">
      <div className="max-w-5xl mx-auto space-y-6 py-4">
        {/* Header */}
        <div className="border-b border-boundary-subtle pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-primary/10 text-xs font-semibold text-brand-primary">
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Executive Decision Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-content-primary">
              Strategic Executive Console
            </h1>
            <p className="text-xs text-content-secondary">
              Organization: <span className="font-semibold text-content-primary">{activeOrg?.name}</span> | Executive Leader: <span className="font-semibold text-content-primary">{user?.full_name}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button size="sm" className="gap-1.5 shadow-sm">
                <PieChart className="h-3.5 w-3.5" />
                <span>Executive Dashboard</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Aggregate Operational Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <Card className="p-4 border-boundary-subtle bg-surface">
            <div className="flex items-center justify-between text-content-muted mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wider">Total Headcount</span>
              <Users className="h-4 w-4 text-brand-primary" />
            </div>
            <div className="text-2xl font-bold font-display text-content-primary">142</div>
            <p className="text-[11px] text-content-secondary mt-0.5">Across 6 Operating Units</p>
          </Card>

          <Card className="p-4 border-boundary-subtle bg-surface">
            <div className="flex items-center justify-between text-content-muted mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wider">Capability Density</span>
              <Sparkles className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-display text-content-primary">89.2%</div>
            <p className="text-[11px] text-content-secondary mt-0.5">Target Skill Benchmark</p>
          </Card>

          <Card className="p-4 border-boundary-subtle bg-surface">
            <div className="flex items-center justify-between text-content-muted mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wider">Retention Stability</span>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold font-display text-content-primary">94.0%</div>
            <p className="text-[11px] text-content-secondary mt-0.5">Low Hazard Population</p>
          </Card>

          <Card className="p-4 border-boundary-subtle bg-surface">
            <div className="flex items-center justify-between text-content-muted mb-1.5">
              <span className="text-xs font-medium uppercase tracking-wider">Hiring Velocity</span>
              <CheckCircle2 className="h-4 w-4 text-brand-primary" />
            </div>
            <div className="text-2xl font-bold font-display text-content-primary">18 Days</div>
            <p className="text-[11px] text-content-secondary mt-0.5">Median Offer Cycle</p>
          </Card>
        </div>

        {/* Strategic Decision Highlight Card */}
        <Card className="p-5 border-boundary-subtle bg-surface-secondary/40 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary mt-0.5">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-content-primary">
                    Capacity Scaling Forecast: Distributed Systems & Infrastructure
                  </h2>
                  <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                    High Confidence
                  </Badge>
                </div>
                <p className="text-xs text-content-secondary mt-1 max-w-2xl leading-relaxed">
                  Recent hiring alignment in Engineering has closed 2 critical skill gaps in Distributed Consensus and High-Throughput Pipelines. Requisition REQ-2026-001 candidate pipeline is tracking at 84.5% match with projected full team onboarding ramp-time within 45 days.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link href="/workforce/intelligence">
                <Button size="sm" variant="primary" className="whitespace-nowrap text-xs gap-1.5">
                  <span>View Intelligence</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Executive Workspaces Grid */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold font-display uppercase tracking-wider text-content-muted">
            Strategic Decision Workspaces
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/dashboard"
              className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-2 hover:border-brand-primary transition-colors block group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                  <PieChart className="h-4 w-4" />
                  <span>Executive Dashboard</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-content-muted group-hover:text-brand-primary transition-colors" />
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Review cross-organizational operational metrics, onboarding progress, and workforce velocity.
              </p>
            </Link>

            <Link
              href="/workforce/intelligence"
              className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-2 hover:border-brand-primary transition-colors block group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                  <TrendingUp className="h-4 w-4" />
                  <span>Workforce Intelligence</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-content-muted group-hover:text-brand-primary transition-colors" />
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Explore retention distributions, analyze internal mobility pathways, and test strategic scenarios.
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
                Inspect departmental structures, reporting hierarchies, and headcount allocation across units.
              </p>
            </Link>

            <Link
              href="/workforce/employees"
              className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-2 hover:border-brand-primary transition-colors block group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                  <Users className="h-4 w-4" />
                  <span>Headcount & Roster</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-content-muted group-hover:text-brand-primary transition-colors" />
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Browse personnel distributions, career level bands, and cross-functional reporting structures.
              </p>
            </Link>

            <Link
              href="/workforce/skills"
              className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-2 hover:border-brand-primary transition-colors block group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                  <Network className="h-4 w-4" />
                  <span>Capability Graph</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-content-muted group-hover:text-brand-primary transition-colors" />
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Assess enterprise skill coverage, adjacency clusters, and strategic capability growth areas.
              </p>
            </Link>

            <Link
              href="/workforce/data-quality"
              className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-2 hover:border-brand-primary transition-colors block group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-brand-primary font-bold text-sm">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Data Governance & Health</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-content-muted group-hover:text-brand-primary transition-colors" />
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Confirm organizational data integrity, entity completeness, and compliance standards.
              </p>
            </Link>
          </div>
        </div>

        {/* Aggregate-First Privacy Standard Assurance */}
        <div className="bg-surface rounded-xl border border-boundary-subtle p-4 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-brand-primary shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h3 className="font-bold text-content-primary">
              Aggregate-First Decision Privacy Architecture
            </h3>
            <p className="text-content-secondary leading-relaxed">
              Leadership intelligence is calibrated for macro-level optimization. Raw candidate resumes, ungrounded private feedback, and identifiable individual attrition risk signals are masked by default to uphold workforce psychological safety and rigorous governance standards.
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
