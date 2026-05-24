import { apiClient } from "@/lib/apiClient";
import type { AuthResponse, AuthUser, LoginInput, RegisterInput } from "./types";

export function login(input: LoginInput) {
  return apiClient<AuthResponse>({ method: "POST", path: "/auth/login", body: input, auth: false });
}

export function register(input: RegisterInput) {
  return apiClient<AuthResponse>({ method: "POST", path: "/auth/register", body: input, auth: false });
}

export function getMe() {
  return apiClient<AuthUser>({ method: "GET", path: "/me" });
}
