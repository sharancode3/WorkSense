"use client";

import React from "react";
import { cn } from "@/lib/utilities/cn";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (_tabId: string) => void;
  className?: string;
  variant?: "segmented" | "underline";
}

export function Tabs({ tabs, activeTab, onChange, className, variant = "segmented" }: TabsProps) {
  if (variant === "underline") {
    return (
      <div role="tablist" className={cn("flex space-x-6 border-b border-boundary-subtle", className)}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              id={`tab-${tab.id}`}
              aria-controls={`tabpanel-${tab.id}`}
              aria-selected={isActive}
              disabled={tab.disabled}
              onClick={() => onChange(tab.id)}
              className={cn(
                "py-3 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 select-none disabled:opacity-50 disabled:cursor-not-allowed",
                isActive
                  ? "border-brand-primary text-brand-primary font-semibold"
                  : "border-transparent text-content-secondary hover:text-content-primary hover:border-boundary-strong"
              )}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={cn(
                    "text-[11px] px-1.5 py-0.2 rounded-full",
                    isActive ? "bg-brand-primary-soft text-brand-primary" : "bg-surface-secondary text-content-muted"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center p-1 rounded-lg bg-surface-secondary border border-boundary-subtle gap-1",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            id={`tab-${tab.id}`}
            aria-controls={`tabpanel-${tab.id}`}
            aria-selected={isActive}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 select-none disabled:opacity-50 disabled:cursor-not-allowed",
              isActive
                ? "bg-surface text-content-primary font-bold border border-boundary-subtle"
                : "text-content-secondary hover:text-content-primary"
            )}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="text-[10px] px-1 rounded-full bg-surface-tertiary text-content-muted">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
