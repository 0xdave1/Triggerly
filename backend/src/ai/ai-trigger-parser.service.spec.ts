import { ActionType, DeliveryMode } from "@/common/enums";
import { AiTriggerParserService } from "./ai-trigger-parser.service";

describe("AiTriggerParserService", () => {
  const parser = new AiTriggerParserService();

  it("detects location arrival", () => {
    expect(parser.parse("Remind me to buy cookies when I get to Shoprite.")).toMatchObject({
      taskTitle: "Buy cookies",
      triggerType: "location_arrival",
      locationCandidate: "Shoprite",
      suggestedDeliveryMode: DeliveryMode.VOICE_AND_PUSH,
      requiresConfirmation: true
    });
  });

  it("detects departure", () => {
    expect(parser.parse("When I leave home, remind me to take my charger.")).toMatchObject({
      triggerType: "location_departure",
      locationCandidate: "home"
    });
  });

  it("detects habit", () => {
    expect(parser.parse("Every Sunday remind me to review my spending.")).toMatchObject({
      triggerType: "habit",
      habitCandidate: "every sunday"
    });
  });

  it("detects payment action without execution", () => {
    const parsed = parser.parse("Remind me to pay David tomorrow");
    expect(parsed.triggerType).toBe("action_prompt");
    expect(parsed.actionCandidate?.actionType).toBe(ActionType.OPEN_PAYMENT_APP);
    expect(parsed.actionCandidate?.payload.safety).toBe("confirmation_required_no_auto_execute");
    expect(parsed.requiresConfirmation).toBe(true);
  });
});
