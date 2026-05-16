import { isSupabaseConfigured, supabase } from "./supabase";

export function getApiBaseUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL?.trim();
  return url && url.length > 0 ? url.replace(/\/$/, "") : "http://localhost:3000";
}

/** API routes require Supabase auth + a configured API base URL. */
export function isApiConfigured(): boolean {
  return isSupabaseConfigured() && Boolean(process.env.EXPO_PUBLIC_API_URL?.trim());
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!supabase) {
    throw new ApiError("Supabase is not configured.", 503);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    throw new ApiError("You must be signed in.", 401);
  }

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json().catch(() => ({}))) as {
    message?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new ApiError(
      payload.message ?? `Request failed (${response.status})`,
      response.status,
      payload.error,
    );
  }

  return payload as T;
}
