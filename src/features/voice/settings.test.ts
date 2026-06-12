import { describe, expect, it } from "vitest";
import { defaultVoiceSettings } from "./types";

describe("voice settings defaults", () => {
  it("defaults to disabled voice notifications", () => {
    expect(defaultVoiceSettings).toMatchObject({
      voiceNotificationsEnabled: false,
      selectedVoiceStyle: "calm",
      readLocationContext: true,
      readLiveContext: true
    });
  });
});
