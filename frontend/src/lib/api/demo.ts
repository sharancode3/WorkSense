import { apiClient } from "./client";

export interface DemoPersona {
  id: string;
  name: string;
  email: string;
  role: string;
  title: string;
  department: string;
  narrative_focus: string;
  avatar_color: string;
}

export interface DemoResetResponse {
  status: string;
  message: string;
  entities_reset: Record<string, number>;
}

export const demoApi = {
  getPersonas: async (): Promise<DemoPersona[]> => {
    return apiClient<DemoPersona[]>("/api/v1/demo/personas", { method: "GET" });
  },

  resetDemoState: async (): Promise<DemoResetResponse> => {
    return apiClient<DemoResetResponse>("/api/v1/demo/reset", { method: "POST" });
  },

  getMarcusChenGoldenPath: async (): Promise<Record<string, unknown>> => {
    return apiClient<Record<string, unknown>>("/api/v1/demo/golden-path/marcus-chen", { method: "GET" });
  },

  getElenaRostovaGoldenPath: async (): Promise<Record<string, unknown>> => {
    return apiClient<Record<string, unknown>>("/api/v1/demo/golden-path/elena-rostova", { method: "GET" });
  },
};

