"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import { resetPasswordApi } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineAlert } from "@/components/feedback/inline-alert";

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !password || !passwordConfirm) {
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
      await resetPasswordApi({
        token,
        password,
        password_confirm: passwordConfirm,
      });
      setIsSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Password reset failed. Invalid or expired token.";
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
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold font-display tracking-tight text-content-primary">
            Set New Password
          </h1>
          <p className="text-xs text-content-secondary leading-relaxed">
            Enter your reset token and establish a secure password for your account.
          </p>
        </div>

        {errorMsg && (
          <InlineAlert variant="danger" title="Reset Error">
            {errorMsg}
          </InlineAlert>
        )}

        {isSuccess ? (
          <div className="space-y-4 text-center py-4">
            <div className="inline-flex items-center justify-center p-3 bg-status-success/10 rounded-full text-status-success">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-base font-bold text-content-primary">Password Updated</h2>
            <p className="text-xs text-content-secondary">
              Your credentials have been securely updated. You may now sign in.
            </p>
            <div className="pt-2">
              <Link href="/auth/login">
                <Button variant="primary" className="w-full justify-center">
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="reset-token"
              label="Reset Token"
              type="text"
              required
              placeholder="Paste security token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={isSubmitting}
            />

            <Input
              id="reset-new-password"
              label="New Password"
              type="password"
              required
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />

            <Input
              id="reset-confirm-password"
              label="Confirm New Password"
              type="password"
              required
              placeholder="Repeat new password"
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
              Update Password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
