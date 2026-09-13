"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Database,
  HardDrive,
  Cpu,
  GitBranch,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { fetchHealthStatus } from "@/lib/api/health";
import { HealthResponse } from "@/types";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function SystemStatusPage() {
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const loadHealth = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchHealthStatus();
      setHealthData(data);
      setLastChecked(new Date());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to connect to backend service";
      setError(msg);
      setHealthData(null);
      setLastChecked(new Date());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHealth();
  }, [loadHealth]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-boundary-subtle">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-content-primary">
            System & Subsystem Status
          </h1>
          <p className="text-xs sm:text-sm text-content-secondary mt-1">
            Real-time readiness probe inspecting backend modular services, storage, and AI gateways.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastChecked && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-content-muted">
              <Clock className="h-3.5 w-3.5" />
              <span>Checked {lastChecked.toLocaleTimeString()}</span>
            </div>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={loadHealth}
            isLoading={isLoading}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />}
          >
            Refresh Status
          </Button>
        </div>
      </div>

      {/* 2. Primary Liveness & Overall State */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Frontend Subsystem */}
        <div className="p-5 rounded-lg bg-surface border border-boundary-subtle space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-display uppercase tracking-wider text-content-muted">
              Frontend Client
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-status-success">
              <CheckCircle2 className="h-3.5 w-3.5" /> Operational
            </span>
          </div>
          <p className="text-lg font-bold font-display text-content-primary">Next.js 14 App Router</p>
          <p className="text-xs text-content-secondary">
            Standalone build · Strict TypeScript · Flat Design System Tokens
          </p>
        </div>

        {/* Backend Subsystem */}
        <div className="p-5 rounded-lg bg-surface border border-boundary-subtle space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-display uppercase tracking-wider text-content-muted">
              Backend Service
            </span>
            {isLoading ? (
              <span className="text-xs text-content-muted">Probing...</span>
            ) : healthData ? (
              <StatusBadge status={healthData.status} size="sm" />
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-status-warning">
                <AlertCircle className="h-3.5 w-3.5" /> Standby / Unreachable
              </span>
            )}
          </div>
          <p className="text-lg font-bold font-display text-content-primary">
            {isLoading ? "Checking..." : healthData ? `FastAPI v${healthData.version}` : "FastAPI Standby"}
          </p>
          <p className="text-xs text-content-secondary">
            {healthData
              ? `Environment: ${healthData.environment} · Req ID: ${healthData.request_id?.slice(0, 8)}...`
              : "Ensure backend is running locally on port 8000"}
          </p>
        </div>
      </div>

      {/* 3. Deep Subsystem Readiness Breakdown */}
      <div className="p-6 rounded-lg bg-surface-secondary border border-boundary-subtle space-y-5">
        <div>
          <h2 className="text-sm font-bold font-display uppercase tracking-wider text-content-primary">
            Subsystem Readiness Probes
          </h2>
          <p className="text-xs text-content-muted mt-0.5">
            Truthful diagnostic breakdown reported by <code className="font-mono text-content-primary">GET /api/v1/health</code>.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 rounded-md bg-surface border border-boundary-subtle space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        ) : healthData ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Database */}
            <div className="p-4 rounded-md bg-surface border border-boundary-subtle space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-content-primary flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5 text-brand-primary" /> PostgreSQL
                </span>
                <StatusBadge status={healthData.components.database.status} size="sm" />
              </div>
              <p className="text-xs text-content-muted leading-relaxed">
                {healthData.components.database.detail || "Supabase database connection"}
              </p>
            </div>

            {/* Storage */}
            <div className="p-4 rounded-md bg-surface border border-boundary-subtle space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-content-primary flex items-center gap-1.5">
                  <HardDrive className="h-3.5 w-3.5 text-brand-primary" /> Object Storage
                </span>
                <StatusBadge status={healthData.components.storage.status} size="sm" />
              </div>
              <p className="text-xs text-content-muted leading-relaxed">
                {healthData.components.storage.detail || "Resume and document bucket"}
              </p>
            </div>

            {/* AI Gateway */}
            <div className="p-4 rounded-md bg-surface border border-boundary-subtle space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-content-primary flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-brand-primary" /> Qwen Gateway
                </span>
                <StatusBadge status={healthData.components.qwen_ai_gateway.status} size="sm" />
              </div>
              <p className="text-xs text-content-muted leading-relaxed">
                {healthData.components.qwen_ai_gateway.detail || "Local laptop tunnel (port 8001)"}
              </p>
            </div>

            {/* EnterPro */}
            <div className="p-4 rounded-md bg-surface border border-boundary-subtle space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-content-primary flex items-center gap-1.5">
                  <GitBranch className="h-3.5 w-3.5 text-brand-primary" /> EnterPro
                </span>
                <StatusBadge status={healthData.components.enterpro_orchestrator.status} size="sm" />
              </div>
              <p className="text-xs text-content-muted leading-relaxed">
                {healthData.components.enterpro_orchestrator.detail || "Enterprise workflow webhook adapter"}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-5 rounded-md bg-surface border border-boundary-subtle text-center space-y-3">
            <p className="text-xs text-content-secondary max-w-md mx-auto">
              Backend service is currently unreachable. Start the FastAPI server using{" "}
              <code className="font-mono bg-surface-secondary px-1.5 py-0.5 rounded text-[11px]">
                python -m uvicorn app.main:app --port 8000
              </code>
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={loadHealth}
              isLoading={isLoading}
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            >
              Retry Connection
            </Button>
          </div>
        )}

        {/* Technical Diagnostics (Collapsible) */}
        {error && (
          <details className="p-3.5 rounded bg-surface border border-boundary-subtle text-xs text-content-muted font-mono">
            <summary className="cursor-pointer font-sans font-semibold text-content-secondary mb-2 select-none">
              Technical diagnostics details
            </summary>
            <pre className="overflow-x-auto whitespace-pre-wrap text-[11px] text-content-muted bg-surface-secondary p-3 rounded">
              {error}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
