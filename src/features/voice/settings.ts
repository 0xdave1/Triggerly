import { getStoredJson, setStoredJson } from "@/lib/storage";
import { defaultVoiceSettings } from "./types";
import type { VoiceSettings } from "./types";

const VOICE_SETTINGS_KEY = "triggerly.voiceSettings.v1";

export function getDefaultVoiceSettings(): VoiceSettings {
  return defaultVoiceSettings;
}

export async function loadVoiceSettings(): Promise<VoiceSettings> {
  return getStoredJson<VoiceSettings>(VOICE_SETTINGS_KEY, defaultVoiceSettings);
}

export async function saveVoiceSettings(settings: VoiceSettings): Promise<void> {
  await setStoredJson(VOICE_SETTINGS_KEY, settings);
}
