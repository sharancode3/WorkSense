import React, { forwardRef, useId } from "react";
import { cn } from "@/lib/utilities/cn";

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
  description?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, description, checked, disabled, id: customId, onChange, ...props }, ref) => {
    const generatedId = useId();
    const id = customId || generatedId;

    return (
      <div className="flex items-center justify-between gap-4 select-none">
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
        <div className="relative inline-flex items-center">
          <input
            ref={ref}
            type="checkbox"
            role="switch"
            id={id}
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              "w-9 h-5 rounded-full border transition-colors cursor-pointer relative",
              "border-boundary-strong bg-surface-secondary",
              "peer-checked:bg-brand-primary peer-checked:border-brand-primary",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-brand-primary",
              disabled && "opacity-50 cursor-not-allowed",
              className
            )}
            onClick={() => {
              if (!disabled) {
                const el = document.getElementById(id) as HTMLInputElement | null;
                el?.click();
              }
            }}
          >
            <div
              className={cn(
                "w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 left-0.5 transition-transform",
                checked ? "translate-x-4 bg-white" : "bg-content-muted"
              )}
            />
          </div>
        </div>
      </div>
    );
  }
);

Switch.displayName = "Switch";
