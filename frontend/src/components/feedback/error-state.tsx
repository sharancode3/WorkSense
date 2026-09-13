import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utilities/cn";

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message?: string;
  requestId?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  technicalDetails?: string;
}

export function ErrorState({
  title = "Connection Notice",
  message = "An unexpected connection issue occurred.",
  requestId,
  onRetry,
  isRetrying = false,
  technicalDetails,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center p-6 sm:p-8 text-center rounded-lg border border-boundary-subtle bg-surface-secondary/50 max-w-md mx-auto my-4",
        className
      )}
      {...props}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-status-warning-bg text-status-warning border border-status-warning-border mb-3">
        <AlertCircle className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-bold font-display text-content-primary mb-1">{title}</h3>
      <p className="text-xs text-content-secondary mb-4 leading-relaxed">{message}</p>

      {requestId && (
        <div className="mb-3 px-2.5 py-1 rounded bg-surface border border-boundary-subtle font-mono text-[11px] text-content-muted select-all">
          Request ID: {requestId}
        </div>
      )}

      {technicalDetails && (
        <details className="w-full text-left mb-4 p-2.5 rounded bg-surface border border-boundary-subtle text-xs text-content-muted font-mono">
          <summary className="cursor-pointer font-sans font-semibold text-content-secondary mb-1 select-none">
            Technical diagnostics
          </summary>
          <pre className="overflow-x-auto whitespace-pre-wrap text-[11px]">{technicalDetails}</pre>
        </details>
      )}

      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          isLoading={isRetrying}
          leftIcon={<RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />}
        >
          {isRetrying ? "Checking..." : "Check Connection"}
        </Button>
      )}
    </div>
  );
}
