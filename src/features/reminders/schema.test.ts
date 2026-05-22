import { describe, expect, it } from "vitest";
import { reminderCreateSchema } from "./schema";

describe("reminderCreateSchema", () => {
  it("requires a title", () => {
    expect(() => reminderCreateSchema.parse({ title: "", type: "time" })).toThrow();
  });

  it("requires a time trigger for time reminders", () => {
    expect(() => reminderCreateSchema.parse({ title: "Call Ada", type: "time" })).toThrow("Time reminders require a date and time.");
  });

  it("accepts a valid location reminder", () => {
    expect(
      reminderCreateSchema.parse({
        title: "Buy groceries",
        type: "location",
        locationTrigger: {
          placeName: "Shoprite",
          latitude: 6.5244,
          longitude: 3.3792,
          radiusMeters: 250,
          triggerType: "arrival"
        }
      })
    ).toMatchObject({ title: "Buy groceries" });
  });

  it("requires frequency for habit reminders", () => {
    expect(() => reminderCreateSchema.parse({ title: "Stretch", type: "habit" })).toThrow("Habit reminders require a frequency.");
  });
});
