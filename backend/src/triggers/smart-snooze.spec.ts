import { TriggersService } from "./triggers.service";

describe("TriggersService smart snooze", () => {
  it("blocks location snooze when location triggers are disabled", async () => {
    const prisma = {
      trigger: { findFirst: jest.fn().mockResolvedValue({ id: "t1", reminderId: "r1" }) },
      reminder: { findFirst: jest.fn().mockResolvedValue({ id: "r1", title: "Buy fuel" }) }
    };
    const privacy = { getSettings: jest.fn().mockResolvedValue({ smartSnoozeEnabled: true, locationTriggersEnabled: false }) };
    const service = new TriggersService(prisma as any, privacy as any);

    await expect(service.smartSnooze("u1", "t1", { mode: "arrival", placeName: "Total" })).rejects.toThrow("Location triggers are disabled");
  });
});
