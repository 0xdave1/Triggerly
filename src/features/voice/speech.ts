import type { VoiceSettings } from "./types";

export async function speakReminder(script: string, voiceSettings: VoiceSettings): Promise<void> {
  if (!voiceSettings.voiceNotificationsEnabled) return;

  const speech = loadSpeechModule();
  if (!speech) return;
  speech.speak(script, {
    voice: voiceSettings.selectedVoiceId,
    volume: voiceSettings.voiceVolume,
    pitch: voiceSettings.selectedVoiceStyle === "energetic" ? 1.08 : 1,
    rate: voiceSettings.selectedVoiceStyle === "minimal" ? 0.92 : 1
  });
}

type SpeechModule = {
  speak: (text: string, options?: Record<string, unknown>) => void;
};

function loadSpeechModule(): SpeechModule | undefined {
  try {
    const runtimeRequire = eval("require") as (name: string) => SpeechModule;
    return runtimeRequire("expo-speech");
  } catch {
    // Platform/background voice support varies. Triggerly falls back silently
    // when expo-speech is unavailable instead of pretending voice fired.
    return undefined;
  }
}
