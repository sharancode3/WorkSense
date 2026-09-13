import React from "react";
import { cn } from "@/lib/utilities/cn";

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  breadcrumbs?: React.ReactNode;
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({
  className,
  breadcrumbs,
  title,
  description,
  badge,
  actions,
  ...props
}: PageHeaderProps) {
  return (
    <div className={cn("mb-6 pb-4 border-b border-boundary-subtle", className)} {...props}>
      {breadcrumbs && <div className="mb-2">{breadcrumbs}</div>}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-content-primary">{title}</h1>
            {badge}
          </div>
          {description && <p className="text-sm text-content-secondary mt-1">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2.5 flex-shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
