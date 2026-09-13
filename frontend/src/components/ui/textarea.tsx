import React, { forwardRef, useId } from "react";
import { cn } from "@/lib/utilities/cn";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, disabled, id: customId, rows = 3, ...props }, ref) => {
    const generatedId = useId();
    const id = customId || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-xs font-semibold text-content-secondary mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          className={cn(
            "w-full rounded-md border bg-surface px-3 py-2 text-sm text-content-primary placeholder:text-content-muted transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-secondary",
            error
              ? "border-status-danger focus-visible:ring-status-danger"
              : "border-boundary-strong focus-visible:border-brand-primary",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-status-danger font-medium">{error}</p>}
        {!error && helperText && <p className="mt-1 text-xs text-content-muted">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
