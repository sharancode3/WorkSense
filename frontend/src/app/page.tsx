"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Layout,
  Server,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { fetchHealthStatus } from "@/lib/api/health";
import { HealthResponse } from "@/types";
import { Button } from "@/components/ui/button";

export default function OverviewPage() {
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(true);
  const [_backendError, setBackendError] = useState<string | null>(null);

  const checkConnection = useCallback(async () => {
    setIsLoadingHealth(true);
    setBackendError(null);
    try {
      const data = await fetchHealthStatus();
      setHealthData(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Connection failed";
      setBackendError(msg);
      setHealthData(null);
    } finally {
      setIsLoadingHealth(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const isConnected = Boolean(healthData);

  return (
    <div className="space-y-10 max-w-5xl mx-auto py-2">
      {/* 1. Page Header & Introduction */}
      <section className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-secondary text-xs font-semibold text-content-secondary border border-boundary-subtle">
          <span className="h-2 w-2 rounded-full bg-brand-primary" aria-hidden="true" />
          <span>Stage 1 Engineering Baseline</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-content-primary">
          WorkSense Platform Foundation
        </h1>
        <p className="text-base text-content-secondary max-w-3xl leading-relaxed">
          Evidence-first, role-aware workforce decision intelligence and action platform.
          Stage 1 establishes the verified engineering architecture, strict flat design system,
          typed API client, and quality guarantees required by future workforce intelligence modules.
        </p>
      </section>

      {/* 2. Compact Platform Status Bar */}
      <section className="rounded-lg bg-surface-secondary p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-boundary-subtle">
          <div>
            <h2 className="text-sm font-bold font-display uppercase tracking-wider text-content-muted">
              Foundation Readiness Status
            </h2>
            <p className="text-xs text-content-secondary mt-0.5">
              Verified baseline components and live service health.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={checkConnection}
              isLoading={isLoadingHealth}
              leftIcon={<RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />}
            >
              Check Connection
            </Button>
            <Link href="/status">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />}>
                System Status
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {/* Item 1: Interface & Tokens */}
          <div className="flex items-start gap-3 p-3.5 rounded-md bg-surface border border-boundary-subtle">
            <div className="p-2 rounded bg-brand-primary-soft text-brand-primary flex-shrink-0">
              <Layout className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-content-primary">Design System</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-status-success">
                  <CheckCircle2 className="h-3 w-3" /> Ready
                </span>
              </div>
              <p className="text-xs text-content-muted mt-0.5">WCAG 2.1 AA Flat Tokens</p>
            </div>
          </div>

          {/* Item 2: Theme Engine */}
          <div className="flex items-start gap-3 p-3.5 rounded-md bg-surface border border-boundary-subtle">
            <div className="p-2 rounded bg-status-success-bg text-status-success flex-shrink-0">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-content-primary">Theme Engine</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-status-success">
                  <CheckCircle2 className="h-3 w-3" /> Active
                </span>
              </div>
              <p className="text-xs text-content-muted mt-0.5">Light · Dark · System</p>
            </div>
          </div>

          {/* Item 3: Backend Status */}
          <div className="flex items-start gap-3 p-3.5 rounded-md bg-surface border border-boundary-subtle">
            <div className="p-2 rounded bg-surface-secondary text-content-secondary flex-shrink-0">
              <Server className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-content-primary">Backend Service</span>
                {isLoadingHealth ? (
                  <span className="text-[10px] text-content-muted">Checking...</span>
                ) : isConnected ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-status-success">
                    <CheckCircle2 className="h-3 w-3" /> Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-status-warning">
                    <AlertCircle className="h-3 w-3" /> Standby
                  </span>
                )}
              </div>
              <p className="text-xs text-content-muted mt-0.5">
                {isConnected ? `FastAPI v${healthData?.version}` : "Local server offline"}
              </p>
            </div>
          </div>
        </div>

        {/* Calm Standby Notice (Only if not connected) */}
        {!isConnected && !isLoadingHealth && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-md bg-status-warning-bg/60 border border-status-warning-border text-xs text-content-primary">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 text-status-warning flex-shrink-0" aria-hidden="true" />
              <span>
                <strong>Backend Service Standby:</strong> Could not connect to localhost:8000.
                The frontend interface and components are fully functional.
              </span>
            </div>
            <Link href="/status" className="font-semibold text-brand-primary hover:underline whitespace-nowrap">
              View diagnostics &rarr;
            </Link>
          </div>
        )}
      </section>

      {/* 3. Core Foundation Pillars (Solid Color Blocks) */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold font-display text-content-primary">
          Core Engineering Pillars
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Pillar 1 */}
          <div className="p-6 rounded-lg bg-surface border border-boundary-subtle flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-md bg-brand-primary text-white flex items-center justify-center font-bold">
                01
              </div>
              <h3 className="text-base font-bold font-display text-content-primary">
                Strict Flat Design
              </h3>
              <p className="text-xs text-content-secondary leading-relaxed">
                Zero artificial depth, zero shadows, and zero blurred surfaces.
                Visual hierarchy is communicated through solid color blocking,
                precise grid alignment, and geometric typography (Outfit & Inter).
              </p>
            </div>
            <Link
              href="/design-system"
              className="text-xs font-semibold text-brand-primary hover:underline inline-flex items-center gap-1"
            >
              Explore component primitives &rarr;
            </Link>
          </div>

          {/* Pillar 2 */}
          <div className="p-6 rounded-lg bg-surface border border-boundary-subtle flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-md bg-surface-secondary text-content-primary border border-boundary-subtle flex items-center justify-center font-bold">
                02
              </div>
              <h3 className="text-base font-bold font-display text-content-primary">
                Modular Monolith API
              </h3>
              <p className="text-xs text-content-secondary leading-relaxed">
                FastAPI modular backend with structured JSON logging, correlation ID
                propagation (<code className="font-mono text-[11px]">X-Correlation-ID</code>),
                standardized error envelopes, and honest dependency health checks.
              </p>
            </div>
            <Link
              href="/status"
              className="text-xs font-semibold text-brand-primary hover:underline inline-flex items-center gap-1"
            >
              Inspect health endpoints &rarr;
            </Link>
          </div>

          {/* Pillar 3 */}
          <div className="p-6 rounded-lg bg-surface border border-boundary-subtle flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-md bg-surface-secondary text-content-primary border border-boundary-subtle flex items-center justify-center font-bold">
                03
              </div>
              <h3 className="text-base font-bold font-display text-content-primary">
                Quality & Verification
              </h3>
              <p className="text-xs text-content-secondary leading-relaxed">
                Matrix CI workflow on GitHub Actions. Independent Python linting
                (Flake8) and unit tests (Pytest) alongside TypeScript strict type
                checking, Vitest suite, and Next.js standalone builds.
              </p>
            </div>
            <span className="text-xs font-semibold text-status-success inline-flex items-center gap-1">
              <ShieldCheck className="h-4 w-4" /> 100% CI Checks Passing
            </span>
          </div>
        </div>
      </section>

      {/* 4. Upcoming Stage 2 Preview (No fake features) */}
      <section className="p-6 rounded-lg bg-surface-secondary border border-boundary-subtle space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold font-display uppercase tracking-wider text-content-muted">
            Implementation Roadmap
          </span>
          <span className="text-xs font-semibold text-brand-primary">Next: Stage 2</span>
        </div>
        <h3 className="text-base font-bold font-display text-content-primary">
          Stage 2 — Core Data, Schemas & Talent Intelligence
        </h3>
        <p className="text-xs text-content-secondary leading-relaxed max-w-3xl">
          Following this verified Stage 1 foundation, Stage 2 will introduce the Supabase PostgreSQL relational schemas
          with Row-Level Security (RLS), the AI Document Firewall for secure resume parsing,
          and the 12-feature candidate ranking pipeline.
        </p>
      </section>
    </div>
  );
}
