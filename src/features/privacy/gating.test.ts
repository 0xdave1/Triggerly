import { describe, expect, it } from "vitest";
import { DEFAULT_PRIVACY_SETTINGS, isFeatureEnabled } from "./types";

describe("privacy feature gating", () => {
  it("blocks weather triggers when privacy setting is off", () => {
    expect(isFeatureEnabled(DEFAULT_PRIVACY_SETTINGS, "weatherTriggersEnabled")).toBe(false);
  });

  it("keeps payment actions disabled by default", () => {
    expect(isFeatureEnabled(DEFAULT_PRIVACY_SETTINGS, "paymentActionsEnabled")).toBe(false);
  });
});
