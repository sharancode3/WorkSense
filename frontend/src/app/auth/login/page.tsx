"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, ArrowRight, KeyRound, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineAlert } from "@/components/feedback/inline-alert";

const DEMO_PERSONAS = [
  { label: "Administrator", email: "admin@techcorp.local", role: "admin", desc: "Access, governance, integrations & system health" },
  { label: "HR Business Partner", email: "hr@techcorp.local", role: "hr", desc: "Workforce dashboard, retention risk, policy reasoning" },
  { label: "People Manager", email: "manager@techcorp.local", role: "manager", desc: "Direct reports, team skills & onboarding reviews" },
  { label: "Technical Recruiter", email: "recruiter@techcorp.local", role: "recruiter", desc: "Requisitions, applicant evaluation & interview kits" },
  { label: "Employee", email: "employee@techcorp.local", role: "employee", desc: "Personal onboarding, goals & policy assistance" },
  { label: "Candidate", email: "candidate@worksense.local", role: "candidate", desc: "Application status, resume upload & interviews" },
  { label: "Executive Leadership", email: "leadership@techcorp.local", role: "leadership", desc: "Aggregate workforce trends & strategic mobility" },
  { label: "Suspended User (Test)", email: "suspended@techcorp.local", role: "suspended", desc: "Verification of deactivated account rejection" },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const executeLogin = async (userEmail: string, userPass: string) => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const ctx = await login({ email: userEmail, password: userPass });
      if (returnUrl && returnUrl.startsWith("/") && !returnUrl.startsWith("/auth")) {
        router.push(returnUrl);
      } else {
        router.push(ctx.default_destination);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed. Please check your credentials.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please enter both work email and password.");
      return;
    }
    await executeLogin(email, password);
  };

  const handleQuickLogin = async (personaEmail: string) => {
    setEmail(personaEmail);
    setPassword("DemoPassword123!");
    await executeLogin(personaEmail, "DemoPassword123!");
  };

  return (
    <div className="w-full max-w-md mx-auto py-8">
      <div className="bg-surface rounded-xl border border-boundary-subtle shadow-sm p-6 sm:p-8 space-y-6">
        {/* Brand & Heading */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-2.5 bg-brand-primary/10 rounded-xl text-brand-primary mb-1">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold font-display tracking-tight text-content-primary">
            Sign In to Work<span className="text-brand-primary">Sense</span>
          </h1>
          <p className="text-xs text-content-secondary max-w-xs mx-auto">
            Evidence-First Workforce Decision Intelligence Platform
          </p>
        </div>

        {returnUrl && (
          <div className="p-2.5 rounded-lg bg-surface-secondary border border-boundary-subtle text-xs text-content-secondary text-center">
            Sign in to access <span className="font-mono text-content-primary">{returnUrl}</span>
          </div>
        )}

        {errorMsg && (
          <InlineAlert variant="danger" title="Authentication Error">
            {errorMsg}
          </InlineAlert>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="login-email"
            label="Work Email"
            type="email"
            required
            autoComplete="email"
            placeholder="name@organization.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
          />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="login-password" className="text-xs font-semibold text-content-secondary">
                Password
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-xs text-brand-primary hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-primary p-1 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full justify-center mt-2"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            <span>Sign In</span>
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </form>

        {/* Candidate Self-Registration Callout */}
        <div className="pt-4 border-t border-boundary-subtle text-center text-xs text-content-secondary">
          <span>Applying for an open position? </span>
          <Link
            href="/auth/register"
            className="text-brand-primary font-semibold hover:underline ml-1"
          >
            Register as Candidate
          </Link>
        </div>

        {/* Pre-calibrated Demo Credentials Drawer (Separated from production form) */}
        <details className="group border border-boundary-subtle rounded-lg bg-surface-secondary/40 text-xs overflow-hidden">
          <summary className="cursor-pointer p-3 flex items-center justify-between font-semibold text-content-secondary hover:text-content-primary select-none">
            <span className="flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5 text-brand-primary" />
              Demo Environment Quick Access
            </span>
            <ChevronDown className="h-4 w-4 text-content-muted transition-transform group-open:rotate-180" />
          </summary>
          <div className="p-3 pt-0 border-t border-boundary-subtle/50 space-y-2 mt-2">
            <p className="text-[11px] text-content-muted">
              Pre-seeded prototype accounts authenticate through the authoritative backend API with real JWT tokens and Row-Level Security:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {DEMO_PERSONAS.map((p) => (
                <button
                  key={p.email}
                  id={`demo-${p.role}`}
                  type="button"
                  onClick={() => handleQuickLogin(p.email)}
                  disabled={isSubmitting}
                  className="text-left p-2 rounded bg-surface hover:bg-surface-secondary border border-boundary-subtle transition-colors focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  title={`Sign in as ${p.label}: ${p.email}`}
                >
                  <div className="font-semibold text-[11px] text-content-primary flex items-center justify-between">
                    <span>{p.label}</span>
                    <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-surface-secondary text-content-muted">
                      {p.role}
                    </span>
                  </div>
                  <div className="text-[10px] text-content-secondary truncate">{p.email}</div>
                </button>
              ))}
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center p-8 text-sm text-content-secondary">Loading sign in...</div>}>
      <LoginForm />
    </Suspense>
  );
}
