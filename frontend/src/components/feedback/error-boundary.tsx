"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { ErrorState } from "@/components/feedback/error-state";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Structured client logging
    console.error("ErrorBoundary caught an unhandled rendering error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-8">
          <ErrorState
            title="An unexpected rendering error occurred"
            message="The application encountered an unexpected error while displaying this component."
            onRetry={this.handleReset}
            technicalDetails={
              process.env.NODE_ENV === "development"
                ? this.state.error?.stack || this.state.error?.message
                : undefined
            }
          />
        </div>
      );
    }

    return this.props.children;
  }
}
