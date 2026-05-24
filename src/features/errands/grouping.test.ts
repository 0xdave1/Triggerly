import { describe, expect, it } from "vitest";
import { groupErrandsByLocation } from "./grouping";
import type { ReminderWithTriggers } from "@/features/reminders/types";

const base: ReminderWithTriggers = {
  id: "r1",
  title: "Buy cookies",
  type: "location",
  status: "active",
  createdAt: "2026-05-22T10:00:00.000Z",
  updatedAt: "2026-05-22T10:00:00.000Z",
  locationTrigger: {
    id: "l1",
    reminderId: "r1",
    placeName: "Shoprite",
    latitude: 0,
    longitude: 0,
    radiusMeters: 250,
    triggerType: "arrival"
  }
};

describe("groupErrandsByLocation", () => {
  it("groups multiple active location reminders by place", () => {
    const groups = groupErrandsByLocation([
      base,
      { ...base, id: "r2", title: "Buy detergent", locationTrigger: { ...base.locationTrigger!, id: "l2", reminderId: "r2" } }
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].placeName).toBe("Shoprite");
    expect(groups[0].voiceScript).toContain("You have 2 things");
  });
});
