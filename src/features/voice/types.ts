import type { VoiceStyle } from "@/features/reminders/types";

export type VoiceSettings = {
  voiceNotificationsEnabled: boolean;
  selectedVoiceStyle: VoiceStyle;
  selectedVoiceId?: string;
  voiceVolume: number;
  readFullReminder: boolean;
  readLocationContext: boolean;
  readLiveContext: boolean;
};

export type AvailableVoice = {
  identifier: string;
  name: string;
  language: string;
  quality?: string;
};

export const defaultVoiceSettings: VoiceSettings = {
  voiceNotificationsEnabled: false,
  selectedVoiceStyle: "calm",
  selectedVoiceId: undefined,
  voiceVolume: 0.8,
  readFullReminder: true,
  readLocationContext: true,
  readLiveContext: true
};
