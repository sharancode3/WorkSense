"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  X,
  LayoutDashboard,
  Palette,
  Activity,
  UserCheck,
  User,
  Users,
  UserSearch,
  Briefcase,
  BarChart3,
  ShieldAlert,
  Shield,
  Building2,
  BookOpen,
  Share2,
  FileText,
  FilePlus,
  AlertCircle,
  LogIn,
  LogOut,
} from "lucide-react";
import { NAVIGATION_GROUPS } from "@/config/navigation";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utilities/cn";

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Palette,
  Activity,
  UserCheck,
  User,
  Users,
  UserSearch,
  Briefcase,
  BarChart3,
  ShieldAlert,
  Shield,
  Building2,
  BookOpen,
  Share2,
  FileText,
  FilePlus,
  AlertCircle,
};

export interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const { isAuthenticated, user, roles, activeOrg, hasCapability, logout } = useAuth();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden flex">
      {/* Flat Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Flat Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        className="relative z-50 w-72 max-w-[80vw] h-full bg-surface border-r border-boundary-subtle p-4 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-left duration-150"
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-boundary-subtle">
            <Link
              href="/"
              onClick={onClose}
              className="text-xl font-extrabold font-display tracking-tight text-content-primary"
            >
              Work<span className="text-brand-primary">Sense</span>
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-content-muted hover:text-content-primary hover:bg-surface-secondary focus-visible:outline-none"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* User badge if authenticated */}
          {isAuthenticated && user && (
            <div className="p-2.5 rounded bg-surface-secondary border border-boundary-subtle text-xs space-y-1">
              <div className="font-semibold text-content-primary">{user.full_name}</div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-brand-primary font-semibold capitalize">
                  {roles[0] || "User"}
                </span>
                {activeOrg && (
                  <span className="text-content-muted font-mono">{activeOrg.slug}</span>
                )}
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <nav aria-label="Mobile Site Navigation" className="space-y-4">
            {NAVIGATION_GROUPS.map((group) => {
              const visibleItems = group.items.filter((item) => {
                if (item.allowedRoles && item.allowedRoles.length > 0) {
                  if (!isAuthenticated) return false;
                  return roles.some((r) => item.allowedRoles?.includes(r));
                }
                if (item.requiredCapability) {
                  return isAuthenticated && hasCapability(item.requiredCapability);
                }
                if (item.id === "my-access") {
                  return isAuthenticated;
                }
                return true;
              });

              if (visibleItems.length === 0) return null;

              return (
                <div key={group.id} className="space-y-1">
                  <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-content-muted">
                    {group.title}
                  </div>
                  {visibleItems.map((item) => {
                    const Icon = ICON_MAP[item.iconName] || LayoutDashboard;
                    const isActive = pathname === item.href;

                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors",
                          isActive
                            ? "bg-brand-primary text-white font-semibold"
                            : "text-content-secondary hover:text-content-primary hover:bg-surface-secondary"
                        )}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        <span>{item.title}</span>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Footer with Auth & Theme */}
        <div className="pt-4 border-t border-boundary-subtle space-y-3">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                logout();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded text-xs font-semibold text-status-danger bg-status-danger/10 hover:bg-status-danger/20 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          ) : (
            <Link
              href="/auth/login"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded text-xs font-semibold text-white bg-brand-primary hover:bg-brand-primary/90 transition-colors"
            >
              <LogIn className="h-4 w-4" />
              <span>Sign In</span>
            </Link>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-boundary-subtle/50">
            <span className="text-xs text-content-muted font-medium">Theme</span>
            <ThemeToggle variant="segmented" />
          </div>
        </div>
      </div>
    </div>
  );
}
