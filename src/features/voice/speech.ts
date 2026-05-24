import type { VoiceSettings } from "./types";

export async function speakReminder(script: string, voiceSettings: VoiceSettings): Promise<void> {
  if (!voiceSettings.voiceNotificationsEnabled) return;

  // TODO: Use expo-speech when the package is added to the Expo app.
  // OS support for speaking from background notifications is limited; this
  // abstraction is for foreground preview and notification-open playback first.
  console.info("voice_preview_placeholder", {
    script,
    voiceStyle: voiceSettings.selectedVoiceStyle,
    selectedVoiceId: voiceSettings.selectedVoiceId,
    voiceVolume: voiceSettings.voiceVolume
  });
}
