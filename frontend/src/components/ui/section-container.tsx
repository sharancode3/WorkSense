import React from "react";
import { cn } from "@/lib/utilities/cn";

export interface SectionContainerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

export function SectionContainer({
  className,
  title,
  description,
  action,
  children,
  ...props
}: SectionContainerProps) {
  return (
    <section
      className={cn("rounded-xl border border-boundary-subtle bg-surface p-5 sm:p-6 mb-6", className)}
      {...props}
    >
      {(title || description || action) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-boundary-subtle">
          <div>
            {title && <h2 className="text-lg font-semibold text-content-primary">{title}</h2>}
            {description && <p className="text-xs text-content-muted mt-0.5">{description}</p>}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
