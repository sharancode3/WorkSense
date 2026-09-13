import React, { forwardRef, useId } from "react";
import { cn } from "@/lib/utilities/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      leftAddon,
      rightAddon,
      disabled,
      id: customId,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = customId || generatedId;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-xs font-semibold text-content-secondary mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftAddon && (
            <div className="absolute left-3 text-content-muted pointer-events-none flex items-center">
              {leftAddon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={cn(
              "w-full h-9 rounded-md border bg-surface px-3 py-1.5 text-sm text-content-primary placeholder:text-content-muted transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-secondary",
              leftAddon ? "pl-9" : "",
              rightAddon ? "pr-9" : "",
              error
                ? "border-status-danger focus-visible:ring-status-danger"
                : "border-boundary-strong focus-visible:border-brand-primary",
              className
            )}
            {...props}
          />
          {rightAddon && (
            <div className="absolute right-3 text-content-muted flex items-center">
              {rightAddon}
            </div>
          )}
        </div>
        {error && (
          <p id={errorId} className="mt-1 text-xs text-status-danger font-medium">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="mt-1 text-xs text-content-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
