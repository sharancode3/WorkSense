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

  it("renders healthy backend states on OverviewPage when API succeeds", async () => {
    vi.mocked(healthApi.fetchHealthStatus).mockResolvedValue({
      status: "healthy",
      timestamp: "2026-09-12T19:00:00Z",
      environment: "test",
      version: "1.0.0",
      components: {
        database: { status: "not configured", detail: "Supabase not configured" },
        storage: { status: "not configured", detail: "Storage not configured" },
        qwen_ai_gateway: { status: "not configured", detail: "Gateway not configured" },
        enterpro_orchestrator: { status: "not configured", detail: "EnterPro not configured" },
      },
      request_id: "test-req-id-12345",
    });

    render(
      <ToastProvider>
        <OverviewPage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("WorkSense Platform Foundation")).toBeInTheDocument();
      expect(screen.getByText("Connected")).toBeInTheDocument();
      expect(screen.getByText("FastAPI v1.0.0")).toBeInTheDocument();
    });
  });

  it("renders calm standby state on OverviewPage when backend is unreachable", async () => {
    vi.mocked(healthApi.fetchHealthStatus).mockRejectedValue(
      new Error("Failed to connect to backend service")
    );

    render(
      <ToastProvider>
        <OverviewPage />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Standby")).toBeInTheDocument();
      expect(screen.getByText(/Backend Service Standby:/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /check connection/i })).toBeInTheDocument();
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
