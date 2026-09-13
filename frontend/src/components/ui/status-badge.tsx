import React from "react";
import { CheckCircle2, Clock, AlertTriangle, XCircle, MinusCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utilities/cn";

export type StatusVocabulary =
  | "VERIFIED"
  | "STALE"
  | "PROBATION"
  | "PENDING_APPROVAL"
  | "EXCEPTION_REQUIRED"
  | "HEALTHY"
  | "DEGRADED"
  | "UNAVAILABLE"
  | "NOT_CONFIGURED";

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusVocabulary | string;
  size?: "sm" | "md";
  showIcon?: boolean;
}

export function StatusBadge({ status, size = "sm", showIcon = true, className, ...props }: StatusBadgeProps) {
  const normalized = status.toUpperCase().replace(/\s+/g, "_") as StatusVocabulary;

  const config: Record<
    StatusVocabulary,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode; dotColor: string }
  > = {
    VERIFIED: {
      label: "Verified",
      bg: "bg-status-success-bg",
      text: "text-status-success",
      border: "border-status-success-border",
      icon: <CheckCircle2 className="h-3 w-3" aria-hidden="true" />,
      dotColor: "bg-status-success",
    },
    HEALTHY: {
      label: "Healthy",
      bg: "bg-status-success-bg",
      text: "text-status-success",
      border: "border-status-success-border",
      icon: <CheckCircle2 className="h-3 w-3" aria-hidden="true" />,
      dotColor: "bg-status-success",
    },
    STALE: {
      label: "Stale Evidence",
      bg: "bg-status-warning-bg",
      text: "text-status-warning",
      border: "border-status-warning-border",
      icon: <Clock className="h-3 w-3" aria-hidden="true" />,
      dotColor: "bg-status-warning",
    },
    PROBATION: {
      label: "Probationary",
      bg: "bg-status-warning-bg",
      text: "text-status-warning",
      border: "border-status-warning-border",
      icon: <Clock className="h-3 w-3" aria-hidden="true" />,
      dotColor: "bg-status-warning",
    },
    PENDING_APPROVAL: {
      label: "Pending Approval",
      bg: "bg-status-info-bg",
      text: "text-status-info",
      border: "border-status-info-border",
      icon: <Clock className="h-3 w-3" aria-hidden="true" />,
      dotColor: "bg-status-info",
    },
    EXCEPTION_REQUIRED: {
      label: "Exception Required",
      bg: "bg-status-danger-bg",
      text: "text-status-danger",
      border: "border-status-danger-border",
      icon: <AlertTriangle className="h-3 w-3" aria-hidden="true" />,
      dotColor: "bg-status-danger",
    },
    DEGRADED: {
      label: "Degraded",
      bg: "bg-status-warning-bg",
      text: "text-status-warning",
      border: "border-status-warning-border",
      icon: <AlertTriangle className="h-3 w-3" aria-hidden="true" />,
      dotColor: "bg-status-warning",
    },
    UNAVAILABLE: {
      label: "Unavailable",
      bg: "bg-status-danger-bg",
      text: "text-status-danger",
      border: "border-status-danger-border",
      icon: <XCircle className="h-3 w-3" aria-hidden="true" />,
      dotColor: "bg-status-danger",
    },
    NOT_CONFIGURED: {
      label: "Not Configured",
      bg: "bg-surface-secondary",
      text: "text-content-muted",
      border: "border-boundary-subtle",
      icon: <MinusCircle className="h-3 w-3" aria-hidden="true" />,
      dotColor: "bg-content-muted",
    },
  };

  const item = config[normalized] || {
    label: status,
    bg: "bg-surface-secondary",
    text: "text-content-secondary",
    border: "border-boundary-subtle",
    icon: <HelpCircle className="h-3 w-3" aria-hidden="true" />,
    dotColor: "bg-content-muted",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        item.bg,
        item.text,
        item.border,
        className
      )}
      {...props}
    >
      {showIcon ? (
        item.icon
      ) : (
        <span className={cn("h-1.5 w-1.5 rounded-full", item.dotColor)} aria-hidden="true" />
      )}
      <span>{item.label}</span>
    </span>
  );
}
