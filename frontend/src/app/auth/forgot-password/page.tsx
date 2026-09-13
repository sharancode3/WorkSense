"use client";

import React, { useState } from "react";
import Link from "next/link";
import { KeyRound, ArrowLeft, CheckCircle2 } from "lucide-react";
import { forgotPasswordApi } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineAlert } from "@/components/feedback/inline-alert";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg("Please enter your email address.");
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await forgotPasswordApi(email);
      setIsSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Request failed. Please try again.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center max-w-md mx-auto py-8 px-4 sm:px-0">
      <div className="bg-surface rounded-xl border border-boundary-subtle shadow-sm p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-2 bg-brand-primary/10 rounded-lg text-brand-primary mb-1">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold font-display tracking-tight text-content-primary">
            Password Recovery
          </h1>
          <p className="text-xs text-content-secondary leading-relaxed">
            Enter your account email to receive cryptographic password reset credentials.
          </p>
        </div>

        {errorMsg && (
          <InlineAlert variant="danger" title="Recovery Request Failed">
            {errorMsg}
          </InlineAlert>
        )}

        {isSubmitted ? (
          <div className="space-y-4 text-center py-4">
            <div className="inline-flex items-center justify-center p-3 bg-status-success/10 rounded-full text-status-success">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-base font-bold text-content-primary">Instructions Dispatched</h2>
            <p className="text-xs text-content-secondary">
              If an account matching <span className="font-semibold text-content-primary">{email}</span> exists, password reset instructions have been safely transmitted.
            </p>
            <div className="pt-2">
              <Link href="/auth/login">
                <Button variant="outline" className="w-full justify-center">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="forgot-email"
              label="Account Email"
              type="text"
              required
              autoComplete="email"
              placeholder="name@organization.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center mt-2"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              Send Recovery Link
            </Button>
          </form>
        )}

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
