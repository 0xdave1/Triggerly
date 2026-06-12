import { describe, expect, it } from "vitest";
import { triggerIntentToReminderInput } from "./confirmation";
import { parseTriggerIntent } from "./parser";

describe("trigger-intent feature", () => {
  it("parses and maps a location intent through the canonical feature boundary", () => {
    const intent = parseTriggerIntent("Remind me to buy rice when I get to Shoprite.");
    const reminder = triggerIntentToReminderInput(intent);

    expect(intent.requiresConfirmation).toBe(true);
    expect(reminder.type).toBe("location");
    expect(reminder.locationTrigger?.triggerType).toBe("arrival");
  });

  it("keeps action prompts locked behind explicit confirmation", () => {
    const intent = parseTriggerIntent("Remind me to pay Ada tomorrow");

    expect(intent.triggerType).toBe("action_prompt");
    expect(intent.requiresConfirmation).toBe(true);
    expect(triggerIntentToReminderInput(intent).actionType).toBe("open_payment_app");
  });
});
