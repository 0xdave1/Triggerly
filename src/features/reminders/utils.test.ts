import { describe, expect, it } from "vitest";
import { parseReminderInput, filterReminders, isTerminalStatus } from "./utils";
import type { ReminderWithTriggers } from "./types";

const baseReminder: ReminderWithTriggers = {
  id: "reminder_1",
  title: "Base",
  type: "time",
  status: "active",
  createdAt: "2026-05-22T09:00:00.000Z",
  updatedAt: "2026-05-22T09:00:00.000Z"
};

describe("parseReminderInput", () => {
  it("detects time reminders", () => {
    const parsed = parseReminderInput("Call Ada tomorrow");
    expect(parsed.triggerType).toBe("time");
    expect(parsed.confidence).toBeGreaterThan(0.5);
  });

  it("detects location reminders", () => {
    const parsed = parseReminderInput("Remind me when I arrive at Shoprite");
    expect(parsed.triggerType).toBe("location");
    expect(parsed.possibleLocationPhrase).toBe("Shoprite");
  });

  it("detects habit reminders", () => {
    const parsed = parseReminderInput("Drink water every day");
    expect(parsed.triggerType).toBe("habit");
  });
});

describe("filterReminders", () => {
  it("excludes deleted reminders and filters by type", () => {
    const reminders: ReminderWithTriggers[] = [
      baseReminder,
      { ...baseReminder, id: "reminder_2", type: "location" },
      { ...baseReminder, id: "reminder_3", type: "habit", status: "deleted" }
    ];

    expect(filterReminders(reminders, "all")).toHaveLength(2);
    expect(filterReminders(reminders, "location")).toHaveLength(1);
  });
});

describe("isTerminalStatus", () => {
  it("recognizes completed and deleted states", () => {
    expect(isTerminalStatus("completed")).toBe(true);
    expect(isTerminalStatus("deleted")).toBe(true);
    expect(isTerminalStatus("snoozed")).toBe(false);
  });
});
