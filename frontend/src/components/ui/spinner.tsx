import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utilities/cn";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function Spinner({ size = "md", label = "Loading...", className, ...props }: SpinnerProps) {
  const sizeStyles = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div
      role="status"
      className={cn("inline-flex items-center justify-center text-brand-primary", className)}
      {...props}
    >
      <Loader2 className={cn("animate-spin", sizeStyles[size])} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
