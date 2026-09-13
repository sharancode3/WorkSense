import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/context/auth-context";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "/",
}));

function ConsumerComponent() {
  const { isAuthenticated, user, roles, capabilities, hasCapability, hasRole } = useAuth();
  return (
    <div>
      <div data-testid="auth-state">{isAuthenticated ? "authenticated" : "unauthenticated"}</div>
      <div data-testid="user-email">{user?.email || "none"}</div>
      <div data-testid="user-roles">{roles.join(",")}</div>
      <div data-testid="user-capabilities">{capabilities.join(",")}</div>
      <div data-testid="has-admin">{hasCapability("admin.access") ? "yes" : "no"}</div>
      <div data-testid="is-employee">{hasRole("employee") ? "yes" : "no"}</div>
    </div>
  );
}

describe("AuthContext and AuthProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("initializes in unauthenticated state when no token is present", async () => {
    render(
      <AuthProvider>
        <ConsumerComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId("auth-state").textContent).toBe("unauthenticated");
    expect(screen.getByTestId("user-email").textContent).toBe("none");
    expect(screen.getByTestId("has-admin").textContent).toBe("no");
    expect(screen.getByTestId("is-employee").textContent).toBe("no");
  });
});
