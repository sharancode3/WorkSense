import React, { forwardRef, useId } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utilities/cn";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, disabled, checked, id: customId, ...props }, ref) => {
    const generatedId = useId();
    const id = customId || generatedId;

    return (
      <div className="flex items-start gap-2.5 select-none">
        <div className="relative flex items-center pt-0.5">
          <input
            ref={ref}
            type="checkbox"
            id={id}
            disabled={disabled}
            checked={checked}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              "h-4 w-4 rounded border flex items-center justify-center transition-colors cursor-pointer",
              "border-boundary-strong bg-surface",
              "peer-checked:bg-brand-primary peer-checked:border-brand-primary text-white",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-brand-primary",
              disabled && "opacity-50 cursor-not-allowed bg-surface-secondary",
              className
            )}
            onClick={() => {
              if (!disabled) {
                const el = document.getElementById(id) as HTMLInputElement | null;
                el?.click();
              }
            }}
          >
            {checked && <Check className="h-3 w-3 stroke-[3]" aria-hidden="true" />}
          </div>
        </div>
        {(label || description) && (
          <div className="text-sm">
            {label && (
              <label
                htmlFor={id}
                className={cn(
                  "font-medium text-content-primary cursor-pointer",
                  disabled && "cursor-not-allowed opacity-50"
                )}
              >
                {label}
              </label>
            )}
            {description && <p className="text-xs text-content-muted mt-0.5">{description}</p>}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
