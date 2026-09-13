/**
 * Frontend Environment Configuration
 * Centralizes and validates all client-accessible environment variables.
 */

function cleanUrl(url: string | undefined, fallback: string): string {
  if (!url || typeof url !== "string") {
    return fallback;
  }
  return url.trim().replace(/\/+$/, "");
}

export const env = {
  apiBaseUrl: cleanUrl(process.env.NEXT_PUBLIC_API_BASE_URL, "http://localhost:8000"),
  supabaseUrl: cleanUrl(process.env.NEXT_PUBLIC_SUPABASE_URL, ""),
  supabaseAnonKey: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim(),
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
  appVersion: "1.0.0",
} as const;
