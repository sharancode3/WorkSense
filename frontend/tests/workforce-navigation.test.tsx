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

describe("Workforce Foundation Navigation Role Guarding", () => {
  it("hides workforce foundation section from unauthenticated visitors", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      roles: [],
      activeOrg: null,
      hasCapability: () => false,
      logout: vi.fn(),
    });

    renderSidebar();

    expect(screen.queryByText("Workforce Foundation")).not.toBeInTheDocument();
    expect(screen.queryByText("Departments & Org Tree")).not.toBeInTheDocument();
    expect(screen.queryByText("Job Role Catalog")).not.toBeInTheDocument();
    expect(screen.queryByText("Skill Taxonomy & Graph")).not.toBeInTheDocument();
  });

  it("shows only candidate-allowed workforce items when candidate is logged in", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "cand-1", full_name: "Elena Rostova", email: "candidate@worksense.local" },
      roles: ["candidate"],
      activeOrg: null,
      hasCapability: (cap: string) => cap === "portal.candidate.access",
      logout: vi.fn(),
    });

    renderSidebar();

    expect(screen.getByText("Candidate Journey")).toBeInTheDocument();
    expect(screen.getByText("Application Overview")).toBeInTheDocument();
    expect(screen.getByText("My Onboarding")).toBeInTheDocument();
    // But cannot see operations, departments, or data quality
    expect(screen.queryByText("Workforce Operations")).not.toBeInTheDocument();
    expect(screen.queryByText("Departments & Org Tree")).not.toBeInTheDocument();
    expect(screen.queryByText("Data Quality Engine")).not.toBeInTheDocument();
  });

  it("shows authorized workforce items to employee role", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "emp-1", full_name: "Marcus Vance", email: "employee@worksense.local" },
      roles: ["employee"],
      activeOrg: { id: "org-1", name: "TechCorp", slug: "techcorp" },
      hasCapability: (cap: string) => ["portal.employee.access"].includes(cap),
      logout: vi.fn(),
    });

    renderSidebar();

    expect(screen.getByText("Employee Workplace")).toBeInTheDocument();
    expect(screen.getByText("My Workplace Overview")).toBeInTheDocument();
    expect(screen.getByText("My Onboarding Track")).toBeInTheDocument();
    expect(screen.getByText("Policy Assistant")).toBeInTheDocument();

    // HR/Recruiter/Admin exclusive items should NOT appear
    expect(screen.queryByText("Candidate Profiles")).not.toBeInTheDocument();
    expect(screen.queryByText("Data Quality Engine")).not.toBeInTheDocument();
    expect(screen.queryByText("Workforce Operations")).not.toBeInTheDocument();
  });

  it("shows recruiter authorized items (Candidates, Job Requisitions, Skill Taxonomy)", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "rec-1", full_name: "Rachel Zane", email: "recruiter@worksense.local" },
      roles: ["recruiter"],
      activeOrg: { id: "org-1", name: "TechCorp", slug: "techcorp" },
      hasCapability: (cap: string) => ["portal.recruiter.access"].includes(cap),
      logout: vi.fn(),
    });

    renderSidebar();

    expect(screen.getByText("Talent Acquisition")).toBeInTheDocument();
    expect(screen.getByText("Talent Overview")).toBeInTheDocument();
    expect(screen.getByText("Job Requisitions")).toBeInTheDocument();
    expect(screen.getByText("Candidate Profiles")).toBeInTheDocument();
    expect(screen.getByText("Skill Taxonomy")).toBeInTheDocument();

    // Recruiter cannot see data-quality or workforce operations hub
    expect(screen.queryByText("Data Quality Engine")).not.toBeInTheDocument();
    expect(screen.queryByText("Operations Hub")).not.toBeInTheDocument();
  });

  it("shows all workforce foundation modules to HR", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "hr-1", full_name: "Hanna Reid", email: "hr@worksense.local" },
      roles: ["hr"],
      activeOrg: { id: "org-1", name: "TechCorp", slug: "techcorp" },
      hasCapability: (cap: string) => ["portal.hr.access"].includes(cap),
      logout: vi.fn(),
    });

    renderSidebar();

    expect(screen.getByText("Workforce Operations")).toBeInTheDocument();
    expect(screen.getByText("Workforce Data & Taxonomy")).toBeInTheDocument();
    expect(screen.getByText("Departments & Org Tree")).toBeInTheDocument();
    expect(screen.getByText("Job Role Catalog")).toBeInTheDocument();
    expect(screen.getByText("Skill Graph")).toBeInTheDocument();
    expect(screen.getByText("Candidate Profiles")).toBeInTheDocument();
    expect(screen.getByText("People & Twins")).toBeInTheDocument();
    expect(screen.getByText("Policy Reasoning")).toBeInTheDocument();
    expect(screen.getByText("Data Quality Engine")).toBeInTheDocument();
  });
});
