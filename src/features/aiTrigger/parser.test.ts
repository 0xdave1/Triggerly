import { describe, expect, it } from "vitest";
import { parseTriggerIntent, selectDeliveryMode } from "./parser";

describe("parseTriggerIntent", () => {
  it("parses location arrival reminders", () => {
    const intent = parseTriggerIntent("Remind me to buy cookies when I get to Shoprite.");

    expect(intent).toMatchObject({
      taskTitle: "Buy cookies",
      triggerType: "location_arrival",
      locationCandidate: "Shoprite",
      suggestedDeliveryMode: "voice_and_push",
      requiresConfirmation: true
    });
  });

  it("parses location departure reminders", () => {
    const intent = parseTriggerIntent("When I leave home, remind me to take my charger.");

    expect(intent.triggerType).toBe("location_departure");
    expect(intent.locationCandidate).toBe("home");
    expect(intent.requiresConfirmation).toBe(true);
  });

  it("parses weekly habit reminders", () => {
    const intent = parseTriggerIntent("Every Sunday evening remind me to review my spending.");

    expect(intent.triggerType).toBe("habit");
    expect(intent.frequency).toBe("weekly");
    expect(intent.dayOfWeek).toBe("Sunday");
    expect(intent.timeOfDay).toBe("evening");
  });

  it("locks sensitive action prompts behind confirmation", () => {
    const intent = parseTriggerIntent("Remind me to pay Tola when I get home.");

    expect(intent.triggerType).toBe("action_prompt");
    expect(intent.actionType).toBe("open_payment_app");
    expect(intent.requiresConfirmation).toBe(true);
  });
});

describe("selectDeliveryMode", () => {
  it("uses voice and push for location triggers", () => {
    expect(selectDeliveryMode("location_arrival")).toBe("voice_and_push");
  });
});
