import { HabitFrequencyType } from "@/common/enums";
import { calculateNextDueAt } from "./habit-dates";

describe("calculateNextDueAt", () => {
  it("adds days for DAILY", () => {
    expect(calculateNextDueAt(HabitFrequencyType.DAILY, 2, new Date("2026-05-01T00:00:00.000Z")).toISOString()).toBe("2026-05-03T00:00:00.000Z");
  });

  it("adds weeks for WEEKLY", () => {
    expect(calculateNextDueAt(HabitFrequencyType.WEEKLY, 2, new Date("2026-05-01T00:00:00.000Z")).toISOString()).toBe("2026-05-15T00:00:00.000Z");
  });

  it("treats CUSTOM as days for MVP", () => {
    expect(calculateNextDueAt(HabitFrequencyType.CUSTOM, 3, new Date("2026-05-01T00:00:00.000Z")).toISOString()).toBe("2026-05-04T00:00:00.000Z");
  });
});
