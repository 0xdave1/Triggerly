import { describe, expect, it } from "vitest";
import { canConfirmIntent, getIntentGateMessage } from "./intentConfirmation";
import type { ParsedIntent } from "./types";

describe("intent confirmation flow", () => {
  it("does not confirm unknown low-confidence commands", () => {
    const intent: ParsedIntent = {
      intentType: "unknown",
      confidence: 0.2,
      requiresConfirmation: true,
      clarificationQuestion: "What should Triggerly do?"
    };

    expect(canConfirmIntent(intent)).toBe(false);
    expect(getIntentGateMessage(intent)).toContain("Triggerly");
  });

  it("allows payment action only as a confirmed pending action", () => {
    const intent: ParsedIntent = {
      intentType: "action_prompt",
      taskTitle: "Prepare payment",
      actionCandidate: { actionType: "OPEN_PAYMENT_APP", payload: { safety: "confirmation_required_no_auto_payment" } },
      confidence: 0.8,
      requiresConfirmation: true
    };

    expect(canConfirmIntent(intent)).toBe(true);
    expect(getIntentGateMessage(intent)).toContain("Payment actions require explicit permission");
  });
});
