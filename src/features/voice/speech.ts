import type { AvailableVoice, VoiceSettings } from "./types";

export async function speakText(script: string, voiceSettings: VoiceSettings, options: { allowWhenDisabled?: boolean } = {}): Promise<boolean> {
  if (!voiceSettings.voiceNotificationsEnabled && !options.allowWhenDisabled) return false;
  const text = script.trim();
  if (!text) return false;

  const speech = loadSpeechModule();
  if (!speech) return false;
  await speech.stop().catch(() => undefined);
  speech.speak(text, {
    voice: voiceSettings.selectedVoiceId,
    volume: voiceSettings.voiceVolume,
    ...styleOptions(voiceSettings.selectedVoiceStyle)
  });
  return true;
}

export function speakReminder(script: string, voiceSettings: VoiceSettings): Promise<boolean> {
  return speakText(script, voiceSettings);
}

export async function stopSpeaking(): Promise<void> {
  await loadSpeechModule()?.stop().catch(() => undefined);
}

export async function getAvailableVoices(): Promise<AvailableVoice[]> {
  const voices = await loadSpeechModule()?.getAvailableVoicesAsync().catch(() => []);
  return (voices ?? []).map((voice) => ({
    identifier: voice.identifier,
    name: voice.name,
    language: voice.language,
    quality: voice.quality
  }));
}

export function privacySafeVoiceText(script: string, settings: VoiceSettings, options: { locationBased?: boolean; liveContext?: boolean } = {}) {
  if (!settings.readFullReminder) return "You have a Triggerly reminder ready to review.";
  if (options.locationBased && !settings.readLocationContext) return "A location reminder is ready to review.";
  if (options.liveContext && !settings.readLiveContext) return "A live context alert is ready to review.";
  return script;
}

type SpeechVoice = {
  identifier: string;
  name: string;
  language: string;
  quality?: string;
};

type SpeechModule = {
  speak: (text: string, options?: Record<string, unknown>) => void;
  stop: () => Promise<void>;
  getAvailableVoicesAsync: () => Promise<SpeechVoice[]>;
};

function styleOptions(style: VoiceSettings["selectedVoiceStyle"]) {
  if (style === "energetic") return { pitch: 1.08, rate: 1.08 };
  if (style === "professional") return { pitch: 1, rate: 0.95 };
  if (style === "friendly") return { pitch: 1.04, rate: 0.98 };
  if (style === "minimal") return { pitch: 1, rate: 1.02 };
  return { pitch: 0.98, rate: 0.9 };
}

function loadSpeechModule(): SpeechModule | undefined {
  try {
    const runtimeRequire = eval("require") as (name: string) => SpeechModule;
    return runtimeRequire("expo-speech");
  } catch {
    return undefined;
  }
}
