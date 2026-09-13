import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import OverviewPage from "@/app/page";
import SystemStatusPage from "@/app/status/page";
import * as healthApi from "@/lib/api/health";
import { ToastProvider } from "@/components/feedback/toast";

vi.mock("@/lib/api/health", () => ({
  fetchHealthStatus: vi.fn(),
  fetchLiveness: vi.fn(),
}));

describe("OverviewPage & SystemStatusPage Health Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders evidence-first value propositions on PublicOverviewPage", () => {
    render(
      <ToastProvider>
        <OverviewPage />
      </ToastProvider>
    );

    expect(screen.getByText(/Evidence-First Workforce Decision Intelligence/i)).toBeInTheDocument();
    expect(screen.getByText(/Understand your workforce/i)).toBeInTheDocument();
    expect(screen.getByText(/The WorkSense Operating Loop/i)).toBeInTheDocument();
    expect(screen.getByText(/Unified Workforce Capabilities/i)).toBeInTheDocument();
  });

  it("renders calm standby state on SystemStatusPage when backend is unreachable", async () => {
    vi.mocked(healthApi.fetchHealthStatus).mockRejectedValue(
      new Error("Failed to connect to backend service")
    );

    render(
      <ToastProvider>
        <SystemStatusPage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("System & Subsystem Status")).toBeInTheDocument();
      expect(screen.getByText(/Standby \/ Unreachable/i)).toBeInTheDocument();
      expect(screen.getByText("FastAPI Standby")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /retry connection/i })).toBeInTheDocument();
    });
  });

  it("renders deep subsystem readiness on SystemStatusPage when API succeeds", async () => {
    vi.mocked(healthApi.fetchHealthStatus).mockResolvedValue({
      status: "healthy",
      timestamp: "2026-09-12T19:00:00Z",
      environment: "test",
      version: "1.0.0",
      components: {
        database: { status: "healthy", detail: "PostgreSQL connected" },
        storage: { status: "healthy", detail: "Storage ready" },
        qwen_ai_gateway: { status: "unavailable", detail: "Local laptop tunnel offline" },
        enterpro_orchestrator: { status: "not configured", detail: "Webhook adapter ready" },
      },
      request_id: "test-req-id-12345",
    });

    render(
      <ToastProvider>
        <SystemStatusPage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("System & Subsystem Status")).toBeInTheDocument();
      expect(screen.getByText("PostgreSQL")).toBeInTheDocument();
      expect(screen.getByText("Qwen Gateway")).toBeInTheDocument();
    });
  });
});
