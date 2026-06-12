import { VoiceSettingsService } from "./voice-settings.service";

describe("VoiceSettingsService", () => {
  it("updates user voice settings by owner id", async () => {
    const prisma = {
      userVoiceSetting: {
        upsert: jest.fn().mockResolvedValue({ userId: "u1", selectedVoiceStyle: "friendly" })
      }
    };
    const service = new VoiceSettingsService(prisma as any);

    await service.update("u1", { selectedVoiceStyle: "friendly", readLiveContext: false });

    expect(prisma.userVoiceSetting.upsert).toHaveBeenCalledWith({
      where: { userId: "u1" },
      create: { userId: "u1", selectedVoiceStyle: "friendly", readLiveContext: false },
      update: { selectedVoiceStyle: "friendly", readLiveContext: false }
    });
  });
});
