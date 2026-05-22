import { describe, expect, it } from "vitest";
import { formatDateTime, getNextHabitDueDate, toIsoDate } from "./dates";

describe("date utilities", () => {
  it("normalizes dates to ISO strings", () => {
    expect(toIsoDate(new Date("2026-05-22T10:00:00.000Z"))).toBe("2026-05-22T10:00:00.000Z");
  });

  it("formats missing dates clearly", () => {
    expect(formatDateTime()).toBe("Not set");
  });

  it("calculates next weekly habit due date", () => {
    const nextDue = getNextHabitDueDate({
      frequencyType: "weekly",
      frequencyCount: 2,
      lastCompletedAt: "2026-05-01T00:00:00.000Z"
    });

    expect(nextDue).toBe("2026-05-15T00:00:00.000Z");
  });
});
