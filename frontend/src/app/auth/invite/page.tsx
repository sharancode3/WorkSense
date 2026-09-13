"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, ArrowRight, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { acceptInviteApi } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineAlert } from "@/components/feedback/inline-alert";

export default function AcceptInvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshContext } = useAuth();

  const [token, setToken] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !fullName || !password || !passwordConfirm) {
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
      const res = await acceptInviteApi({
        token,
        full_name: fullName,
        password,
        password_confirm: passwordConfirm,
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("worksense_auth_token", res.access_token);
      }
      await refreshContext();
      router.push(res.context.default_destination);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invitation acceptance failed. Token may be invalid or expired.";
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
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold font-display tracking-tight text-content-primary">
            Accept Organization Invitation
          </h1>
          <p className="text-xs text-content-secondary leading-relaxed">
            Activate your verified workforce membership and establish your account credentials.
          </p>
        </div>

        {errorMsg && (
          <InlineAlert variant="danger" title="Invitation Error">
            {errorMsg}
          </InlineAlert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="invite-token"
            label="Invitation Token"
            type="text"
            required
            placeholder="Security invitation token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            disabled={isSubmitting}
          />

          <Input
            id="invite-fullname"
            label="Full Name"
            type="text"
            required
            autoComplete="name"
            placeholder="Your full legal name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isSubmitting}
          />

          <Input
            id="invite-password"
            label="Establish Password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Minimum 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
          />

          <Input
            id="invite-confirm-password"
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
            <span>Activate Membership</span>
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
