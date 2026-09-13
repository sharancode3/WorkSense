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
  GitBranch,
  FileCheck2,
  Activity,
  CheckCircle2,
  Compass,
  Briefcase,
  Layers,
  Send,
  Database,
  BarChart3,
  BookOpen,
} from "lucide-react";

export default function PublicOverviewPage() {
  return (
    <div className="space-y-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* 1. Hero Viewport */}
      <section className="text-center space-y-6 max-w-4xl mx-auto pt-6 sm:pt-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 text-xs font-semibold text-brand-primary border border-brand-primary/20">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Evidence-First Workforce Decision Intelligence</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-content-primary leading-[1.15]">
          Understand your workforce. <br className="hidden sm:inline" />
          <span className="text-brand-primary">Act with evidence.</span>
        </h1>

        <p className="text-base sm:text-lg text-content-secondary max-w-2xl mx-auto leading-relaxed">
          WorkSense connects recruitment, onboarding, policy, performance, attendance, and skills data to produce grounded workforce recommendations that remain strictly under human control.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/demo"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white bg-brand-primary hover:bg-brand-primary/90 transition-colors shadow-sm"
          >
            <span>Explore How WorkSense Works</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/auth/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-content-primary hover:bg-surface-secondary border border-boundary-subtle transition-colors"
          >
            <span>Sign In to WorkSense</span>
          </Link>
        </div>

        {/* Why it's different - Quick comparison callout */}
        <div className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-3xl mx-auto border-t border-boundary-subtle/60">
          <div className="p-3.5 rounded-lg bg-surface border border-boundary-subtle space-y-1">
            <div className="text-xs font-bold text-content-primary uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-brand-primary" />
              Not a Chatbot
            </div>
            <p className="text-xs text-content-secondary leading-normal">
              Zero conversational fabrication. Grounded in your structured enterprise datasets with source citations.
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-surface border border-boundary-subtle space-y-1">
            <div className="text-xs font-bold text-content-primary uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-status-success" />
              Human Accountability
            </div>
            <p className="text-xs text-content-secondary leading-normal">
              AI proposes; designated human leaders evaluate, calibrate, and explicitly authorize every action.
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-surface border border-boundary-subtle space-y-1">
            <div className="text-xs font-bold text-content-primary uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-brand-accent" />
              End-to-End Twin
            </div>
            <p className="text-xs text-content-secondary leading-normal">
              Unified digital continuity from external candidate to thriving employee, skill growth, and mobility.
            </p>
          </div>
        </div>
      </section>

      {/* 2. The WorkSense Operating Loop */}
      <section id="operating-loop" className="space-y-8 scroll-mt-24">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="text-xs font-bold uppercase font-display tracking-wider text-brand-primary">
            Closed-Loop Intelligence
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-content-primary">
            The WorkSense Operating Loop
          </h2>
          <p className="text-sm text-content-secondary">
            How raw workforce signals turn into verified human-guided organizational actions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Step 1 */}
          <div className="p-4 rounded-xl bg-surface border border-boundary-subtle space-y-2 relative">
            <div className="h-7 w-7 rounded bg-brand-primary/10 text-brand-primary font-bold text-xs flex items-center justify-center font-mono">
              01
            </div>
            <div className="font-bold text-sm text-content-primary">Connect Evidence</div>
            <p className="text-xs text-content-secondary leading-relaxed">
              Ingest resumes, attendance, performance reviews, skill verifications, and policy docs.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-xl bg-surface border border-boundary-subtle space-y-2 relative">
            <div className="h-7 w-7 rounded bg-brand-primary/10 text-brand-primary font-bold text-xs flex items-center justify-center font-mono">
              02
            </div>
            <div className="font-bold text-sm text-content-primary">Understand Twin</div>
            <p className="text-xs text-content-secondary leading-relaxed">
              Model people, roles, competencies, and progression in a temporal workforce digital twin.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-xl bg-surface border border-boundary-subtle space-y-2 relative">
            <div className="h-7 w-7 rounded bg-brand-primary/10 text-brand-primary font-bold text-xs flex items-center justify-center font-mono">
              03
            </div>
            <div className="font-bold text-sm text-content-primary">Local AI Reasoning</div>
            <p className="text-xs text-content-secondary leading-relaxed">
              Local Qwen model reasons privately against evidence, producing verifiable citations.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-4 rounded-xl bg-surface border border-boundary-subtle space-y-2 relative">
            <div className="h-7 w-7 rounded bg-brand-primary/10 text-brand-primary font-bold text-xs flex items-center justify-center font-mono">
              04
            </div>
            <div className="font-bold text-sm text-content-primary">Recommend Action</div>
            <p className="text-xs text-content-secondary leading-relaxed">
              Generate actionable interventions: tailored onboarding, retention steps, or career mobility paths.
            </p>
          </div>

          {/* Step 5 */}
          <div className="p-4 rounded-xl bg-surface border border-boundary-subtle space-y-2 relative">
            <div className="h-7 w-7 rounded bg-brand-accent/20 text-brand-accent font-bold text-xs flex items-center justify-center font-mono">
              05
            </div>
            <div className="font-bold text-sm text-content-primary">Human Approval</div>
            <p className="text-xs text-content-secondary leading-relaxed">
              HR and hiring managers review rationale, modify parameters, and take accountable sign-off.
            </p>
          </div>

          {/* Step 6 */}
          <div className="p-4 rounded-xl bg-surface border border-boundary-subtle space-y-2 relative">
            <div className="h-7 w-7 rounded bg-status-success/20 text-status-success font-bold text-xs flex items-center justify-center font-mono">
              06
            </div>
            <div className="font-bold text-sm text-content-primary">Dispatch & Record</div>
            <p className="text-xs text-content-secondary leading-relaxed">
              Hand off to EnterPro workflows and record the full decision history for continuous learning.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Core Capabilities */}
      <section id="capabilities" className="space-y-8 scroll-mt-24">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="text-xs font-bold uppercase font-display tracking-wider text-brand-primary">
            Modular Intelligence
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-content-primary">
            Unified Workforce Capabilities
          </h2>
          <p className="text-sm text-content-secondary">
            Connecting seven operational domains into one coordinated workforce decision engine.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1 */}
          <div className="p-5 rounded-xl bg-surface border border-boundary-subtle space-y-2.5">
            <div className="h-9 w-9 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center">
              <Briefcase className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-content-primary">Talent Intelligence</h3>
            <p className="text-xs text-content-secondary leading-relaxed">
              Evidence-based resume extraction, transparent rubric-based candidate evaluations, and structured interview kits with 5-level observable rubrics.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-5 rounded-xl bg-surface border border-boundary-subtle space-y-2.5">
            <div className="h-9 w-9 rounded-lg bg-status-success/10 text-status-success flex items-center justify-center">
              <Compass className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-content-primary">Adaptive Onboarding</h3>
            <p className="text-xs text-content-secondary leading-relaxed">
              Converts candidate twins into active employee twins with tailored milestone plans calibrated to individual skill baselines and role requirements.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-5 rounded-xl bg-surface border border-boundary-subtle space-y-2.5">
            <div className="h-9 w-9 rounded-lg bg-brand-accent/10 text-brand-accent flex items-center justify-center">
              <BookOpen className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-content-primary">Policy Reasoning & RAG</h3>
            <p className="text-xs text-content-secondary leading-relaxed">
              Answers complex organizational policy questions with exact document citations, preventing unauthorized interpretations and policy drift.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-5 rounded-xl bg-surface border border-boundary-subtle space-y-2.5">
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Activity className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-content-primary">Workforce Intelligence</h3>
            <p className="text-xs text-content-secondary leading-relaxed">
              Tracks retention risks, attendance trends, and engagement patterns across departments, giving HR early signals before attrition occurs.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-5 rounded-xl bg-surface border border-boundary-subtle space-y-2.5">
            <div className="h-9 w-9 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <GitBranch className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-content-primary">Skill & Mobility Graph</h3>
            <p className="text-xs text-content-secondary leading-relaxed">
              Normalizes competencies against the organization&apos;s taxonomy to uncover internal mobility pathways and departmental capability gaps.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-5 rounded-xl bg-surface border border-boundary-subtle space-y-2.5">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-base text-content-primary">Decision Dashboard & Actions</h3>
            <p className="text-xs text-content-secondary leading-relaxed">
              Executive decision dashboard consolidating real pipeline health, team milestones, and human-approved action handoffs to EnterPro.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Core Innovations */}
      <section className="bg-surface rounded-2xl border border-boundary-subtle p-6 sm:p-10 space-y-8">
        <div className="space-y-2 max-w-xl">
          <div className="text-xs font-bold uppercase font-display tracking-wider text-brand-primary">
            Key Innovations
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-content-primary">
            Built for Real Enterprise Realities
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex gap-4">
            <div className="h-10 w-10 rounded-lg bg-brand-primary/10 text-brand-primary flex-shrink-0 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-content-primary">Candidate Twin to Employee Twin</h3>
              <p className="text-xs text-content-secondary leading-relaxed">
                Evaluation artifacts, verified competencies, and interview evidence captured during hiring flow seamlessly into the employee&apos;s onboarding journey.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="h-10 w-10 rounded-lg bg-brand-primary/10 text-brand-primary flex-shrink-0 flex items-center justify-center">
              <Layers className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-content-primary">Temporal Workforce Digital Twin</h3>
              <p className="text-xs text-content-secondary leading-relaxed">
                Maintains a point-in-time record of skills, reporting lines, and goal progression, enabling auditability and tracking of how decisions impact retention over time.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="h-10 w-10 rounded-lg bg-brand-primary/10 text-brand-primary flex-shrink-0 flex items-center justify-center">
              <Cpu className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-content-primary">Local Private Qwen Reasoning</h3>
              <p className="text-xs text-content-secondary leading-relaxed">
                Sensitive workforce data never leaves your environment. Reasoning occurs via dedicated local models with strict JSON schema validation.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="h-10 w-10 rounded-lg bg-brand-primary/10 text-brand-primary flex-shrink-0 flex items-center justify-center">
              <Send className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-content-primary">EnterPro Enterprise Orchestration</h3>
              <p className="text-xs text-content-secondary leading-relaxed">
                Approved recommendations dispatch directly into enterprise workflow execution with full parameter governance and outcome logging.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Trust & Governance */}
      <section id="trust-governance" className="space-y-6 scroll-mt-24">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="text-xs font-bold uppercase font-display tracking-wider text-brand-primary">
            Trust & Governance
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-content-primary">
            Engineered for Responsible AI
          </h2>
          <p className="text-sm text-content-secondary">
            WorkSense adheres to strict ethical standards for AI-assisted human resources decisions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-surface border border-boundary-subtle space-y-1.5">
            <div className="flex items-center gap-2 text-content-primary font-bold text-xs">
              <Cpu className="h-4 w-4 text-brand-primary" />
              <span>Local Model Execution</span>
            </div>
            <p className="text-xs text-content-secondary leading-relaxed">
              No private candidate or employee text is shared with third-party public AI providers. All inference runs locally.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-boundary-subtle space-y-1.5">
            <div className="flex items-center gap-2 text-content-primary font-bold text-xs">
              <FileCheck2 className="h-4 w-4 text-brand-primary" />
              <span>Grounded Citations</span>
            </div>
            <p className="text-xs text-content-secondary leading-relaxed">
              Every score, insight, and policy answer requires citations referencing specific resume lines or policy document sections.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-boundary-subtle space-y-1.5">
            <div className="flex items-center gap-2 text-content-primary font-bold text-xs">
              <Lock className="h-4 w-4 text-brand-primary" />
              <span>Strict Role-Based Access</span>
            </div>
            <p className="text-xs text-content-secondary leading-relaxed">
              Row-Level Security guarantees candidates never see scores, employees never see attrition flags, and recruiters cannot view internal employee records.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-boundary-subtle space-y-1.5">
            <div className="flex items-center gap-2 text-content-primary font-bold text-xs">
              <ShieldCheck className="h-4 w-4 text-brand-primary" />
              <span>Human-in-the-Loop Decisions</span>
            </div>
            <p className="text-xs text-content-secondary leading-relaxed">
              No automatic hiring, termination, or role reassignments. AI only prepares proposals; humans retain total accountability.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-boundary-subtle space-y-1.5">
            <div className="flex items-center gap-2 text-content-primary font-bold text-xs">
              <Database className="h-4 w-4 text-brand-primary" />
              <span>Append-Oriented Audit History</span>
            </div>
            <p className="text-xs text-content-secondary leading-relaxed">
              All approvals, parameter modifications, and workflow dispatches are permanently recorded for governance review.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-boundary-subtle space-y-1.5">
            <div className="flex items-center gap-2 text-content-primary font-bold text-xs">
              <CheckCircle2 className="h-4 w-4 text-brand-primary" />
              <span>Zero Hallucination Guardrails</span>
            </div>
            <p className="text-xs text-content-secondary leading-relaxed">
              Strict Pydantic JSON schemas with deterministic verification reject ungrounded responses before they reach the user.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Call to Action Banner */}
      <section className="bg-brand-primary text-white rounded-2xl p-8 sm:p-12 text-center space-y-5">
        <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight">
          Experience Evidence-First Workforce Intelligence
        </h2>
        <p className="text-sm sm:text-base text-blue-100 max-w-xl mx-auto leading-relaxed">
          Walk through the complete golden path from candidate evaluation to adaptive onboarding and executive decision making.
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
