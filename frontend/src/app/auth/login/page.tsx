"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, ArrowRight, UserCheck } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineAlert } from "@/components/feedback/inline-alert";

const DEMO_PERSONAS = [
  { label: "Administrator", email: "admin@techcorp.local", role: "admin", org: "TechCorp" },
  { label: "HR Partner", email: "hr@techcorp.local", role: "hr", org: "TechCorp" },
  { label: "Leadership", email: "leadership@techcorp.local", role: "leadership", org: "TechCorp" },
  { label: "Recruiter", email: "recruiter@techcorp.local", role: "recruiter", org: "TechCorp" },
  { label: "Manager", email: "manager@techcorp.local", role: "manager", org: "TechCorp" },
  { label: "Employee", email: "employee@techcorp.local", role: "employee", org: "TechCorp" },
  { label: "Candidate", email: "candidate@worksense.local", role: "candidate", org: "Public Portal" },
  { label: "Multi-Org Staff", email: "multiorg@techcorp.local", role: "employee", org: "TechCorp & AcmeCorp" },
  { label: "Suspended Account", email: "suspended@techcorp.local", role: "suspended", org: "TechCorp (Negative Test)" },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const ctx = await login({ email, password });
      router.push(ctx.default_destination);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed. Please verify your credentials.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectPersona = (personaEmail: string) => {
    setEmail(personaEmail);
    setPassword("DemoPassword123!");
    setErrorMsg(null);
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center max-w-md mx-auto py-8 px-4 sm:px-0">
      <div className="bg-surface rounded-xl border border-boundary-subtle shadow-sm p-6 sm:p-8 space-y-6">
        {/* Brand & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-2 bg-brand-primary/10 rounded-lg text-brand-primary mb-1">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold font-display tracking-tight text-content-primary">
            Sign In to Work<span className="text-brand-primary">Sense</span>
          </h1>
          <p className="text-xs sm:text-sm text-content-secondary">
            Enterprise Workforce Decision Intelligence & Action Platform
          </p>
        </div>

        {errorMsg && (
          <InlineAlert variant="danger" title="Sign In Error">
            {errorMsg}
          </InlineAlert>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="login-email"
            label="Work Email"
            type="text"
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
            className="text-brand-primary font-semibold hover:underline"
          >
            Register as Candidate
          </Link>
        </div>

        {/* Evaluation Persona Selector */}
        <div className="pt-3 border-t border-boundary-subtle space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-content-muted flex items-center gap-1">
              <UserCheck className="h-3.5 w-3.5" />
              Quick Demo Persona Quick-Fill
            </span>
            <span className="text-[10px] text-content-muted">Pre-calibrated</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto pr-1">
            {DEMO_PERSONAS.map((p) => (
              <button
                key={p.email}
                type="button"
                onClick={() => handleSelectPersona(p.email)}
                className="text-left px-2 py-1.5 rounded bg-surface-secondary hover:bg-surface-secondary/80 border border-boundary-subtle text-[11px] font-medium text-content-primary transition-colors focus:outline-none focus:ring-1 focus:ring-brand-primary"
                title={`${p.email} (${p.org})`}
              >
                <div className="font-semibold truncate">{p.label}</div>
                <div className="text-[9px] text-content-muted truncate">{p.org}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
