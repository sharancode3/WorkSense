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

    expect(screen.getByText("Candidate Portal")).toBeInTheDocument();
    // Candidate can see Skill Taxonomy & Graph
    expect(screen.getByText("Skill Taxonomy & Graph")).toBeInTheDocument();
    // But cannot see departments, candidates, employees, or data quality
    expect(screen.queryByText("Departments & Org Tree")).not.toBeInTheDocument();
    expect(screen.queryByText("Candidate Profiles & Twins")).not.toBeInTheDocument();
    expect(screen.queryByText("Employee Directory & Twins")).not.toBeInTheDocument();
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

    expect(screen.getByText("Workforce Foundation")).toBeInTheDocument();
    expect(screen.getByText("Departments & Org Tree")).toBeInTheDocument();
    expect(screen.getByText("Job Role Catalog")).toBeInTheDocument();
    expect(screen.getByText("Skill Taxonomy & Graph")).toBeInTheDocument();
    expect(screen.getByText("Employee Directory & Twins")).toBeInTheDocument();
    expect(screen.getByText("Policy Documents")).toBeInTheDocument();

    // HR/Recruiter/Admin exclusive items should NOT appear
    expect(screen.queryByText("Candidate Profiles & Twins")).not.toBeInTheDocument();
    expect(screen.queryByText("Data Quality Engine")).not.toBeInTheDocument();
  });

  it("shows recruiter authorized items (Candidates, Job Roles, Skills, Employees)", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "rec-1", full_name: "Rachel Zane", email: "recruiter@worksense.local" },
      roles: ["recruiter"],
      activeOrg: { id: "org-1", name: "TechCorp", slug: "techcorp" },
      hasCapability: (cap: string) => ["portal.recruiter.access"].includes(cap),
      logout: vi.fn(),
    });

    renderSidebar();

    expect(screen.getByText("Workforce Foundation")).toBeInTheDocument();
    expect(screen.getByText("Job Role Catalog")).toBeInTheDocument();
    expect(screen.getByText("Skill Taxonomy & Graph")).toBeInTheDocument();
    expect(screen.getByText("Candidate Profiles & Twins")).toBeInTheDocument();
    expect(screen.getByText("Employee Directory & Twins")).toBeInTheDocument();

    // Recruiter cannot see data-quality
    expect(screen.queryByText("Data Quality Engine")).not.toBeInTheDocument();
  });

  it("shows all workforce foundation modules to HR and Administrators", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "hr-1", full_name: "Hanna Reid", email: "hr@worksense.local" },
      roles: ["hr"],
      activeOrg: { id: "org-1", name: "TechCorp", slug: "techcorp" },
      hasCapability: (cap: string) => ["portal.hr.access"].includes(cap),
      logout: vi.fn(),
    });

    renderSidebar();

    expect(screen.getByText("Workforce Foundation")).toBeInTheDocument();
    expect(screen.getByText("Departments & Org Tree")).toBeInTheDocument();
    expect(screen.getByText("Job Role Catalog")).toBeInTheDocument();
    expect(screen.getByText("Skill Taxonomy & Graph")).toBeInTheDocument();
    expect(screen.getByText("Candidate Profiles & Twins")).toBeInTheDocument();
    expect(screen.getByText("Employee Directory & Twins")).toBeInTheDocument();
    expect(screen.getByText("Policy Documents")).toBeInTheDocument();
    expect(screen.getByText("Data Quality Engine")).toBeInTheDocument();
  });
});
