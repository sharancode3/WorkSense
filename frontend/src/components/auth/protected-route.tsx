"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Spinner } from "@/components/ui/spinner";

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredCapability?: string;
  allowedRoles?: string[];
}

export function ProtectedRoute({
  children,
  requiredCapability,
  allowedRoles,
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, membershipStatus, hasCapability, hasRole } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        const returnParam = pathname && pathname !== "/" ? `?returnUrl=${encodeURIComponent(pathname)}` : "";
        router.replace(`/auth/login${returnParam}`);
        return;
      }

      // Suspended membership must never access normal workspace routes
      if (membershipStatus === "suspended") {
        router.replace("/unauthorized");
        return;
      }

      if (requiredCapability && !hasCapability(requiredCapability)) {
        router.replace("/unauthorized");
        return;
      }

      if (allowedRoles && allowedRoles.length > 0) {
        const matchesRole = allowedRoles.some((role) => hasRole(role));
        if (!matchesRole) {
          router.replace("/unauthorized");
          return;
        }
      }
    }
  }, [isAuthenticated, isLoading, membershipStatus, requiredCapability, allowedRoles, hasCapability, hasRole, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <Spinner size="lg" className="text-brand-primary" />
        <p className="text-sm text-content-secondary font-medium animate-pulse">
          Verifying authorization...
        </p>
      </div>
    );
  }

  if (!isAuthenticated || membershipStatus === "suspended") {
    return null;
  }

  if (requiredCapability && !hasCapability(requiredCapability)) {
    return null;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const matchesRole = allowedRoles.some((role) => hasRole(role));
    if (!matchesRole) {
      return null;
    }
  }

  return <>{children}</>;
}
