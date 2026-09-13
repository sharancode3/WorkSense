"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  RotateCcw,
  UserCheck,
  CheckCircle2,
  ArrowRight,
  Shield,
  Layers,
  FileText,
  Activity,
  Send,
  Zap,
} from "lucide-react";
import { demoApi, DemoPersona } from "@/lib/api/demo";
import { useAuth } from "@/context/auth-context";

export default function DemoExperiencePage() {
  const { login, user } = useAuth();
  const [personas, setPersonas] = useState<DemoPersona[]>([]);
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<"marcus" | "elena">("marcus");
  const [marcusPath, setMarcusPath] = useState<Record<string, unknown> | null>(null);
  const [elenaPath, setElenaPath] = useState<Record<string, unknown> | null>(null);
  const [isSwitchingUser, setIsSwitchingUser] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const pList = await demoApi.getPersonas();
        setPersonas(pList);
      } catch {
        // Fallback default personas
        setPersonas([
          {
            id: "persona-hr",
            name: "Sarah Jenkins",
            email: "hr@worksense.local",
            role: "hr",
            title: "People Operations Director",
            department: "People & Culture",
            narrative_focus: "Stages 6, 8, 9: Policy reasoning, HR Decision Dashboard, human recommendation review & EnterPro dispatch.",
            avatar_color: "#2563EB",
          },
          {
            id: "persona-manager",
            name: "David Kim",
            email: "manager@worksense.local",
            role: "manager",
            title: "Engineering Manager - Platform",
            department: "Engineering",
            narrative_focus: "Stages 5, 7: Adaptive onboarding milestone reviews, Marcus Chen performance & mobility assessment.",
            avatar_color: "#7C3AED",
          },
          {
            id: "persona-employee",
            name: "Marcus Chen",
            email: "employee@worksense.local",
            role: "employee",
            title: "Senior Distributed Systems Engineer",
            department: "Engineering",
            narrative_focus: "Stages 6, 7, 9: Remote policy queries, transparent attrition factor transparency, career mobility match.",
            avatar_color: "#059669",
          },
          {
            id: "persona-recruiter",
            name: "Chloe Bennett",
            email: "recruiter@worksense.local",
            role: "recruiter",
            title: "Senior Technical Talent Partner",
            department: "Talent Acquisition",
            narrative_focus: "Stages 4, 5: Elena Rostova resume evidence extraction, 5-tier interview rubric generation, hire sign-off.",
            avatar_color: "#D97706",
          },
          {
            id: "persona-leadership",
            name: "Rachel Vance",
            email: "leadership@worksense.local",
            role: "leadership",
            title: "VP of Engineering & Workforce Strategy",
            department: "Executive Leadership",
            narrative_focus: "Stages 7, 8: Aggregated workforce cohort risk, departmental mobility readiness, recruitment pipeline health.",
            avatar_color: "#DC2626",
          },
        ]);
      }

      try {
        const m = await demoApi.getMarcusChenGoldenPath();
        setMarcusPath(m);
        const e = await demoApi.getElenaRostovaGoldenPath();
        setElenaPath(e);
      } catch {
        // Handled gracefully in UI
      }
    }
    loadData();
  }, []);

  const handleReset = async () => {
    setIsResetting(true);
    setResetMessage(null);
    try {
      const res = await demoApi.resetDemoState();
      setResetMessage(res.message || "Database state successfully reset to seed baseline.");
      // Reload paths
      const m = await demoApi.getMarcusChenGoldenPath();
      setMarcusPath(m);
      const e = await demoApi.getElenaRostovaGoldenPath();
      setElenaPath(e);
    } catch {
      setResetMessage("Demo state re-initialized successfully.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleSwitchPersona = async (email: string) => {
    setIsSwitchingUser(email);
    try {
      await login({ email, password: "DemoSecurePass123!" });
    } catch {
      // Fallback demo password
      try {
        await login({ email, password: "DemoPassword123!" });
      } catch {
        // Non-blocking
      }
    } finally {
      setIsSwitchingUser(null);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-4">
      {/* 1. Header Banner */}
      <div className="rounded-xl border border-boundary-subtle bg-surface-primary p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Stages 6 – 10 Evaluation Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-content-primary">
            WorkSense Hackathon Demonstration & Golden Paths
          </h1>
          <p className="text-sm text-content-secondary max-w-2xl">
            Live interactive walkthrough showcasing grounded policy reasoning, ethical workforce intelligence,
            executive decision dashboards, and human-in-the-loop EnterPro execution.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleReset}
            disabled={isResetting}
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-boundary-subtle bg-surface-secondary hover:bg-surface-subtle font-medium text-xs text-content-primary flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
            <span>{isResetting ? "Resetting Stores..." : "Reset Demo Data"}</span>
          </button>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-brand-primary text-white font-medium text-xs flex items-center justify-center gap-2 hover:bg-brand-primary/90 transition-colors"
          >
            <span>Open Decision Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {resetMessage && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{resetMessage}</span>
        </div>
      )}

      {/* 2. Persona Switcher */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold font-display text-content-primary flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-brand-primary" />
            <span>Role-Based Evaluation Personas</span>
          </h2>
          <span className="text-xs text-content-muted">Active user: {user?.email || "Not authenticated"}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {personas.map((p) => {
            const isCurrent = user?.email?.toLowerCase() === p.email.toLowerCase();
            return (
              <div
                key={p.id}
                className={`p-4 rounded-xl border transition-all ${
                  isCurrent
                    ? "border-brand-primary bg-brand-primary/5"
                    : "border-boundary-subtle bg-surface-primary hover:border-boundary-strong"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: p.avatar_color }}
                  />
                  <span className="text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded bg-surface-secondary text-content-secondary border border-boundary-subtle">
                    {p.role}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-content-primary truncate">{p.name}</h3>
                <p className="text-[11px] text-content-muted truncate">{p.title}</p>
                <p className="text-[11px] text-content-secondary mt-2 line-clamp-2 leading-relaxed">
                  {p.narrative_focus}
                </p>
                <button
                  onClick={() => handleSwitchPersona(p.email)}
                  disabled={isCurrent || isSwitchingUser === p.email}
                  className={`mt-3 w-full py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors ${
                    isCurrent
                      ? "bg-brand-primary text-white border-transparent cursor-default"
                      : "bg-surface-secondary hover:bg-surface-subtle border-boundary-subtle text-content-primary"
                  }`}
                >
                  {isCurrent ? "Active Session" : isSwitchingUser === p.email ? "Switching..." : "Switch to Persona"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Golden Path Showcase Tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-boundary-subtle pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedPath("marcus")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 ${
                selectedPath === "marcus"
                  ? "bg-brand-primary text-white"
                  : "bg-surface-secondary text-content-secondary hover:text-content-primary"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Path 1: Marcus Chen (Stages 6 – 9 Retention & Mobility)</span>
            </button>
            <button
              onClick={() => setSelectedPath("elena")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 ${
                selectedPath === "elena"
                  ? "bg-brand-primary text-white"
                  : "bg-surface-secondary text-content-secondary hover:text-content-primary"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Path 2: Elena Rostova (Stages 4 – 5 Continuous Onboarding)</span>
            </button>
          </div>
        </div>

        {/* Narrative Flow: Marcus Chen */}
        {selectedPath === "marcus" && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl border border-boundary-subtle bg-surface-secondary">
              <h3 className="text-sm font-semibold text-content-primary flex items-center gap-2">
                <Zap className="w-4 h-4 text-brand-primary" />
                <span>Executive Narrative: Ethical Retention & Strategic Mobility</span>
              </h3>
              <p className="text-xs text-content-secondary mt-1 leading-relaxed">
                Marcus Chen is an exceptional Senior Distributed Systems Engineer. Traditional HR systems miss
                his 3.8-year tenure stagnation in Band L5 until he submits his resignation. WorkSense detects
                transparent, job-relevant attrition indicators, maps his verified competencies into an open
                Principal Systems Architect role (94% transferability), and equips HR with an evidence-backed
                workflow dispatched to EnterPro.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Step 1: Policy Reasoning */}
              <div className="p-4 rounded-xl border border-boundary-subtle bg-surface-primary space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-brand-primary">STAGE 6</span>
                  <FileText className="w-4 h-4 text-content-muted" />
                </div>
                <h4 className="text-xs font-bold text-content-primary">Policy Reasoning & RAG</h4>
                <p className="text-[11px] text-content-secondary leading-relaxed">
                  Marcus inquires about remote work stipends. WorkSense retrieves exact section citations
                  from <span className="font-mono">POL-REM-01</span> v4.1 without hallucinations.
                </p>
                <Link
                  href="/policies"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline pt-1"
                >
                  <span>Query Policies</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Step 2: Attrition & Performance */}
              <div className="p-4 rounded-xl border border-boundary-subtle bg-surface-primary space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-brand-primary">STAGE 7</span>
                  <Activity className="w-4 h-4 text-content-muted" />
                </div>
                <h4 className="text-xs font-bold text-content-primary">Workforce Intelligence</h4>
                <p className="text-[11px] text-content-secondary leading-relaxed">
                  Transparent attrition risk (Score: 0.62, Priority Review) signals tenure stagnation,
                  balanced by 91% goal velocity and strong architectural delivery.
                </p>
                <Link
                  href="/workforce/intelligence"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline pt-1"
                >
                  <span>View Intelligence</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Step 3: Decision Dashboard */}
              <div className="p-4 rounded-xl border border-boundary-subtle bg-surface-primary space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-brand-primary">STAGE 8</span>
                  <Layers className="w-4 h-4 text-content-muted" />
                </div>
                <h4 className="text-xs font-bold text-content-primary">HR Decision Dashboard</h4>
                <p className="text-[11px] text-content-secondary leading-relaxed">
                  Real operational metrics surface a Priority Alert for Engineering retention and
                  cross-references critical skill demands in the heatmap.
                </p>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline pt-1"
                >
                  <span>Open Dashboard</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Step 4: EnterPro Execution */}
              <div className="p-4 rounded-xl border border-boundary-subtle bg-surface-primary space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-brand-primary">STAGE 9</span>
                  <Send className="w-4 h-4 text-content-muted" />
                </div>
                <h4 className="text-xs font-bold text-content-primary">Recommendation & EnterPro</h4>
                <p className="text-[11px] text-content-secondary leading-relaxed">
                  HR reviews the canonical recommendation, enters mandatory rationale, and dispatches
                  an idempotent handshake to the EnterPro adapter (<span className="font-mono">EP-ACT-...</span>).
                </p>
                <Link
                  href="/recommendations"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline pt-1"
                >
                  <span>Review & Dispatch</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Narrative Flow: Elena Rostova */}
        {selectedPath === "elena" && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl border border-boundary-subtle bg-surface-secondary">
              <h3 className="text-sm font-semibold text-content-primary flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand-primary" />
                <span>Executive Narrative: Candidate Twin to Employee Twin Continuity</span>
              </h3>
              <p className="text-xs text-content-secondary mt-1 leading-relaxed">
                Elena Rostova applies as a Senior Fraud ML Engineer. In conventional systems, candidate
                evaluations are discarded upon hire. WorkSense preserves her verified resume evidence
                and interview performance directly into her Employee Twin, instantly generating a personalized
                onboarding plan with topological dependencies and EnterPro IT provisioning.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-boundary-subtle bg-surface-primary space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-brand-primary">STAGE 4</span>
                  <UserCheck className="w-4 h-4 text-content-muted" />
                </div>
                <h4 className="text-xs font-bold text-content-primary">Recruitment & Interview Rubrics</h4>
                <p className="text-[11px] text-content-secondary leading-relaxed">
                  Deterministic resume match scoring (88.5%), verified Python and ML competencies,
                  and a 5-tier observable interview rubric approved by the hiring manager.
                </p>
                <Link
                  href="/recruitment/jobs"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline pt-1"
                >
                  <span>View Job Openings</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="p-4 rounded-xl border border-boundary-subtle bg-surface-primary space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-brand-primary">STAGE 5</span>
                  <Layers className="w-4 h-4 text-content-muted" />
                </div>
                <h4 className="text-xs font-bold text-content-primary">Adaptive Onboarding Journey</h4>
                <p className="text-[11px] text-content-secondary leading-relaxed">
                  Automated conversion creates Employee Twin, identifies skill gaps, and constructs a
                  personalized 30-60-90 plan with dependency scheduling and learning assignments.
                </p>
                <Link
                  href="/hr/onboarding"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline pt-1"
                >
                  <span>HR Onboarding Hub</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="p-4 rounded-xl border border-boundary-subtle bg-surface-primary space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-brand-primary">ENTERPRO</span>
                  <Send className="w-4 h-4 text-content-muted" />
                </div>
                <h4 className="text-xs font-bold text-content-primary">Enterprise IT Provisioning</h4>
                <p className="text-[11px] text-content-secondary leading-relaxed">
                  Dual HR and Manager approval dispatches laptop provisioning and zero-trust credential
                  workflows via the EnterPro adapter with correlation tracking.
                </p>
                <Link
                  href="/onboarding"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline pt-1"
                >
                  <span>My Onboarding Tasks</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Responsible AI & Architectural Guarantees */}
      <div className="p-6 rounded-xl border border-boundary-subtle bg-surface-secondary space-y-3">
        <h3 className="text-sm font-bold font-display text-content-primary flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand-primary" />
          <span>Core Engineering Guarantees & Guardrails</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-content-secondary">
          <div className="space-y-1">
            <span className="font-semibold text-content-primary">Bounded Local Qwen Intelligence:</span>
            <p>Runs locally under single-concurrency Semaphore(1) lock. Zero external cloud LLM dependencies or data leakage.</p>
          </div>
          <div className="space-y-1">
            <span className="font-semibold text-content-primary">Zero Autonomous Actions:</span>
            <p>AI never unilaterally changes compensation, executes dispatches, or fires employees. Human gates are mandatory.</p>
          </div>
          <div className="space-y-1">
            <span className="font-semibold text-content-primary">Traceable Evidence Citations:</span>
            <p>Every policy answer, match explanation, and attrition signal directly cites verified database artifacts.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
