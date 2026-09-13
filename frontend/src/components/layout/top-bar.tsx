"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Building2, User, LogOut, ChevronDown } from "lucide-react";
import { fetchHealthStatus } from "@/lib/api/health";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utilities/cn";

export interface TopBarProps {
  onOpenMobileMenu?: () => void;
  className?: string;
}

const PAGE_TITLES: Record<string, string> = {
  "/": "Platform Overview",
  "/status": "System Status",
  "/design-system": "Design System Primitives",
  "/candidate": "Candidate Portal",
  "/employee": "Employee Self-Service",
  "/manager": "Team Leadership Workspace",
  "/recruiter": "Talent Acquisition Workspace",
  "/hr": "Workforce Operations",
  "/leadership": "Executive Decision Intelligence",
  "/admin/access": "Access Management Console",
  "/my-access": "My Access & Scope",
  "/auth/login": "Sign In",
  "/auth/register": "Candidate Registration",
  "/auth/forgot-password": "Password Recovery",
  "/auth/reset-password": "Set New Password",
  "/auth/invite": "Accept Invitation",
  "/unauthorized": "Access Restricted",
};

export function TopBar({ onOpenMobileMenu, className }: TopBarProps) {
  const pathname = usePathname();
  const { isAuthenticated, user, roles, activeOrg, availableOrgs, switchOrganization, logout } = useAuth();
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function checkHealth() {
      try {
        await fetchHealthStatus();
        if (isMounted) setIsBackendOnline(true);
      } catch {
        if (isMounted) setIsBackendOnline(false);
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const pageTitle = PAGE_TITLES[pathname] || "WorkSense";

  return (
    <header
      className={cn(
        "h-16 border-b border-boundary-subtle bg-surface px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 transition-colors",
        className
      )}
    >
      {/* Left: Mobile hamburger & Current Page Title */}
      <div className="flex items-center gap-3">
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-md text-content-secondary hover:text-content-primary hover:bg-surface-secondary focus-visible:outline-none"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        )}

        <h1 className="text-base sm:text-lg font-bold font-display text-content-primary tracking-tight">
          {pageTitle}
        </h1>
      </div>

      {/* Right: Tenant, User Role, Health Indicator, Theme Toggle */}
      <div className="flex items-center gap-3">
        {/* Multi-tenant Selector / Org Badge */}
        {isAuthenticated && activeOrg && (
          <div className="relative hidden sm:block">
            {availableOrgs.length > 1 ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-surface-secondary border border-boundary-subtle text-content-primary hover:bg-surface-secondary/80 focus:outline-none"
                >
                  <Building2 className="h-3.5 w-3.5 text-brand-primary" />
                  <span>{activeOrg.name}</span>
                  <ChevronDown className="h-3 w-3 text-content-muted" />
                </button>
                {isOrgDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-48 bg-surface rounded-md border border-boundary-subtle shadow-lg py-1 z-30">
                    <div className="px-3 py-1 text-[10px] uppercase font-bold text-content-muted tracking-wider">
                      Switch Organization
                    </div>
                    {availableOrgs.map((org) => (
                      <button
                        key={org.id}
                        type="button"
                        onClick={() => {
                          setIsOrgDropdownOpen(false);
                          if (org.id !== activeOrg.id) {
                            switchOrganization(org.id);
                          }
                        }}
                        className={cn(
                          "w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-surface-secondary transition-colors",
                          org.id === activeOrg.id ? "font-bold text-brand-primary" : "text-content-secondary"
                        )}
                      >
                        <span className="truncate">{org.name}</span>
                        {org.id === activeOrg.id && <span className="text-[10px]">Active</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-surface-secondary border border-boundary-subtle text-content-primary">
                <Building2 className="h-3.5 w-3.5 text-brand-primary" />
                <span>{activeOrg.name}</span>
              </div>
            )}
          </div>
        )}

        {/* Active Role Pill */}
        {isAuthenticated && user && (
          <Link
            href="/my-access"
            className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-brand-primary/10 text-brand-primary border border-brand-primary/20 hover:bg-brand-primary/20 transition-colors"
            title="Click to view My Access details"
          >
            <User className="h-3 w-3" />
            <span className="uppercase">{roles[0] || "User"}</span>
            <span className="text-content-muted font-normal">• {user.full_name}</span>
          </Link>
        )}

        {/* Backend Health indicator */}
        <Link
          href="/status"
          className="flex items-center gap-2 px-2 py-1 rounded-md text-xs font-medium transition-colors hover:bg-surface-secondary"
          title="Click to view detailed system health"
        >
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              isBackendOnline === null
                ? "bg-content-muted animate-pulse"
                : isBackendOnline
                ? "bg-status-success"
                : "bg-status-warning"
            )}
            aria-hidden="true"
          />
          <span className="text-content-secondary hidden lg:inline text-[11px]">
            {isBackendOnline === null
              ? "Probing API"
              : isBackendOnline
              ? "API Connected"
              : "API Standby"}
          </span>
        </Link>

        {/* Sign In / Sign Out Button */}
        {isAuthenticated ? (
          <button
            type="button"
            onClick={() => logout()}
            className="p-1.5 rounded-md text-content-muted hover:text-status-danger hover:bg-surface-secondary transition-colors"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        ) : (
          <Link
            href="/auth/login"
            className="px-2.5 py-1 rounded-md text-xs font-semibold text-white bg-brand-primary hover:bg-brand-primary/90 transition-colors"
          >
            Sign In
          </Link>
        )}

        <div className="pl-2 border-l border-boundary-subtle">
          <ThemeToggle variant="segmented" />
        </div>
      </div>
    </header>
  );
}
