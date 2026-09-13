import React, { forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utilities/cn";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, disabled, id: customId, ...props }, ref) => {
    const generatedId = useId();
    const id = customId || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-xs font-semibold text-content-secondary mb-1.5">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            ref={ref}
            id={id}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            className={cn(
              "w-full h-9 appearance-none rounded-md border bg-surface px-3 py-1.5 pr-8 text-sm text-content-primary transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-secondary",
              error
                ? "border-status-danger focus-visible:ring-status-danger"
                : "border-boundary-strong focus-visible:border-brand-primary",
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-2.5 text-content-muted pointer-events-none flex items-center">
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>
        {error && <p className="mt-1 text-xs text-status-danger font-medium">{error}</p>}
        {!error && helperText && <p className="mt-1 text-xs text-content-muted">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
