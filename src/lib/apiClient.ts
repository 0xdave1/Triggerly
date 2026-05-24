import { APP_CONFIG } from "@/constants/config";
import { getAuthToken } from "@/features/auth/tokenStorage";

export type ApiMethod = "GET" | "POST" | "PATCH" | "DELETE";

export type ApiRequest = {
  method: ApiMethod;
  path: string;
  body?: unknown;
  auth?: boolean;
};

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code: "api" | "network" | "auth" = "api"
  ) {
    super(message);
  }
}

export function getFriendlyApiError(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.code === "network") return "Triggerly is offline or the server is unavailable. Your local reminders still work.";
    if (error.status === 401) return "Please sign in again.";
    if (error.status === 409) return "An account already exists for that email.";
    if (error.status === 429) return "Too many attempts. Please wait a moment and try again.";
  }
  return "Something went wrong. Please try again.";
}

export function isBackendUnavailable(error: unknown): boolean {
  return error instanceof ApiClientError && (error.code === "network" || error.status === 503 || error.status === 504);
}

export async function apiClient<T>(request: ApiRequest): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json"
  };

  if (request.auth !== false) {
    const token = await getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const url = `${APP_CONFIG.apiBaseUrl.replace(/\/$/, "")}${request.path}`;

  try {
    const response = await fetch(url, {
      method: request.method,
      headers,
      body: request.body ? JSON.stringify(request.body) : undefined
    });

    if (!response.ok) {
      throw new ApiClientError("Request failed.", response.status, response.status === 401 ? "auth" : "api");
    }

    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiClientError) throw error;
    throw new ApiClientError("Network request failed.", undefined, "network");
  }
}
