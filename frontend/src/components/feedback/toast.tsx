"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utilities/cn";

export type ToastType = "info" | "success" | "warning" | "danger";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  durationMs?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (_toast: Omit<Toast, "id">) => void;
  removeToast: (_id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, durationMs = 4000 }: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = { id, type, title, message, durationMs };

      setToasts((prev) => [...prev, newToast]);

      if (durationMs > 0) {
        setTimeout(() => {
          removeToast(id);
        }, durationMs);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none p-2 sm:p-0"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const icons: Record<ToastType, React.ReactNode> = {
    info: <Info className="h-4 w-4 text-status-info" aria-hidden="true" />,
    success: <CheckCircle2 className="h-4 w-4 text-status-success" aria-hidden="true" />,
    warning: <AlertTriangle className="h-4 w-4 text-status-warning" aria-hidden="true" />,
    danger: <AlertCircle className="h-4 w-4 text-status-danger" aria-hidden="true" />,
  };

  const borders: Record<ToastType, string> = {
    info: "border-status-info-border",
    success: "border-status-success-border",
    warning: "border-status-warning-border",
    danger: "border-status-danger-border",
  };

  return (
    <div
      role={toast.type === "danger" || toast.type === "warning" ? "alert" : "status"}
      className={cn(
        "pointer-events-auto flex items-start gap-3 p-4 rounded-lg border-2 bg-surface text-xs sm:text-sm text-content-primary transition-all animate-in slide-in-from-bottom-3 duration-200",
        borders[toast.type]
      )}
    >
      <div className="pt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <h5 className="font-semibold text-content-primary leading-tight">{toast.title}</h5>
        {toast.message && <p className="text-content-muted mt-0.5 text-xs">{toast.message}</p>}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-content-muted hover:text-content-primary p-0.5 rounded focus-visible:outline-none flex-shrink-0"
        aria-label="Close notification"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
