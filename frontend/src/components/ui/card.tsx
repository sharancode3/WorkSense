import React from "react";
import { cn } from "@/lib/utilities/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "subtle" | "interactive";
}

export function Card({ className, variant = "default", ...props }: CardProps) {
  const variantStyles = {
    default: "bg-surface border border-boundary-subtle",
    subtle: "bg-surface-secondary border-0",
    interactive: "bg-surface border border-boundary-subtle hover:border-brand-primary transition-colors cursor-pointer",
  };

  return (
    <div
      className={cn(
        "rounded-lg text-content-primary transition-colors overflow-hidden",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 sm:p-6 flex flex-col space-y-1.5", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-base font-bold font-display tracking-tight text-content-primary", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs text-content-muted leading-relaxed mt-1", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 sm:p-6 pt-0 sm:pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("p-5 sm:p-6 pt-0 sm:pt-0 flex items-center justify-between border-t border-boundary-subtle mt-4 pt-4", className)}
      {...props}
    />
  );
}
