import React from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utilities/cn";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-lg border border-dashed border-boundary-strong bg-surface-secondary/40",
        className
      )}
      {...props}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-tertiary text-content-muted mb-3.5">
        {icon || <Inbox className="h-6 w-6" aria-hidden="true" />}
      </div>
      <h3 className="text-base font-semibold text-content-primary mb-1">{title}</h3>
      <p className="max-w-sm text-xs text-content-muted leading-relaxed mb-4">{description}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
