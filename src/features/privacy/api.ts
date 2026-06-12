import { apiClient } from "@/lib/apiClient";
import type { PrivacySettings } from "./types";

export function getPrivacySettings(): Promise<PrivacySettings> {
  return apiClient<PrivacySettings>({ method: "GET", path: "/privacy/settings" });
}

export function updatePrivacySettings(input: Partial<PrivacySettings>): Promise<PrivacySettings> {
  return apiClient<PrivacySettings>({ method: "PATCH", path: "/privacy/settings", body: input });
}

export function exportPrivacyData(): Promise<unknown> {
  return apiClient<unknown>({ method: "GET", path: "/privacy/export" });
}

export function requestAccountDeletion(confirmation: string): Promise<{ deleted: true } | unknown> {
  return apiClient({ method: "DELETE", path: "/privacy/delete-account", body: { confirmation } });
}
