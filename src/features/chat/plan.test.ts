import { describe, expect, it } from "vitest";
import type { AgentPlanItem } from "./types";

function requiresSensitiveWarning(item: AgentPlanItem) {
  return item.sensitive || item.riskLevel === "sensitive";
}

function canConfirm(item: AgentPlanItem) {
  return item.status === "proposed" && item.requiresConfirmation && !item.payload.blockedBy;
}

describe("chat plan safety", () => {
  it("shows sensitive treatment for payment actions", () => {
    expect(
      requiresSensitiveWarning({
        id: "i1",
        type: "create_action_prompt",
        title: "Payment reminder",
        description: "Prepare only",
        riskLevel: "sensitive",
        status: "proposed",
        payload: { executionAllowed: false },
        requiresConfirmation: true,
        sensitive: true
      })
    ).toBe(true);
  });

  it("blocks confirmation while a feature is disabled", () => {
    expect(
      canConfirm({
        id: "i2",
        type: "create_live_context_trigger",
        title: "Weather alert",
        description: "Enable weather first",
        riskLevel: "low",
        status: "proposed",
        payload: { blockedBy: "weatherTriggersEnabled" },
        requiresConfirmation: true,
        sensitive: false
      })
    ).toBe(false);
  });
});
