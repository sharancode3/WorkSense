import React from "react";
import { cn } from "@/lib/utilities/cn";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  size?: "sm" | "md" | "lg";
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name, size = "md", className, ...props }: AvatarProps) {
  const initials = getInitials(name);

  const sizeStyles = {
    sm: "h-7 w-7 text-[11px]",
    md: "h-8 w-8 text-xs",
    lg: "h-10 w-10 text-sm",
  };

  return (
    <div
      className={cn(
        "rounded-full bg-brand-primary text-white font-semibold flex items-center justify-center select-none border border-boundary-subtle",
        sizeStyles[size],
        className
      )}
      title={name}
      aria-label={name}
      role="img"
      {...props}
    >
      <span>{initials}</span>
    </div>
  );
}
