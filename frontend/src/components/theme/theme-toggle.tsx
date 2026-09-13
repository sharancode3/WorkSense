"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { ThemeMode } from "@/types";
import { cn } from "@/lib/utilities/cn";

interface ThemeToggleProps {
  className?: string;
  variant?: "icon" | "segmented";
}

export function ThemeToggle({ className, variant = "segmented" }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          "h-9 w-24 rounded-md bg-surface-secondary border border-boundary-subtle animate-pulse",
          className
        )}
        aria-hidden="true"
      />
    );
  }

  if (variant === "icon") {
    const nextTheme: ThemeMode = resolvedTheme === "dark" ? "light" : "dark";
    return (
      <button
        type="button"
        onClick={() => setTheme(nextTheme)}
        className={cn(
          "inline-flex items-center justify-center h-9 w-9 rounded-md border border-boundary-subtle bg-surface text-content-secondary hover:text-content-primary hover:bg-surface-secondary transition-colors focus-visible:ring-2",
          className
        )}
        aria-label={`Switch to ${nextTheme} theme (currently ${theme})`}
        title={`Switch to ${nextTheme} theme`}
      >
        {resolvedTheme === "dark" ? (
          <Sun className="h-4 w-4 text-brand-primary" aria-hidden="true" />
        ) : (
          <Moon className="h-4 w-4 text-content-secondary" aria-hidden="true" />
        )}
      </button>
    );
  }

  const options: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { mode: "light", label: "Light", icon: <Sun className="h-3.5 w-3.5" aria-hidden="true" /> },
    { mode: "dark", label: "Dark", icon: <Moon className="h-3.5 w-3.5" aria-hidden="true" /> },
    { mode: "system", label: "System", icon: <Monitor className="h-3.5 w-3.5" aria-hidden="true" /> },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Color theme selection"
      className={cn(
        "inline-flex items-center p-0.5 rounded-md border border-boundary-subtle bg-surface-secondary",
        className
      )}
    >
      {options.map((opt) => {
        const isActive = theme === opt.mode;
        return (
          <button
            key={opt.mode}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => setTheme(opt.mode)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-all",
              isActive
                ? "bg-surface text-content-primary font-bold border border-boundary-subtle"
                : "text-content-muted hover:text-content-primary"
            )}
            title={`Set theme to ${opt.label}`}
          >
            {opt.icon}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
