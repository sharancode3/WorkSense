"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utilities/cn";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
}: DrawerProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop without blur */}
      <div
        className="fixed inset-0 bg-black/60 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="drawer-title"
          className={cn(
            "w-screen max-w-[440px] transform bg-surface border-l-2 border-boundary-subtle p-6 flex flex-col justify-between transition-transform duration-150 ease-in-out animate-in slide-in-from-right"
          )}
        >
          <div>
            <div className="flex items-start justify-between pb-3 border-b border-boundary-subtle mb-4">
              <div>
                <h3 id="drawer-title" className="text-base font-bold font-display tracking-tight text-content-primary">
                  {title}
                </h3>
                {description && <p className="text-xs text-content-muted mt-0.5">{description}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-content-muted hover:text-content-primary p-1 rounded-md focus-visible:outline-none"
                aria-label="Close drawer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(100vh-140px)]">{children}</div>
          </div>

          {footer && <div className="pt-3 border-t border-boundary-subtle mt-4 flex items-center justify-end gap-2">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
