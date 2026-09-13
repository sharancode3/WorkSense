"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, ArrowRight, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineAlert } from "@/components/feedback/inline-alert";

export default function RegisterCandidatePage() {
  const router = useRouter();
  const { registerCandidate } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !passwordConfirm) {
      setErrorMsg("All fields are required.");
      return;
    }
    if (password !== passwordConfirm) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const ctx = await registerCandidate({
        full_name: fullName,
        email,
        password,
        password_confirm: passwordConfirm,
      });
      router.push(ctx.default_destination);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed. Please check inputs.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center max-w-md mx-auto py-8 px-4 sm:px-0">
      <div className="bg-surface rounded-xl border border-boundary-subtle shadow-sm p-6 sm:p-8 space-y-6">
        {/* Brand & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-2 bg-brand-primary/10 rounded-lg text-brand-primary mb-1">
            <UserPlus className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold font-display tracking-tight text-content-primary">
            Candidate Registration
          </h1>
          <p className="text-xs text-content-secondary leading-relaxed">
            Create an external candidate profile to apply for requisitions, submit technical artifacts, and participate in structured evaluations.
          </p>
        </div>

        {/* Security Notice */}
        <div className="bg-surface-secondary border border-boundary-subtle rounded-lg p-3 text-[11px] text-content-secondary">
          <span className="font-semibold text-content-primary">Security Note: </span>
          Public registration strictly creates candidate-level access. Internal employee and managerial roles must be provisioned through enterprise invitation.
        </div>

        {errorMsg && (
          <InlineAlert variant="danger" title="Registration Error">
            {errorMsg}
          </InlineAlert>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="register-fullname"
            label="Full Name"
            type="text"
            required
            autoComplete="name"
            placeholder="e.g. Elena Rostova"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isSubmitting}
          />

          <Input
            id="register-email"
            label="Email Address"
            type="text"
            required
            autoComplete="email"
            placeholder="name@personal.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
          />

          <Input
            id="register-password"
            label="Password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Minimum 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
          />

          <Input
            id="register-confirm-password"
            label="Confirm Password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Repeat password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            disabled={isSubmitting}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full justify-center mt-2"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            <span>Create Candidate Account</span>
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </form>

        <div className="pt-4 border-t border-boundary-subtle text-center text-xs text-content-secondary">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1.5 text-content-muted hover:text-content-primary font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
