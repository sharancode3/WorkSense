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

describe("Role-Based Navigation Filtering", () => {
  it("shows clean entry state with Sign In when user is unauthenticated", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      roles: [],
      activeOrg: null,
      hasCapability: () => false,
      logout: vi.fn(),
    });

    renderSidebar();

    expect(screen.getByText("Work")).toBeInTheDocument();
    expect(screen.getByText("Sense")).toBeInTheDocument();
    expect(screen.getByText("Sign In")).toBeInTheDocument();

    // Privileged role workspaces should NOT appear
    expect(screen.queryByText("Platform Administration")).not.toBeInTheDocument();
    expect(screen.queryByText("Access & Governance")).not.toBeInTheDocument();
    expect(screen.queryByText("Talent Acquisition")).not.toBeInTheDocument();
    expect(screen.queryByText("Candidate Journey")).not.toBeInTheDocument();
  });

  it("shows candidate workspace destination when candidate is authenticated", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "1", full_name: "Candidate User", email: "cand@test.com" },
      roles: ["candidate"],
      activeOrg: null,
      hasCapability: (cap: string) => cap === "portal.candidate.access",
      logout: vi.fn(),
    });

    renderSidebar();

    expect(screen.getByText("Candidate Journey")).toBeInTheDocument();
    expect(screen.getByText("Application Overview")).toBeInTheDocument();
    expect(screen.getByText("My Onboarding")).toBeInTheDocument();
    expect(screen.queryByText("Platform Administration")).not.toBeInTheDocument();
    expect(screen.queryByText("Access & Governance")).not.toBeInTheDocument();
  });

  it("shows Platform Administration workspace when administrator is authenticated", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "1", full_name: "Admin User", email: "admin@test.com" },
      roles: ["administrator"],
      activeOrg: { id: "org1", name: "TechCorp", slug: "techcorp" },
      hasCapability: (cap: string) => cap === "admin.access",
      logout: vi.fn(),
    });

    renderSidebar();

    expect(screen.getByText("Platform Administration")).toBeInTheDocument();
    expect(screen.getByText("Access & Governance")).toBeInTheDocument();
    expect(screen.queryByText("Candidate Journey")).not.toBeInTheDocument();
  });
});
