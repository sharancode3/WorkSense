"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ToastProvider } from "@/components/feedback/toast";
import { ErrorBoundary } from "@/components/feedback/error-boundary";

export interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <ToastProvider>
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

          <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-[1440px] w-full mx-auto">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>

          {/* Minimal Foundation Footer */}
          <footer className="border-t border-boundary-subtle px-4 sm:px-6 py-3 text-xs text-content-muted flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              <span>WorkSense Platform Foundation</span> · <span className="font-mono">Stage 1</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span>Next.js 14 App Router</span>
              <span>•</span>
              <span>FastAPI Backend</span>
              <span>•</span>
              <span className="text-status-success font-medium">Ready</span>
            </div>
          </footer>
        </div>
      </div>
    </ToastProvider>
  );
}
