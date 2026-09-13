import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import ManagerOnboardingPage from "@/app/manager/onboarding/page";
import * as onboardingApi from "@/lib/api/onboarding";

const mockUseAuth = vi.fn();
vi.mock("@/context/auth-context", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/manager/onboarding",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/lib/api/onboarding", () => ({
  listOnboardingCasesApi: vi.fn(),
  addManagerTaskApi: vi.fn(),
  completeOnboardingTaskApi: vi.fn(),
  managerReviewPlanApi: vi.fn(),
  proposeAdaptiveReplanApi: vi.fn(),
}));

describe("Manager Onboarding Page Fetch Stability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "user-mgr", full_name: "Marcus Vance", email: "manager@techcorp.local" },
      roles: ["manager"],
      activeOrg: { id: "org-1", name: "TechCorp International", slug: "techcorp" },
      membershipStatus: "active",
      hasCapability: () => true,
      hasRole: (r: string) => r === "manager",
      logout: vi.fn(),
    });
  });

  it("loads manager onboarding journeys without infinite re-fetching loop", async () => {
    const listSpy = vi.spyOn(onboardingApi, "listOnboardingCasesApi").mockResolvedValue({
      cases: [
        {
          id: "case-1",
          organization_id: "org-1",
          candidate_id: "cand-1",
          candidate_name: "Elena Rostova",
          candidate_email: "elena.rostova@example.com",
          employee_code: "EMP-10550",
          role_title: "Senior Distributed Systems Engineer",
          department_name: "Engineering",
          manager_profile_id: "user-mgr",
          status: "active",
          stage: "onboarding",
          progress_percent: 35.0,
          current_plan_id: "plan-1",
          total_tasks_count: 12,
          completed_tasks_count: 4,
          blocked_tasks_count: 0,
          created_at: "2026-03-01T00:00:00Z",
          updated_at: "2026-03-01T00:00:00Z",
        },
      ],
      total_count: 1,
    } as any);

    render(<ManagerOnboardingPage />);

    // Initially shows loading
    expect(screen.getByText(/Loading team onboarding journeys/i)).toBeInTheDocument();

    // After resolution, shows Elena Rostova's journey
    await waitFor(() => {
      expect(screen.getByText("Elena Rostova")).toBeInTheDocument();
    });

    // Should only call listOnboardingCasesApi once (not an infinite loop)
    expect(listSpy).toHaveBeenCalledTimes(1);
  });

  it("displays retryable error state when API fails", async () => {
    vi.spyOn(onboardingApi, "listOnboardingCasesApi").mockRejectedValue(
      new Error("Network connection timeout")
    );

    render(<ManagerOnboardingPage />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load team journeys")).toBeInTheDocument();
      expect(screen.getAllByText("Network connection timeout").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Retry/i)).toBeInTheDocument();
    });
  });

  it("displays truthful empty state when no team cases exist", async () => {
    vi.spyOn(onboardingApi, "listOnboardingCasesApi").mockResolvedValue({
      cases: [],
      total_count: 0,
    } as any);

    render(<ManagerOnboardingPage />);

    await waitFor(() => {
      expect(screen.getByText("No Direct Report Journeys")).toBeInTheDocument();
    });
  });
});
