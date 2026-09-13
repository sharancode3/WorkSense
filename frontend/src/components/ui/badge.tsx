import React from "react";
import { cn } from "@/lib/utilities/cn";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "accent" | "outline" | "muted" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md";
}

export function Badge({ className, variant = "default", size = "sm", children, ...props }: BadgeProps) {
  const variantStyles = {
    default: "bg-surface-secondary text-content-secondary border border-boundary-subtle",
    primary: "bg-brand-primary-soft text-brand-primary border border-brand-primary/20 font-semibold",
    accent: "bg-brand-accent-soft text-brand-accent border border-brand-accent/30 font-semibold",
    outline: "bg-transparent text-content-primary border border-boundary-strong",
    muted: "bg-surface-tertiary text-content-muted border border-boundary-subtle",
    success: "bg-status-success-bg text-status-success border border-status-success-border font-medium",
    warning: "bg-status-warning-bg text-status-warning border border-status-warning-border font-medium",
    danger: "bg-status-danger-bg text-status-danger border border-status-danger-border font-medium",
    info: "bg-status-info-bg text-status-info border border-status-info-border font-medium",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px] leading-4",
    md: "px-2.5 py-1 text-xs leading-4",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-sans whitespace-nowrap transition-colors",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
