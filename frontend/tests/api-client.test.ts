import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient, ApiError } from "@/lib/api/client";

describe("Typed API Client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("successfully parses JSON responses on HTTP 200", async () => {
    const mockData = { status: "healthy", version: "1.0.0" };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ "X-Correlation-ID": "req-12345" }),
      json: async () => mockData,
    });

    const result = await apiClient<{ status: string }>("/health");
    expect(result.status).toBe("healthy");
  });

  it("normalizes backend error envelope into an ApiError instance", async () => {
    const errorPayload = {
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input payload",
        details: { field: "email" },
        request_id: "req-err-456",
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      statusText: "Unprocessable Entity",
      headers: new Headers({ "X-Correlation-ID": "req-err-456" }),
      json: async () => errorPayload,
    });

    await expect(apiClient("/api/v1/invalid")).rejects.toThrowError(ApiError);

    try {
      await apiClient("/api/v1/invalid");
    } catch (err) {
      const apiErr = err as ApiError;
      expect(apiErr.code).toBe("VALIDATION_ERROR");
      expect(apiErr.message).toBe("Invalid input payload");
      expect(apiErr.requestId).toBe("req-err-456");
      expect(apiErr.status).toBe(422);
    }
  });

  it("handles network failure and transforms to normalized ApiError", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Failed to fetch"));

    try {
      await apiClient("/health");
      expect.unreachable();
    } catch (err) {
      const apiErr = err as ApiError;
      expect(apiErr.code).toBe("NETWORK_ERROR");
      expect(apiErr.message).toBe("Failed to fetch");
    }
  });
});
