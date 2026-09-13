"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, ArrowRight, UserCheck } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  const { user, roles, activeOrg, defaultDestination } = useAuth();

  return (
    <div className="min-h-[70vh] flex flex-col justify-center max-w-lg mx-auto py-12 px-4 text-center">
      <div className="bg-surface rounded-xl border border-boundary-subtle shadow-sm p-8 space-y-6">
        <div className="inline-flex items-center justify-center p-3.5 bg-status-danger/10 rounded-full text-status-danger mx-auto">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold font-display text-content-primary">
            Access Restricted
          </h1>
          <p className="text-sm text-content-secondary leading-relaxed">
            Your authenticated identity does not possess the explicit permissions or organizational scope required to access this resource.
          </p>
        </div>

        {user && (
          <div className="bg-surface-secondary border border-boundary-subtle rounded-lg p-4 text-left text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-content-muted">Authenticated User:</span>
              <span className="font-semibold text-content-primary">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-content-muted">Active Role(s):</span>
              <span className="font-semibold text-brand-primary capitalize">
                {roles.join(", ") || "None"}
              </span>
            </div>
            {activeOrg && (
              <div className="flex justify-between">
                <span className="text-content-muted">Organization Boundary:</span>
                <span className="font-semibold text-content-primary">{activeOrg.name}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href={defaultDestination || "/"} className="w-full sm:w-auto">
            <Button variant="primary" className="w-full justify-center">
              <span>Go to My Workspace</span>
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
          <Link href="/my-access" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full justify-center">
              <UserCheck className="h-4 w-4 mr-1.5" />
              <span>View My Access</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
