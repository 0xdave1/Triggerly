import { apiClient } from "@/lib/apiClient";

export function generateVoiceScript(input: { reminderId?: string; intent?: Record<string, unknown>; context?: Record<string, unknown> }): Promise<{ script: string }> {
  return apiClient<{ script: string }>({ method: "POST", path: "/voice/generate-script", body: input });
}
