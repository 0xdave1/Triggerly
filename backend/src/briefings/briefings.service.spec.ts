import { BriefingType } from "@/common/enums";
import { BriefingsService } from "./briefings.service";

describe("BriefingsService", () => {
  it("generates a briefing from confirmed user-owned data", async () => {
    const prisma = {
      briefingPreference: { upsert: jest.fn().mockResolvedValue({ includeActions: true, includeMemory: true, includeWeather: true }) },
      reminder: { findMany: jest.fn().mockResolvedValue([{ id: "r1", status: "ACTIVE" }]) },
      actionPrompt: { findMany: jest.fn().mockResolvedValue([{ id: "a1" }]) },
      promise: { findMany: jest.fn().mockResolvedValue([{ id: "p1" }]) },
      debt: { findMany: jest.fn().mockResolvedValue([]) },
      accountabilityGoal: { findMany: jest.fn().mockResolvedValue([]) },
      memory: { findMany: jest.fn().mockResolvedValue([{ id: "m1" }]) },
      followUpSuggestion: { findMany: jest.fn().mockResolvedValue([]) },
      travelPlan: { findMany: jest.fn().mockResolvedValue([]) },
      briefing: { create: jest.fn().mockImplementation(({ data }) => ({ id: "b1", ...data })) }
    };
    const privacy = { getSettings: jest.fn().mockResolvedValue({ briefingsEnabled: true }) };
    const service = new BriefingsService(prisma as any, privacy as any);

    const result = await service.generate("u1", { type: BriefingType.MORNING });

    expect(result.summary).toContain("1 active triggers");
    expect(prisma.briefing.create).toHaveBeenCalled();
  });
});
