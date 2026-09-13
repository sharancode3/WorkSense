"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getNavigationForUser } from "@/config/navigation";
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

export interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export function Sidebar({ isCollapsed = false, onToggleCollapse, className }: SidebarProps) {
  const pathname = usePathname();
  const { isAuthenticated, user, roles, activeOrg, logout } = useAuth();

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-surface border-r border-boundary-subtle transition-all duration-150 select-none z-30 sticky top-0",
        isCollapsed ? "w-[68px]" : "w-[240px]",
        className
      )}
    >
      {/* 1. Header & Brand Wordmark */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-boundary-subtle">
        {!isCollapsed ? (
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl font-extrabold tracking-tight font-display text-content-primary">
              Work<span className="text-brand-primary">Sense</span>
            </span>
          </Link>
        ) : (
          <Link href="/" className="mx-auto font-display font-extrabold text-lg text-brand-primary">
            WS
          </Link>
        )}

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-md text-content-muted hover:text-content-primary hover:bg-surface-secondary focus-visible:outline-none"
            aria-label={isCollapsed ? "Expand navigation sidebar" : "Collapse navigation sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      {/* 2. Navigation Links (Derived from Authenticated Role) */}
      <nav aria-label="Main Navigation" className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {getNavigationForUser(roles).map((group) => {
          if (!group.items || group.items.length === 0) return null;

          return (
            <div key={group.id} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-content-muted">
                  {group.title}
                </div>
              )}
              {group.items.map((item) => {
                const Icon = ICON_MAP[item.iconName] || LayoutDashboard;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors",
                      isCollapsed ? "justify-center px-2" : "",
                      isActive
                        ? "bg-brand-primary text-white font-semibold shadow-sm"
                        : "text-content-secondary hover:text-content-primary hover:bg-surface-secondary"
                    )}
                    title={item.title}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    {!isCollapsed && <span className="truncate">{item.title}</span>}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* 3. User Identity & Bottom Controls */}
      <div className="p-3 border-t border-boundary-subtle bg-surface-secondary/40 space-y-2">
        {isAuthenticated && user ? (
          <div className={cn("space-y-1.5", isCollapsed ? "text-center" : "")}>
            {!isCollapsed ? (
              <div className="p-2 rounded bg-surface border border-boundary-subtle text-xs space-y-1">
                <div className="font-semibold text-content-primary truncate">
                  {user.full_name}
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-brand-primary font-semibold capitalize truncate">
                    {roles[0] || "User"}
                  </span>
                  {activeOrg && (
                    <span className="text-content-muted font-mono truncate">
                      {activeOrg.slug}
                    </span>
                  )}
                </div>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => logout()}
              className={cn(
                "w-full flex items-center gap-2 py-1.5 px-2 rounded text-xs font-medium text-status-danger hover:bg-status-danger/10 transition-colors",
                isCollapsed ? "justify-center" : ""
              )}
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
              {!isCollapsed && <span>Sign Out</span>}
            </button>
          </div>
        ) : (
          <div>
            <Link
              href="/auth/login"
              className={cn(
                "w-full flex items-center gap-2 py-1.5 px-2 rounded text-xs font-medium text-brand-primary hover:bg-brand-primary/10 transition-colors",
                isCollapsed ? "justify-center" : ""
              )}
              title="Sign In"
            >
              <LogIn className="h-3.5 w-3.5" />
              {!isCollapsed && <span>Sign In</span>}
            </Link>
          </div>
        )}

        {!isCollapsed ? (
          <div className="flex items-center justify-between pt-1 border-t border-boundary-subtle">
            <span className="text-xs text-content-muted font-medium">Theme</span>
            <ThemeToggle variant="segmented" />
          </div>
        ) : (
          <div className="flex justify-center pt-1 border-t border-boundary-subtle">
            <ThemeToggle variant="icon" />
          </div>
        )}
      </div>
    </aside>
  );
}
