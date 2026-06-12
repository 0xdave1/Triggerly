import { PrivacyService } from "./privacy.service";

describe("PrivacyService", () => {
  it("exports only user-owned data", async () => {
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ id: "u1", email: "ada@example.com" }) },
      reminder: { findMany: jest.fn().mockResolvedValue([{ id: "r1", userId: "u1" }]) },
      reminderEvent: { findMany: jest.fn().mockResolvedValue([{ id: "e1", userId: "u1" }]) },
      device: { findMany: jest.fn().mockResolvedValue([{ id: "d1", userId: "u1" }]) },
      userPrivacySetting: { findUnique: jest.fn().mockResolvedValue({ userId: "u1" }) },
      memory: { findMany: jest.fn().mockResolvedValue([]) }
    };
    const service = new PrivacyService(prisma as any);

    const exported = await service.exportUserData("u1");

    expect(prisma.reminder.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: "u1" } }));
    expect(exported.reminders).toHaveLength(1);
  });

  it("blocks AI parsing when disabled", async () => {
    const prisma = {
      userPrivacySetting: {
        upsert: jest.fn().mockResolvedValue({ userId: "u1", aiParsingEnabled: false })
      }
    };
    const service = new PrivacyService(prisma as any);

    await expect(service.assertCanParseAi("u1")).rejects.toThrow("AI parsing is disabled");
  });
});
