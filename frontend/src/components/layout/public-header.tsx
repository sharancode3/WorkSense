"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, LogIn, Menu, X, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useAuth } from "@/context/auth-context";

export function PublicHeader() {
  const { isAuthenticated, defaultDestination } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-boundary-subtle bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-brand-primary flex items-center justify-center text-white font-bold text-lg font-display shadow-sm">
            W
          </div>
          <span className="text-xl font-extrabold tracking-tight font-display text-content-primary">
            Work<span className="text-brand-primary">Sense</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-content-secondary">
          <Link href="/#operating-loop" className="hover:text-content-primary transition-colors">
            Operating Loop
          </Link>
          <Link href="/#capabilities" className="hover:text-content-primary transition-colors">
            Capabilities
          </Link>
          <Link href="/#trust-governance" className="hover:text-content-primary transition-colors">
            Responsible AI & Trust
          </Link>
          <Link href="/demo" className="hover:text-brand-primary transition-colors flex items-center gap-1.5 font-semibold text-content-primary">
            <Sparkles className="h-3.5 w-3.5 text-brand-primary" />
            <span>Guided Demo</span>
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle variant="icon" />

          {isAuthenticated ? (
            <Link
              href={defaultDestination || "/dashboard"}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-brand-primary hover:bg-brand-primary/90 transition-colors shadow-sm"
            >
              <span>Go to Workspace</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-content-primary hover:bg-surface-secondary border border-boundary-subtle transition-colors"
              >
                <LogIn className="h-3.5 w-3.5 text-content-muted" />
                <span>Sign In</span>
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-brand-primary hover:bg-brand-primary/90 transition-colors shadow-sm"
              >
                <span>Explore Golden Path</span>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle variant="icon" />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-content-secondary hover:text-content-primary hover:bg-surface-secondary focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-boundary-subtle bg-surface px-4 py-4 space-y-3">
          <Link
            href="/#operating-loop"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-content-secondary hover:text-content-primary py-1"
          >
            Operating Loop
          </Link>
          <Link
            href="/#capabilities"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-content-secondary hover:text-content-primary py-1"
          >
            Capabilities
          </Link>
          <Link
            href="/#trust-governance"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-content-secondary hover:text-content-primary py-1"
          >
            Responsible AI & Trust
          </Link>
          <Link
            href="/demo"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-brand-primary py-1"
          >
            Guided Demo Walkthrough
          </Link>
          <div className="pt-3 border-t border-boundary-subtle flex flex-col gap-2">
            {isAuthenticated ? (
              <Link
                href={defaultDestination || "/dashboard"}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 rounded-md text-xs font-semibold text-white bg-brand-primary"
              >
                Go to Workspace
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 rounded-md text-xs font-semibold border border-boundary-subtle text-content-primary hover:bg-surface-secondary"
                >
                  Sign In
                </Link>
                <Link
                  href="/demo"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 rounded-md text-xs font-semibold text-white bg-brand-primary"
                >
                  Explore Golden Path
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
