"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Cpu,
  Layers,
} from "lucide-react";

interface GoldenStep {
  id: string;
  stepNumber: string;
  title: string;
  role: string;
  summary: string;
  evidence: string[];
  systemAction: string;
  humanGate: string;
  sampleData: Record<string, string>;
}

const GOLDEN_STEPS: GoldenStep[] = [
  {
    id: "recruitment",
    stepNumber: "01",
    title: "Talent Intake & Evidence Extraction",
    role: "Candidate & Recruiter",
    summary: "Elena Rostova applies for Senior Distributed Systems Engineer. Local Qwen parses resume against requirement evidence with zero hallucination.",
    evidence: [
      "Extracted 8 verifiable competencies: Python (L4), Go (L4), Kubernetes (L4), Kafka (L3), gRPC (L3)",
      "Years of experience matched: 7.5 years verified against chronology",
      "No inflated scoring: Unsubstantiated claims flagged for interviewer validation",
    ],
    systemAction: "Normalizes skills to the organization's taxonomy and generates matching evidence report.",
    humanGate: "Technical recruiter inspects normalized profile before advancing candidate.",
    sampleData: {
      "Candidate": "Elena Rostova",
      "Role Applied": "Senior Distributed Systems Engineer",
      "Normalized Match": "88% verified evidence match",
      "Key Strengths": "High-throughput messaging, Raft consensus, Microservices",
    },
  },
  {
    id: "interview",
    stepNumber: "02",
    title: "Objective Interview & Rubrics",
    role: "Recruiter & Interviewer",
    summary: "System generates a 5-tier observable rubric tailored to Distributed Systems Architecture. Eliminates subjective bias with concrete behavioral anchors.",
    evidence: [
      "Level 1: Cannot articulate consensus algorithms",
      "Level 3: Implements Raft/Paxos with standard libraries and knows tradeoffs",
      "Level 5: Diagnoses split-brain, network partitions, and tail latency in production",
    ],
    systemAction: "Prepares interview kit with grounded probing questions and anti-hallucination verification anchors.",
    humanGate: "Interviewer scores evidence strictly against observable rubric levels with written rationale.",
    sampleData: {
      "Kit Title": "Distributed Systems Systems Design",
      "Competency": "Consensus & Data Consistency",
      "Observed Level": "Level 4 (Strong Senior)",
      "Interviewer Decision": "Advance to Hire with High Confidence",
    },
  },
  {
    id: "conversion",
    stepNumber: "03",
    title: "Twin Conversion & Adaptive Onboarding",
    role: "HR Partner & Manager",
    summary: "Upon candidate selection, the Candidate Twin converts into an Employee Twin. Baseline skills and interview findings seed an adaptive 90-day onboarding plan.",
    evidence: [
      "Verified skills transfer directly: No redundant competency assessments",
      "Growth areas from interview automatically become Day 30-60 learning milestones",
      "Equipment provisioning, security access, and mentor assignment pre-staged",
    ],
    systemAction: "Creates tailored onboarding track based on individual baseline skills vs. job role requirements.",
    humanGate: "Hiring manager reviews milestone targets and assigns dedicated onboarding buddy.",
    sampleData: {
      "Employee Twin ID": "EMP-2026-084",
      "Assigned Manager": "David Kim (Platform Engineering)",
      "Onboarding Track": "Distributed Systems Tier-1 Track",
      "Day 30 Target": "First production PR to cluster coordinator service",
    },
  },
  {
    id: "intelligence",
    stepNumber: "04",
    title: "Retention Intelligence & Policy Grounding",
    role: "Employee & People Manager",
    summary: "Marcus Chen, a senior engineer, experiences increased on-call strain and queries remote work policies. Qwen reasons over policy documents with exact citations.",
    evidence: [
      "Policy Citation: Handbook Section 4.2 ('Flexible Location & Core Timezone Guidelines')",
      "Workforce Signal: Consecutive weekend on-call shifts detected without overtime credit",
      "Skill Graph: Marcus has high readiness for internal Cloud Architecture lead role",
    ],
    systemAction: "Detects mild burnout risk and identifies positive internal mobility matches before disengagement occurs.",
    humanGate: "No automated intervention. System prepares a recommended action for HR and manager review.",
    sampleData: {
      "Signal": "On-call fatigue + high tenure",
      "Policy Answer": "Remote eligible with manager approval (Handbook §4.2)",
      "Retention Opportunity": "Internal transfer to Architecture Council",
    },
  },
  {
    id: "recommendation",
    stepNumber: "05",
    title: "Grounded Recommendation & Human Gate",
    role: "HR Director & People Manager",
    summary: "The platform recommends an on-call rotation adjustment and an internal mobility transition plan, complete with evidence rationale and risk impact score.",
    evidence: [
      "Evidence Rationale: High value individual, critical institutional knowledge",
      "Mitigation: Rebalance on-call roster + offer Cloud Architecture lead mentorship",
      "Projected Impact: Reduces attrition probability by 42%",
    ],
    systemAction: "Packages recommendation into human approval gate with complete provenance.",
    humanGate: "HR Business Partner and Manager must jointly approve, modify, or reject the recommendation.",
    sampleData: {
      "Recommendation": "Rotate on-call roster & initiate Architecture transition",
      "Required Approvers": "HR Partner + Platform Engineering Manager",
      "Decision State": "Awaiting Human Sign-off",
    },
  },
  {
    id: "orchestration",
    stepNumber: "06",
    title: "EnterPro Workflow Orchestration",
    role: "Enterprise Systems",
    summary: "Following human authorization, WorkSense dispatches parameterized actions to EnterPro workflows and logs the complete event to recorded audit history.",
    evidence: [
      "EnterPro Webhook: Dispatched payload to /api/v1/orchestrator/workflows",
      "Action: Updated PagerDuty rotation group + scheduled quarterly mobility review",
      "Recorded Audit History: Event signed by HR Partner with timestamp and justification",
    ],
    systemAction: "Triggers external orchestration adapter and confirms delivery acknowledgement.",
    humanGate: "Workflow completion verified by HR with full audit trail compliance.",
    sampleData: {
      "Dispatch Target": "EnterPro Orchestrator",
      "Workflow ID": "WF-ROTATION-2026-09",
      "Audit Status": "Recorded in append-oriented decision history",
      "Final State": "Action executed under human authority",
    },
  },
];

