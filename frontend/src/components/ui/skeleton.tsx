import React from "react";
import { cn } from "@/lib/utilities/cn";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded bg-surface-secondary/80 dark:bg-surface-tertiary/60",
        className
      )}
      {...props}
    />
  );
}
