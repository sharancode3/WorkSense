import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProtectedRoute } from "@/components/auth/protected-route";

const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: mockReplace,
  }),
  usePathname: () => "/",
}));

const mockUseAuth = vi.fn();
vi.mock("@/context/auth-context", () => ({
  useAuth: () => mockUseAuth(),
}));

describe("ProtectedRoute Guard Component", () => {
  it("renders loading state when authentication is resolving", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      hasCapability: () => false,
      hasRole: () => false,
    });

    render(
      <ProtectedRoute>
        <div>Secret Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText(/Verifying authorization/i)).toBeInTheDocument();
    expect(screen.queryByText("Secret Content")).not.toBeInTheDocument();
  });

  it("redirects unauthenticated user to /auth/login", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      hasCapability: () => false,
      hasRole: () => false,
    });

    render(
      <ProtectedRoute>
        <div>Secret Content</div>
      </ProtectedRoute>
    );

    expect(mockReplace).toHaveBeenCalledWith("/auth/login");
    expect(screen.queryByText("Secret Content")).not.toBeInTheDocument();
  });

  it("redirects user without required capability to /unauthorized", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      hasCapability: (cap: string) => cap === "portal.employee.access",
      hasRole: () => true,
    });

    render(
      <ProtectedRoute requiredCapability="admin.access">
        <div>Admin Dashboard</div>
      </ProtectedRoute>
    );

    expect(mockReplace).toHaveBeenCalledWith("/unauthorized");
    expect(screen.queryByText("Admin Dashboard")).not.toBeInTheDocument();
  });

  it("renders protected children when capability matches", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      hasCapability: (cap: string) => cap === "admin.access",
      hasRole: () => true,
    });

    render(
      <ProtectedRoute requiredCapability="admin.access">
        <div>Admin Dashboard</div>
      </ProtectedRoute>
    );

    expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
  });
});
