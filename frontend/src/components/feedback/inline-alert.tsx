import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utilities/cn";

export interface InlineAlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "danger";
  title?: string;
  onClose?: () => void;
  action?: React.ReactNode;
}

export function InlineAlert({
  variant = "info",
  title,
  children,
  onClose,
  action,
  className,
  ...props
}: InlineAlertProps) {
  const config = {
    info: {
      bg: "bg-status-info-bg",
      border: "border-status-info-border",
      text: "text-status-info",
      icon: <Info className="h-4 w-4 text-status-info flex-shrink-0" aria-hidden="true" />,
      role: "status",
    },
    success: {
      bg: "bg-status-success-bg",
      border: "border-status-success-border",
      text: "text-status-success",
      icon: <CheckCircle2 className="h-4 w-4 text-status-success flex-shrink-0" aria-hidden="true" />,
      role: "status",
    },
    warning: {
      bg: "bg-status-warning-bg",
      border: "border-status-warning-border",
      text: "text-status-warning",
      icon: <AlertTriangle className="h-4 w-4 text-status-warning flex-shrink-0" aria-hidden="true" />,
      role: "alert",
    },
    danger: {
      bg: "bg-status-danger-bg",
      border: "border-status-danger-border",
      text: "text-status-danger",
      icon: <AlertCircle className="h-4 w-4 text-status-danger flex-shrink-0" aria-hidden="true" />,
      role: "alert",
    },
  };

  const item = config[variant];

  return (
    <div
      role={item.role}
      className={cn(
        "flex items-start gap-3 p-3.5 rounded-lg border text-xs sm:text-sm text-content-primary leading-normal transition-colors",
        item.bg,
        item.border,
        className
      )}
      {...props}
    >
      <div className="pt-0.5">{item.icon}</div>
      <div className="flex-1 min-w-0">
        {title && <h4 className={cn("font-semibold mb-0.5", item.text)}>{title}</h4>}
        <div className="text-content-secondary leading-relaxed">{children}</div>
        {action && <div className="mt-2 flex items-center gap-2">{action}</div>}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-content-muted hover:text-content-primary p-0.5 rounded focus-visible:outline-none flex-shrink-0"
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
