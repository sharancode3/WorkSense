import React from "react";
import { cn } from "@/lib/utilities/cn";

export interface TableShellProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function TableShell({ children, className, ...props }: TableShellProps) {
  return (
    <div className={cn("w-full overflow-x-auto rounded-lg border border-boundary-subtle bg-surface", className)} {...props}>
      <table className="w-full text-left text-sm border-collapse">{children}</table>
    </div>
  );
}

export function TableHead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn("bg-surface-secondary text-xs uppercase tracking-wider text-content-secondary border-b border-boundary-subtle select-none", className)}
      {...props}
    />
  );
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-boundary-subtle text-content-primary", className)} {...props} />;
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn("transition-colors hover:bg-surface-secondary/50", className)}
      {...props}
    />
  );
}

export function TableHeaderCell({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("px-4 py-3 font-semibold", className)} {...props} />;
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3 align-middle", className)} {...props} />;
}
