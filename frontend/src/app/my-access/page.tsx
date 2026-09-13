"use client";

import React from "react";
import { ShieldCheck, Building2, CheckCircle } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

export default function MyAccessPage() {
  const {
    user,
    activeOrg,
    roles,
    capabilities,
    membershipStatus,
    availableOrgs,
    switchOrganization,
    isLoading,
  } = useAuth();

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto space-y-8 py-4">
        {/* Header */}
        <div className="space-y-2 border-b border-boundary-subtle pb-4">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-brand-primary/10 text-xs font-semibold text-brand-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Identity & Access Transparency</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-content-primary">
            My Access & Governance Context
          </h1>
          <p className="text-sm text-content-secondary max-w-2xl">
            Authoritative breakdown of your identity verification, active organization tenancy, assigned functional roles, and explicit permission grants.
          </p>
        </div>

        {/* Identity & Tenancy Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. Identity */}
          <div className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-4">
            <h2 className="text-sm font-bold font-display uppercase tracking-wider text-content-muted flex items-center gap-2">
              <span>Verified Account Identity</span>
            </h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-boundary-subtle/50">
                <span className="text-content-secondary">Full Name:</span>
                <span className="font-semibold text-content-primary">{user?.full_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-boundary-subtle/50">
                <span className="text-content-secondary">Primary Email:</span>
                <span className="font-semibold text-content-primary">{user?.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-boundary-subtle/50">
                <span className="text-content-secondary">Identity Status:</span>
                <StatusBadge status="VERIFIED" />
              </div>
              <div className="flex justify-between py-1">
                <span className="text-content-secondary">Account ID:</span>
                <span className="font-mono text-[10px] text-content-muted">{user?.id}</span>
              </div>
            </div>
          </div>

          {/* 2. Organization Boundary */}
          <div className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-4">
            <h2 className="text-sm font-bold font-display uppercase tracking-wider text-content-muted flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span>Active Organization Tenant</span>
            </h2>
            {activeOrg ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-boundary-subtle/50">
                  <span className="text-content-secondary">Organization:</span>
                  <span className="font-semibold text-content-primary">{activeOrg.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-boundary-subtle/50">
                  <span className="text-content-secondary">Tenant Slug:</span>
                  <span className="font-mono text-content-primary">{activeOrg.slug}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-boundary-subtle/50">
                  <span className="text-content-secondary">Membership Status:</span>
                  <span className="capitalize font-semibold text-status-success">
                    {membershipStatus || "Active"}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-content-secondary">Tenant ID:</span>
                  <span className="font-mono text-[10px] text-content-muted">{activeOrg.id}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-content-secondary">
                Public Candidate Boundary (Zero organizational tenant membership).
              </p>
            )}
          </div>
        </div>

        {/* Multi-Tenant Switcher (if user belongs to multiple organizations) */}
        {availableOrgs.length > 1 && (
          <div className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-3">
            <h3 className="text-sm font-bold font-display text-content-primary">
              Switch Organization Tenancy
            </h3>
            <p className="text-xs text-content-secondary">
              You hold verified memberships in multiple enterprise tenants. Switching recalculates your access boundaries in real time.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {availableOrgs.map((org) => {
                const isActive = activeOrg?.id === org.id;
                return (
                  <Button
                    key={org.id}
                    variant={isActive ? "primary" : "secondary"}
                    size="sm"
                    disabled={isActive || isLoading}
                    onClick={() => switchOrganization(org.id)}
                  >
                    <Building2 className="h-3.5 w-3.5 mr-1.5" />
                    <span>{org.name}</span>
                    {isActive && <CheckCircle className="h-3.5 w-3.5 ml-1.5" />}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Roles */}
        <div className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-3">
          <h3 className="text-sm font-bold font-display text-content-primary">
            Active System Roles
          </h3>
          <div className="flex flex-wrap gap-2">
            {roles.map((r) => (
              <span
                key={r}
                className="px-3 py-1 rounded-md text-xs font-semibold bg-brand-primary/10 text-brand-primary border border-brand-primary/20 capitalize"
              >
                {r}
              </span>
            ))}
          </div>
        </div>

        {/* Explicit Granted Capabilities */}
        <div className="bg-surface rounded-xl border border-boundary-subtle p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold font-display text-content-primary">
                Explicit Granted Capabilities ({capabilities.length})
              </h3>
              <p className="text-xs text-content-secondary mt-0.5">
                Every backend action and UI destination requires an explicit capability.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {capabilities.map((cap) => (
              <div
                key={cap}
                className="flex items-center gap-2 p-2 rounded-lg bg-surface-secondary text-xs text-content-primary font-mono border border-boundary-subtle"
              >
                <CheckCircle className="h-3.5 w-3.5 text-status-success flex-shrink-0" />
                <span className="truncate">{cap}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Governance Process Note */}
        <div className="bg-surface-secondary border border-boundary-subtle rounded-xl p-5 space-y-2 text-xs text-content-secondary">
          <h4 className="font-bold font-display text-content-primary">
            How to Request Role or Access Adjustments
          </h4>
          <p>
            WorkSense adheres to the principle of least privilege. To request additional roles or modifications to your organizational tenancy, please contact your organization administrator or Strategic People Partner. All role modifications are recorded in the immutable security audit ledger.
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
