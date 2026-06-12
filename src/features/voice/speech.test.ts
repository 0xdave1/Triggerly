import { describe, expect, it } from "vitest";
import { speakReminder } from "./speech";
import { defaultVoiceSettings } from "./types";

describe("voice playback gate", () => {
  it("does not speak when voice notifications are disabled", async () => {
    await expect(speakReminder("test", { ...defaultVoiceSettings, voiceNotificationsEnabled: false })).resolves.toBe(false);
  });
});
