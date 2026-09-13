"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Cpu, Lock } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="border-t border-boundary-subtle bg-surface-secondary/40 text-content-secondary mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Identity */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded bg-brand-primary flex items-center justify-center text-white font-bold text-sm font-display">
                W
              </div>
              <span className="text-lg font-bold font-display tracking-tight text-content-primary">
                Work<span className="text-brand-primary">Sense</span>
              </span>
            </div>
            <p className="text-xs text-content-secondary max-w-sm leading-relaxed">
              AI-driven workforce intelligence platform connecting recruitment, onboarding, policies, performance, attendance, and skills data into grounded recommendations governed by human accountability.
            </p>
            <div className="flex items-center gap-4 text-xs pt-1 text-content-muted">
              <span className="flex items-center gap-1">
                <Cpu className="h-3.5 w-3.5 text-brand-primary" />
                Local Qwen Reasoning
              </span>
              <span className="flex items-center gap-1">
                <Lock className="h-3.5 w-3.5 text-status-success" />
                Row-Level Security
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-brand-accent" />
                Accountable Human Control
              </span>
            </div>
          </div>

          {/* Col 2: Platform */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase font-display tracking-wider text-content-primary">
              Platform Architecture
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/#operating-loop" className="hover:text-content-primary transition-colors">
                  Operating Loop
                </Link>
              </li>
              <li>
                <Link href="/#capabilities" className="hover:text-content-primary transition-colors">
                  Core Capabilities
                </Link>
              </li>
              <li>
                <Link href="/#trust-governance" className="hover:text-content-primary transition-colors">
                  Responsible AI & Trust
                </Link>
              </li>
              <li>
                <Link href="/demo" className="hover:text-content-primary transition-colors">
                  Golden Path Walkthrough
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Workspaces & Security */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase font-display tracking-wider text-content-primary">
              Role Governance
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link href="/auth/login" className="hover:text-content-primary transition-colors">
                  Sign In to Workspace
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="hover:text-content-primary transition-colors">
                  Candidate Application
                </Link>
              </li>
              <li>
                <span className="text-content-muted">EnterPro Dispatch Ready</span>
              </li>
              <li>
                <span className="text-content-muted">Zero Hallucination Guardrails</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-boundary-subtle flex flex-col sm:flex-row items-center justify-between text-xs text-content-muted gap-3">
          <p>© {new Date().getFullYear()} WorkSense Platform. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Evidence-First Architecture</span>
            <span>•</span>
            <span>Local AI Model Privacy</span>
            <span>•</span>
            <span>Human Approval Gate</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
