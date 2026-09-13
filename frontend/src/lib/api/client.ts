import { env } from "@/config/env";
import { ApiErrorDetail, ApiErrorResponse } from "@/types";

export class ApiError extends Error {
  public readonly code: string;
  public readonly details: Record<string, unknown>;
  public readonly requestId: string;
  public readonly status: number;

  constructor(status: number, errorDetail: ApiErrorDetail) {
    super(errorDetail.message);
    this.name = "ApiError";
    this.status = status;
    this.code = errorDetail.code;
    this.details = errorDetail.details || {};
    this.requestId = errorDetail.request_id || "unknown";
  }
}

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  params?: Record<string, string | number | boolean | undefined>;
}

let currentAuthToken: string | null = null;
let currentActiveOrgId: string | null = null;

export function setAuthToken(token: string | null): void {
  currentAuthToken = token;
}

export function getAuthToken(): string | null {
  return currentAuthToken;
}

export function setActiveOrgId(orgId: string | null): void {
  currentActiveOrgId = orgId;
}

/**
 * Cleanly appends query parameters to a path.
 */
function buildUrl(base: string, path: string, params?: Record<string, string | number | boolean | undefined>): string {
  const cleanBase = base.replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${cleanBase}${cleanPath}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
}

/**
 * Core WorkSense API client.
 */
export async function apiClient<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { timeoutMs = 10000, params, signal: callerSignal, headers: customHeaders, ...fetchOptions } = options;

  const url = buildUrl(env.apiBaseUrl, path, params);

  // Setup timeout controller
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort(new Error(`Request timeout after ${timeoutMs}ms`));
  }, timeoutMs);

  // Combine caller signal with timeout
  if (callerSignal) {
    callerSignal.addEventListener("abort", () => {
      abortController.abort(callerSignal.reason);
    });
  }

  const isFormData = typeof FormData !== "undefined" && fetchOptions.body instanceof FormData;
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(fetchOptions.body && !isFormData ? { "Content-Type": "application/json" } : {}),
    ...(currentAuthToken ? { Authorization: `Bearer ${currentAuthToken}` } : {}),
    ...(currentActiveOrgId ? { "X-Organization-ID": currentActiveOrgId } : {}),
    ...(customHeaders as Record<string, string>),
  };

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: abortController.signal,
    });

    clearTimeout(timeoutId);

    const requestId = response.headers.get("X-Correlation-ID") || response.headers.get("X-Request-ID") || "unknown";

    // Handle error responses
    if (!response.ok) {
      let errorDetail: ApiErrorDetail;
      try {
        const errorJson = (await response.json()) as ApiErrorResponse;
        if (errorJson?.error) {
          errorDetail = {
            ...errorJson.error,
            request_id: errorJson.error.request_id || requestId,
          };
        } else {
          errorDetail = {
            code: `HTTP_${response.status}`,
            message: `Request failed with status ${response.status}`,
            details: {},
            request_id: requestId,
          };
        }
      } catch {
        errorDetail = {
          code: `HTTP_${response.status}`,
          message: response.statusText || `Request failed with status ${response.status}`,
          details: {},
          request_id: requestId,
        };
      }

      throw new ApiError(response.status, errorDetail);
    }

    // 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    const isAbort = error instanceof DOMException && error.name === "AbortError";
    const message = isAbort
      ? `Network request timed out or cancelled`
      : error instanceof Error
      ? error.message
      : "An unexpected network error occurred";

    throw new ApiError(0, {
      code: isAbort ? "TIMEOUT" : "NETWORK_ERROR",
      message,
      details: { original_error: String(error) },
      request_id: "client-side",
    });
  }
}
