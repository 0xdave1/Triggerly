import { describe, expect, it } from "vitest";
import type { LiveContextPlaceholder } from "./types";

describe("live-context feature types", () => {
  it("models provider placeholders as confirmation-required", () => {
    const result: LiveContextPlaceholder = {
      capability: "weather",
      status: "provider_not_configured",
      requiresUserConfirmation: true,
      message: "Provider unavailable",
      input: { location: "Lagos" }
    };

    expect(result.requiresUserConfirmation).toBe(true);
    expect(result.status).toBe("provider_not_configured");
  });
});
