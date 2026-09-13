"use client";

import React, { useState, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { ToastProvider } from "@/components/feedback/toast";
import { ErrorBoundary } from "@/components/feedback/error-boundary";

// Context to prevent any duplicate shell rendering if a nested page wraps in <AppShell>
const InAppShellContext = createContext<boolean>(false);

export interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const isAlreadyInShell = useContext(InAppShellContext);
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // If already inside an AppShell, render children directly without creating a nested shell
  if (isAlreadyInShell) {
    return <>{children}</>;
  }

  // 1. Public Experience (Homepage & Guided Walkthrough Demo)
  const isPublicRoute = pathname === "/" || pathname === "/demo";
  if (isPublicRoute) {
    return (
      <ToastProvider>
        <InAppShellContext.Provider value={true}>
          <div className="min-h-screen bg-canvas text-content-primary flex flex-col antialiased">
            <PublicHeader />
            <main className="flex-1 w-full">
              <ErrorBoundary>{children}</ErrorBoundary>
            </main>
            <PublicFooter />
          </div>
        </InAppShellContext.Provider>
      </ToastProvider>
    );
  }

  // 2. Standalone Authentication Experience
  const isAuthRoute = pathname?.startsWith("/auth") || pathname === "/unauthorized";
  if (isAuthRoute) {
    return (
      <ToastProvider>
        <InAppShellContext.Provider value={true}>
          <div className="min-h-screen bg-canvas text-content-primary flex flex-col antialiased">
            <header className="h-16 px-6 flex items-center justify-between border-b border-boundary-subtle bg-surface sticky top-0 z-20">
              <Link href="/" className="flex items-center gap-2">
                <div className="h-7 w-7 rounded bg-brand-primary flex items-center justify-center text-white font-bold text-sm font-display">
                  W
                </div>
                <span className="text-lg font-bold font-display tracking-tight text-content-primary">
                  Work<span className="text-brand-primary">Sense</span>
                </span>
              </Link>
              <div className="flex items-center gap-4">
                <Link
                  href="/"
                  className="text-xs text-content-secondary hover:text-content-primary font-medium transition-colors"
                >
                  ← Back to Platform Overview
                </Link>
                <div className="pl-3 border-l border-boundary-subtle">
                  <ThemeToggle variant="icon" />
                </div>
              </div>
            </header>
            <main className="flex-1 flex items-center justify-center p-4">
              <ErrorBoundary>{children}</ErrorBoundary>
            </main>
          </div>
        </InAppShellContext.Provider>
      </ToastProvider>
    );
  }

  // 3. Authenticated Role-Specific Experience (Single App Shell)
  return (
    <ToastProvider>
      <InAppShellContext.Provider value={true}>
        <div className="min-h-screen bg-canvas text-content-primary flex flex-col md:flex-row antialiased">
          {/* Desktop Sidebar */}
          <div className="hidden md:block flex-shrink-0">
            <Sidebar
              isCollapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
            />
          </div>

          {/* Mobile Navigation Drawer */}
          <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <TopBar onOpenMobileMenu={() => setMobileNavOpen(true)} />

            <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-[1440px] w-full max-w-full mx-auto overflow-x-clip">
              <ErrorBoundary>{children}</ErrorBoundary>
            </main>

            {/* Clean Platform Footer */}
            <footer className="border-t border-boundary-subtle px-4 sm:px-6 py-3 text-xs text-content-muted flex flex-col sm:flex-row items-center justify-between gap-2 bg-surface-secondary/20">
              <div>
                <span>WorkSense Workforce Intelligence Platform</span>
              </div>
              <div className="flex items-center gap-4 text-[11px]">
                <span>Evidence-Backed Reasoning</span>
                <span>•</span>
                <span>Accountable Human Decisions</span>
                <span>•</span>
                <span>EnterPro Orchestration</span>
              </div>
            </footer>
          </div>
        </div>
      </InAppShellContext.Provider>
    </ToastProvider>
  );
}
