import { PrivacyService } from "./privacy.service";

describe("PrivacyService", () => {
  it("exports only user-owned data", async () => {
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ id: "u1", email: "ada@example.com" }) },
      reminder: { findMany: jest.fn().mockResolvedValue([{ id: "r1", userId: "u1" }]) },
      reminderEvent: { findMany: jest.fn().mockResolvedValue([{ id: "e1", userId: "u1" }]) },
      device: { findMany: jest.fn().mockResolvedValue([{ id: "d1", userId: "u1" }]) },
      userPrivacySetting: { findUnique: jest.fn().mockResolvedValue({ userId: "u1" }) }
    };
    const service = new PrivacyService(prisma as any);

    const exported = await service.exportUserData("u1");

    expect(prisma.reminder.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: "u1" } }));
    expect(exported.reminders).toHaveLength(1);
  });
});
