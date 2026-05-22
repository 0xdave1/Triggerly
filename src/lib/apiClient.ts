export type ApiMethod = "GET" | "POST" | "PATCH" | "DELETE";

export type ApiRequest = {
  method: ApiMethod;
  path: string;
  body?: unknown;
};

export async function apiClient<T>(_request: ApiRequest): Promise<T> {
  throw new Error("Backend API is not connected yet. Use the local reminder API for the MVP.");
}
