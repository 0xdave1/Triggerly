import { apiClient, isBackendUnavailable } from "@/lib/apiClient";
import { loadVoiceSettings, saveVoiceSettings } from "./settings";
import { defaultVoiceSettings, type VoiceSettings } from "./types";

export function generateVoiceScript(input: { reminderId?: string; intent?: Record<string, unknown>; context?: Record<string, unknown> }): Promise<{ script: string }> {
  return apiClient<{ script: string }>({ method: "POST", path: "/voice/generate-script", body: input });
}

export function previewVoiceScript(input: { intent?: Record<string, unknown>; context?: Record<string, unknown> }): Promise<{ script: string }> {
  return apiClient<{ script: string }>({ method: "POST", path: "/voice/preview-script", body: input });
}

export async function getVoiceSettings(): Promise<VoiceSettings> {
  try {
    const settings = await apiClient<Partial<VoiceSettings>>({ method: "GET", path: "/voice/settings" });
    const merged = { ...defaultVoiceSettings, ...settings };
    await saveVoiceSettings(merged);
    return merged;
  } catch (error) {
    if (!isBackendUnavailable(error)) throw error;
    return loadVoiceSettings();
  }
}

export async function updateVoiceSettings(input: Partial<VoiceSettings>): Promise<VoiceSettings> {
  const local = { ...(await loadVoiceSettings()), ...input };
  await saveVoiceSettings(local);
  try {
    const {
      voiceNotificationsEnabled,
      selectedVoiceStyle,
      selectedVoiceId,
      readFullReminder,
      readLocationContext,
      readLiveContext
    } = input;
    const remoteInput = {
      voiceNotificationsEnabled,
      selectedVoiceStyle,
      selectedVoiceId,
      readFullReminder,
      readLocationContext,
      readLiveContext
    };
    const settings = await apiClient<Partial<VoiceSettings>>({
      method: "PATCH",
      path: "/voice/settings",
      body: remoteInput
    });
    const merged = { ...local, ...settings };
    await saveVoiceSettings(merged);
    return merged;
  } catch (error) {
    if (!isBackendUnavailable(error)) throw error;
    return local;
  }
}
