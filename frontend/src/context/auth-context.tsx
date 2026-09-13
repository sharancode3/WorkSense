"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  AccessContext,
  SafeOrganization,
  SafeUser,
} from "@/types";
import {
  CandidateRegisterPayload,
  LoginPayload,
  fetchMyContextApi,
  loginApi,
  logoutApi,
  registerCandidateApi,
  switchOrgApi,
} from "@/lib/api/auth";
import { setAuthToken, setActiveOrgId } from "@/lib/api/client";

const AUTH_TOKEN_KEY = "worksense_auth_token";

interface AuthContextType {
  user: SafeUser | null;
  activeOrg: SafeOrganization | null;
  roles: string[];
  capabilities: string[];
  membershipStatus: string | null;
  availableOrgs: SafeOrganization[];
  defaultDestination: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCapability: (_capability: string) => boolean;
  hasRole: (_role: string) => boolean;
  login: (_payload: LoginPayload) => Promise<AccessContext>;
  registerCandidate: (_payload: CandidateRegisterPayload) => Promise<AccessContext>;
  logout: () => Promise<void>;
  switchOrganization: (_orgId: string) => Promise<void>;
  refreshContext: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [context, setContext] = useState<AccessContext | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const applyContext = useCallback((ctx: AccessContext) => {
    setContext(ctx);
    if (ctx.active_organization?.id) {
      setActiveOrgId(ctx.active_organization.id);
    } else {
      setActiveOrgId(null);
    }
  }, []);

  const restoreSession = useCallback(async () => {
    setIsLoading(true);
    try {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (token) {
          setAuthToken(token);
          const ctx = await fetchMyContextApi();
          applyContext(ctx);
        } else {
          setContext(null);
          setAuthToken(null);
        }
      }
    } catch {
      // Token expired or invalid
      if (typeof window !== "undefined") {
        localStorage.removeItem(AUTH_TOKEN_KEY);
      }
      setAuthToken(null);
      setActiveOrgId(null);
      setContext(null);
    } finally {
      setIsLoading(false);
    }
  }, [applyContext]);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = async (payload: LoginPayload): Promise<AccessContext> => {
    setIsLoading(true);
    try {
      const res = await loginApi(payload);
      setAuthToken(res.access_token);
      if (typeof window !== "undefined") {
        localStorage.setItem(AUTH_TOKEN_KEY, res.access_token);
      }
      applyContext(res.context);
      return res.context;
    } finally {
      setIsLoading(false);
    }
  };

  const registerCandidate = async (payload: CandidateRegisterPayload): Promise<AccessContext> => {
    setIsLoading(true);
    try {
      const res = await registerCandidateApi(payload);
      setAuthToken(res.access_token);
      if (typeof window !== "undefined") {
        localStorage.setItem(AUTH_TOKEN_KEY, res.access_token);
      }
      applyContext(res.context);
      return res.context;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await logoutApi();
    } catch {
      // Ignore network errors during sign-out
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem(AUTH_TOKEN_KEY);
      }
      setAuthToken(null);
      setActiveOrgId(null);
      setContext(null);
      setIsLoading(false);
      router.push("/auth/login");
    }
  };

  const switchOrganization = async (orgId: string) => {
    setIsLoading(true);
    try {
      const updatedCtx = await switchOrgApi(orgId);
      applyContext(updatedCtx);
      router.push(updatedCtx.default_destination);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshContext = async () => {
    try {
      const ctx = await fetchMyContextApi();
      applyContext(ctx);
    } catch {
      // Fallback
    }
  };

  const hasCapability = (cap: string): boolean => {
    if (!context) return false;
    return context.granted_capabilities.includes(cap);
  };

  const hasRole = (role: string): boolean => {
    if (!context) return false;
    return context.active_roles.includes(role);
  };

  return (
    <AuthContext.Provider
      value={{
        user: context?.user || null,
        activeOrg: context?.active_organization || null,
        roles: context?.active_roles || [],
        capabilities: context?.granted_capabilities || [],
        membershipStatus: context?.membership_status || null,
        availableOrgs: context?.available_organizations || [],
        defaultDestination: context?.default_destination || "/auth/login",
        isAuthenticated: Boolean(context?.user),
        isLoading,
        hasCapability,
        hasRole,
        login,
        registerCandidate,
        logout,
        switchOrganization,
        refreshContext,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