export default function PublicDemoPage() {
  const [activeStepId, setActiveStepId] = useState<string>("recruitment");
  const currentStep = GOLDEN_STEPS.find((s) => s.id === activeStepId) || GOLDEN_STEPS[0];

  return (
    <div className="space-y-12 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* 1. Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 text-xs font-semibold text-brand-primary border border-brand-primary/20">
          <Sparkles className="h-3.5 w-3.5" />
          <span>The WorkSense Golden Path</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-content-primary">
          End-to-End Workforce Decision Intelligence
        </h1>
        <p className="text-sm sm:text-base text-content-secondary leading-relaxed">
          Follow the guided trajectory demonstrating how external candidate signals transform into active employee twins, retention intelligence, human approvals, and governed EnterPro workflows.
        </p>
      </div>

      {/* 2. Step Navigator Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 border-b border-boundary-subtle pb-4">
        {GOLDEN_STEPS.map((step) => {
          const isActive = step.id === activeStepId;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => setActiveStepId(step.id)}
              className={`p-3 rounded-xl text-left transition-all border ${
                isActive
                  ? "bg-brand-primary/10 border-brand-primary text-content-primary shadow-sm"
                  : "bg-surface border-boundary-subtle text-content-secondary hover:border-boundary-strong hover:bg-surface-secondary"
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                <span className={`font-bold ${isActive ? "text-brand-primary" : "text-content-muted"}`}>
                  {step.stepNumber}
                </span>
                <span className="text-[10px] uppercase truncate">{step.role.split("&")[0]}</span>
              </div>
              <div className="text-xs font-bold truncate">{step.title}</div>
            </button>
          );
        })}
      </div>

      {/* 3. Detailed Step Showcase Card */}
      <div className="bg-surface rounded-2xl border border-boundary-subtle p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-boundary-subtle pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-brand-primary text-white font-mono text-xs flex items-center justify-center font-bold">
                {currentStep.stepNumber}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-content-primary">
                {currentStep.title}
              </h2>
            </div>
            <p className="text-xs text-content-secondary">
              Operational Roles Involved: <span className="font-semibold text-content-primary">{currentStep.role}</span>
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-accent/15 text-brand-accent text-xs font-semibold border border-brand-accent/30 self-start sm:self-auto">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Human-Governed Stage</span>
          </div>
        </div>

        {/* Narrative Summary */}
        <p className="text-sm text-content-primary leading-relaxed bg-surface-secondary/50 p-4 rounded-xl border border-boundary-subtle">
          {currentStep.summary}
        </p>

        {/* Evidence & Verification Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Evidence Items */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase font-display tracking-wider text-content-muted flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-status-success" />
              <span>Grounded Evidence Captured</span>
            </h3>
            <ul className="space-y-2">
              {currentStep.evidence.map((item, idx) => (
                <li key={idx} className="text-xs text-content-secondary flex items-start gap-2 bg-surface p-2.5 rounded-lg border border-boundary-subtle">
                  <span className="text-brand-primary font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Sample Structured Artifact */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase font-display tracking-wider text-content-muted flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-brand-primary" />
              <span>Structured Data Artifact</span>
            </h3>
            <div className="bg-surface rounded-lg border border-boundary-subtle p-3 space-y-2 font-mono text-xs">
              {Object.entries(currentStep.sampleData).map(([k, v]) => (
                <div key={k} className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1 border-b border-boundary-subtle/50 last:border-0">
                  <span className="text-content-muted text-[11px]">{k}:</span>
                  <span className="font-semibold text-content-primary text-[11px]">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Action vs. Human Gate */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-brand-primary/5 border border-brand-primary/20 space-y-1">
            <div className="text-xs font-bold text-brand-primary flex items-center gap-1.5 uppercase tracking-wider">
              <Cpu className="h-3.5 w-3.5" />
              System / AI Function
            </div>
            <p className="text-xs text-content-secondary leading-relaxed">
              {currentStep.systemAction}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-status-success/5 border border-status-success/20 space-y-1">
            <div className="text-xs font-bold text-status-success flex items-center gap-1.5 uppercase tracking-wider">
              <ShieldCheck className="h-3.5 w-3.5" />
              Accountable Human Gate
            </div>
            <p className="text-xs text-content-secondary leading-relaxed">
              {currentStep.humanGate}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Ready to test real roles callout */}
      <div className="bg-surface-secondary/70 border border-boundary-subtle rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <h3 className="text-lg font-bold font-display text-content-primary">
            Ready to test real role-based workspaces?
          </h3>
          <p className="text-xs text-content-secondary max-w-xl">
            Sign in with authentic role credentials to experience candidate intake, recruiter pipelines, manager team views, and the HR decision dashboard.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-brand-primary hover:bg-brand-primary/90 transition-colors shadow-sm"
          >
            <span>Sign In with Pre-Seeded Credentials</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
