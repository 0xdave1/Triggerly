import { WidgetsService } from "./widgets.service";

describe("WidgetsService", () => {
  it("returns privacy-safe preview data and marks native widgets unavailable", async () => {
    const prisma = {
      widgetPreference: { upsert: jest.fn().mockResolvedValue({ nextTriggerEnabled: true, briefingEnabled: true, pendingActionsEnabled: true, habitsEnabled: true, weatherEnabled: false }) },
      reminder: { findFirst: jest.fn().mockResolvedValue({ id: "r1", title: "Call David" }) },
      briefing: { findFirst: jest.fn().mockResolvedValue({ id: "b1", summary: "Two things today" }) },
      actionPrompt: { count: jest.fn().mockResolvedValue(2) },
      accountabilityGoal: { count: jest.fn().mockResolvedValue(1) },
      travelPlan: { findFirst: jest.fn().mockResolvedValue(null) }
    };
    const privacy = { getSettings: jest.fn().mockResolvedValue({ widgetSummaryEnabled: true }) };
    const service = new WidgetsService(prisma as any, privacy as any);

    const result = await service.summary("u1");

    expect(result).toMatchObject({ pendingActions: 2, accountabilityGoals: 1, nativeWidgetAvailable: false });
  });
});
