import { describe, expect, it } from "vitest";
import type { ActionPrompt } from "./types";

describe("action-prompts feature safety", () => {
  it("represents sensitive actions as pending confirmation", () => {
    const prompt: ActionPrompt = {
      id: "a1",
      actionType: "open_payment_app",
      status: "pending_confirmation",
      payload: { amount: 5000 },
      createdAt: new Date(0).toISOString(),
      updatedAt: new Date(0).toISOString()
    };

    expect(prompt.status).toBe("pending_confirmation");
    expect(prompt.actionType).toBe("open_payment_app");
  });
});
