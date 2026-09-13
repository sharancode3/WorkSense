"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Users,
  ShieldCheck,
  Cpu,
  Lock,
  FileCheck2,
  CheckCircle2,
  Database,
  BarChart3,
} from "lucide-react";

export default function PublicOverviewPage() {
  return (
    <div className="space-y-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* 1. Hero Viewport */}
      <section className="text-center space-y-6 max-w-4xl mx-auto pt-4 sm:pt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 text-xs font-semibold text-brand-primary border border-brand-primary/20">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Evidence-First Workforce Decision Intelligence</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-content-primary leading-[1.15]">
          Understand your workforce: <br className="hidden sm:inline" />
          <span className="text-brand-primary">From signals to human-approved action.</span>
        </h1>

        <p className="text-base sm:text-lg text-content-secondary max-w-2xl mx-auto leading-relaxed">
          WorkSense connects candidate evidence, employee twins, policy reasoning, retention signals, human approvals, and governed workflow orchestration into one reliable operating system.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/demo"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white bg-brand-primary hover:bg-brand-primary/90 transition-colors shadow-sm"
          >
            <Sparkles className="h-4 w-4" />
            <span>Watch Guided Demo</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-content-primary hover:bg-surface-secondary border border-boundary-subtle transition-colors"
          >
            <BarChart3 className="h-4 w-4 text-brand-primary" />
            <span>Explore Decision Dashboard</span>
          </Link>
        </div>

        {/* 3 Core Proof Points */}
        <div className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-3xl mx-auto border-t border-boundary-subtle/60">
          <div className="p-4 rounded-xl bg-surface border border-boundary-subtle space-y-1.5 shadow-xs">
            <div className="text-xs font-bold text-content-primary uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck2 className="h-4 w-4 text-brand-primary" />
              Evidence Over Opinions
            </div>
            <p className="text-xs text-content-secondary leading-relaxed">
              Every score, recommendation, and policy answer is anchored to concrete line-item citations and verified skill observations.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-boundary-subtle space-y-1.5 shadow-xs">
            <div className="text-xs font-bold text-content-primary uppercase tracking-wider flex items-center gap-1.5">
              <Users className="h-4 w-4 text-emerald-500" />
              Digital Twin Continuity
            </div>
            <p className="text-xs text-content-secondary leading-relaxed">
              Candidate signals convert directly into active employee twins, seeding 90-day adaptive onboarding and ongoing capability growth.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-boundary-subtle space-y-1.5 shadow-xs">
            <div className="text-xs font-bold text-content-primary uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-brand-accent" />
              Governed Human Sign-off
            </div>
            <p className="text-xs text-content-secondary leading-relaxed">
              Zero unauthorized automated actions. AI proposes structured recommendations; designated leaders review, calibrate, and dispatch to EnterPro.
            </p>
          </div>
        </div>
      </section>

      {/* 2. The WorkSense Operating Loop */}
      <section id="operating-loop" className="space-y-6 scroll-mt-24">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="text-xs font-bold uppercase font-display tracking-wider text-brand-primary">
            Closed-Loop Intelligence
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-content-primary">
            The WorkSense Operating Loop
          </h2>
          <p className="text-sm text-content-secondary">
            Six disciplined stages connecting talent intake to audited enterprise action.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Step 1 */}
          <div className="p-4 rounded-xl bg-surface border border-boundary-subtle space-y-2 relative hover:border-brand-primary/30 transition-colors">
            <div className="h-7 w-7 rounded bg-brand-primary/10 text-brand-primary font-bold text-xs flex items-center justify-center font-mono">
              01
            </div>
            <div className="font-bold text-sm text-content-primary">Connect Evidence</div>
            <p className="text-xs text-content-secondary leading-relaxed">
              Ingest resumes, attendance telemetry, performance reviews, skill verifications, and policy handbooks.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-xl bg-surface border border-boundary-subtle space-y-2 relative hover:border-brand-primary/30 transition-colors">
            <div className="h-7 w-7 rounded bg-brand-primary/10 text-brand-primary font-bold text-xs flex items-center justify-center font-mono">
              02
            </div>
            <div className="font-bold text-sm text-content-primary">Understand Twin</div>
            <p className="text-xs text-content-secondary leading-relaxed">
              Model people, competencies, and tenure in a continuous workforce digital twin.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-xl bg-surface border border-boundary-subtle space-y-2 relative hover:border-brand-primary/30 transition-colors">
            <div className="h-7 w-7 rounded bg-brand-primary/10 text-brand-primary font-bold text-xs flex items-center justify-center font-mono">
              03
            </div>
            <div className="font-bold text-sm text-content-primary">AI Reasoning</div>
            <p className="text-xs text-content-secondary leading-relaxed">
              Qwen-powered policy reasoning and deterministic synthesis evaluate retention risks with verifiable evidence.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-4 rounded-xl bg-surface border border-boundary-subtle space-y-2 relative hover:border-brand-primary/30 transition-colors">
            <div className="h-7 w-7 rounded bg-brand-primary/10 text-brand-primary font-bold text-xs flex items-center justify-center font-mono">
              04
            </div>
            <div className="font-bold text-sm text-content-primary">Recommend Action</div>
            <p className="text-xs text-content-secondary leading-relaxed">
              Generate structured, low-disruption interventions: roster rotations, mentoring, or role transfers.
            </p>
          </div>

          {/* Step 5 */}
          <div className="p-4 rounded-xl bg-surface border border-brand-primary/40 bg-brand-primary/5 space-y-2 relative">
            <div className="h-7 w-7 rounded bg-brand-accent/20 text-brand-accent font-bold text-xs flex items-center justify-center font-mono">
              05
            </div>
            <div className="font-bold text-sm text-content-primary">Human Approval</div>
            <p className="text-xs text-content-secondary leading-relaxed">
              HR and hiring managers inspect evidence, calibrate parameters, and provide explicit authorization.
            </p>
          </div>

          {/* Step 6 */}
          <div className="p-4 rounded-xl bg-surface border border-boundary-subtle space-y-2 relative hover:border-brand-primary/30 transition-colors">
            <div className="h-7 w-7 rounded bg-status-success/20 text-status-success font-bold text-xs flex items-center justify-center font-mono">
              06
            </div>
            <div className="font-bold text-sm text-content-primary">EnterPro Dispatch</div>
            <p className="text-xs text-content-secondary leading-relaxed">
              Handoff to EnterPro workflows and record the full decision history for transparent governance.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Golden Trajectory Preview */}
      <section className="bg-surface rounded-2xl border border-boundary-subtle p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-boundary-subtle pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
              Unified Workforce Capabilities
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold font-display tracking-tight text-content-primary mt-1">
              The Golden Trajectory: Elena Rostova & Marcus Chen
            </h2>
          </div>
          <Link
            href="/demo"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline"
          >
            <span>Launch Complete Walkthrough</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-xl bg-surface-secondary/40 border border-boundary-subtle space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-content-primary">Track 1: Talent to Twin</span>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                Elena Rostova
              </span>
            </div>
            <p className="text-xs text-content-secondary leading-relaxed">
              Senior Distributed Systems candidate evaluated on observable Raft consensus rubrics. Converts seamlessly into an active Employee Twin with verified L4 skill transfers and an approved 90-day adaptive onboarding plan.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface-secondary/40 border border-boundary-subtle space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-content-primary">Track 2: Retention to EnterPro</span>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                Marcus Chen
              </span>
            </div>
            <p className="text-xs text-content-secondary leading-relaxed">
              Tenured Lead Engineer experiencing consecutive on-call fatigue. Qwen cites Handbook §4.2 remote policy; system recommends an on-call rotation rebalance and Cloud Architecture mobility pathway requiring dual HR sign-off.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Trust & Governance */}
      <section id="trust-governance" className="space-y-6 scroll-mt-24">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="text-xs font-bold uppercase font-display tracking-wider text-brand-primary">
            Trust & Governance
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-content-primary">
            Engineered for Responsible Enterprise AI
          </h2>
          <p className="text-sm text-content-secondary">
            WorkSense enforces strict architectural guardrails for fair, accountable, and transparent workforce decisions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-surface border border-boundary-subtle space-y-1.5">
            <div className="flex items-center gap-2 text-content-primary font-bold text-xs">
              <Cpu className="h-4 w-4 text-brand-primary" />
              <span>Grounded AI Architecture</span>
            </div>
            <p className="text-xs text-content-secondary leading-relaxed">
              Utilizes Qwen with deterministic grounded synthesis and exact document citations, preventing conversational fabrication.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-boundary-subtle space-y-1.5">
            <div className="flex items-center gap-2 text-content-primary font-bold text-xs">
              <FileCheck2 className="h-4 w-4 text-brand-primary" />
              <span>Verifiable Citations</span>
            </div>
            <p className="text-xs text-content-secondary leading-relaxed">
              Every score, match, and policy answer links back to specific resume sections or authoritative handbook clauses.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-boundary-subtle space-y-1.5">
            <div className="flex items-center gap-2 text-content-primary font-bold text-xs">
              <Lock className="h-4 w-4 text-brand-primary" />
              <span>Multi-Tenant Row-Level Security</span>
            </div>
            <p className="text-xs text-content-secondary leading-relaxed">
              Candidates never see internal scores, employees never see attrition flags, and cross-tenant data is completely isolated.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-boundary-subtle space-y-1.5">
            <div className="flex items-center gap-2 text-content-primary font-bold text-xs">
              <ShieldCheck className="h-4 w-4 text-brand-primary" />
              <span>Strict Human Accountability</span>
            </div>
            <p className="text-xs text-content-secondary leading-relaxed">
              Zero automated termination or hiring. AI serves strictly as a structured decision-support engine under human authorization.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-boundary-subtle space-y-1.5">
            <div className="flex items-center gap-2 text-content-primary font-bold text-xs">
              <Database className="h-4 w-4 text-brand-primary" />
              <span>Auditable Decision Activity History</span>
            </div>
            <p className="text-xs text-content-secondary leading-relaxed">
              Every approval, modification, and EnterPro workflow dispatch is recorded in an auditable decision activity history ledger.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-boundary-subtle space-y-1.5">
            <div className="flex items-center gap-2 text-content-primary font-bold text-xs">
              <CheckCircle2 className="h-4 w-4 text-brand-primary" />
              <span>EnterPro Workflow Integration</span>
            </div>
            <p className="text-xs text-content-secondary leading-relaxed">
              Approved recommendations bridge cleanly into enterprise workflow orchestration with parameter validation.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Call to Action Banner */}
      <section className="bg-brand-primary text-white rounded-2xl p-8 sm:p-10 text-center space-y-5 shadow-md">
        <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight">
          Experience Evidence-First Workforce Intelligence
        </h2>
        <p className="text-sm sm:text-base text-blue-100 max-w-xl mx-auto leading-relaxed">
          Follow the guided demo from candidate intake and adaptive onboarding to policy reasoning and EnterPro workflow dispatch.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/demo"
            className="w-full sm:w-auto px-6 py-3 rounded-lg text-xs sm:text-sm font-semibold text-brand-primary bg-white hover:bg-blue-50 transition-colors shadow-sm"
          >
            Walk Through the Golden Path
          </Link>
          <Link
            href="/auth/login"
            className="w-full sm:w-auto px-6 py-3 rounded-lg text-xs sm:text-sm font-semibold text-white border border-white/30 hover:bg-white/10 transition-colors"
          >
            Sign In with Demo Credentials
          </Link>
        </div>
      </section>
    </div>
  );
}

