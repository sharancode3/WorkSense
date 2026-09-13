import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "@/components/layout/sidebar";
import { ThemeProvider } from "@/components/theme/theme-provider";

const mockUseAuth = vi.fn();
vi.mock("@/context/auth-context", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

function renderSidebar() {
  return render(
    <ThemeProvider>
      <Sidebar />
    </ThemeProvider>
  );
}

describe("Adaptive Onboarding Navigation Role Guarding", () => {
  it("hides adaptive onboarding section from unauthenticated visitors", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      roles: [],
      activeOrg: null,
      hasCapability: () => false,
      logout: vi.fn(),
    });

    renderSidebar();

    expect(screen.queryByText("Adaptive Onboarding")).not.toBeInTheDocument();
    expect(screen.queryByText("HR Onboarding Hub")).not.toBeInTheDocument();
    expect(screen.queryByText("Initiate Onboarding")).not.toBeInTheDocument();
    expect(screen.queryByText("Manager Onboarding")).not.toBeInTheDocument();
    expect(screen.queryByText("My Onboarding Journey")).not.toBeInTheDocument();
  });

  it("shows all onboarding controls for HR Specialist", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "user-hr", full_name: "Sarah Jenkins", email: "hr@worksense.local" },
      roles: ["hr"],
      activeOrg: null,
      hasCapability: (cap: string) => cap.startsWith("portal.hr"),
      logout: vi.fn(),
    });

    renderSidebar();

    expect(screen.getByText("Adaptive Onboarding")).toBeInTheDocument();
    expect(screen.getByText("HR Onboarding Hub")).toBeInTheDocument();
    expect(screen.getByText("Initiate Onboarding")).toBeInTheDocument();
    expect(screen.getByText("My Onboarding Journey")).toBeInTheDocument();
    // Manager Onboarding is strictly for manager / leadership / administrator
    expect(screen.queryByText("Manager Onboarding")).not.toBeInTheDocument();
  });

  it("shows manager onboarding workspace for Engineering Manager", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "user-mgr", full_name: "Marcus Vance", email: "manager@worksense.local" },
      roles: ["manager"],
      activeOrg: null,
      hasCapability: (cap: string) => cap.startsWith("portal.manager"),
      logout: vi.fn(),
    });

    renderSidebar();

    expect(screen.getByText("Adaptive Onboarding")).toBeInTheDocument();
    expect(screen.getByText("Manager Onboarding")).toBeInTheDocument();
    expect(screen.getByText("My Onboarding Journey")).toBeInTheDocument();
    // Manager cannot initiate onboarding or access HR hub
    expect(screen.queryByText("HR Onboarding Hub")).not.toBeInTheDocument();
    expect(screen.queryByText("Initiate Onboarding")).not.toBeInTheDocument();
  });

  it("shows personal onboarding journey for Employee / Candidate", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "user-emp", full_name: "Elena Rostova", email: "employee@worksense.local" },
      roles: ["employee"],
      activeOrg: null,
      hasCapability: (cap: string) => cap.startsWith("portal.employee"),
      logout: vi.fn(),
    });

    renderSidebar();

    expect(screen.getByText("Adaptive Onboarding")).toBeInTheDocument();
    expect(screen.getByText("My Onboarding Journey")).toBeInTheDocument();
    expect(screen.queryByText("HR Onboarding Hub")).not.toBeInTheDocument();
    expect(screen.queryByText("Initiate Onboarding")).not.toBeInTheDocument();
    expect(screen.queryByText("Manager Onboarding")).not.toBeInTheDocument();
  });

  it("shows all onboarding controls for Administrator", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "user-admin", full_name: "Admin User", email: "admin@worksense.local" },
      roles: ["administrator"],
      activeOrg: null,
      hasCapability: () => true,
      logout: vi.fn(),
    });

    renderSidebar();

    expect(screen.getByText("Adaptive Onboarding")).toBeInTheDocument();
    expect(screen.getByText("HR Onboarding Hub")).toBeInTheDocument();
    expect(screen.getByText("Initiate Onboarding")).toBeInTheDocument();
    expect(screen.getByText("Manager Onboarding")).toBeInTheDocument();
    expect(screen.getByText("My Onboarding Journey")).toBeInTheDocument();
  });
});
