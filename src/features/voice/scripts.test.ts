import { describe, expect, it } from "vitest";
import { generateVoiceScript } from "./scripts";

describe("generateVoiceScript", () => {
  it("generates location arrival scripts", () => {
    expect(generateVoiceScript({ taskTitle: "Buy cookies", triggerType: "location_arrival", place: "Shoprite" }, {})).toBe(
      "You're near Shoprite. You asked me to remind you to buy cookies."
    );
  });

  it("generates departure scripts", () => {
    expect(generateVoiceScript({ taskTitle: "Take my charger", triggerType: "location_departure", place: "home" }, {})).toBe(
      "You're leaving home. Remember to take my charger."
    );
  });

  it("generates errand group scripts", () => {
    expect(
      generateVoiceScript({ taskTitle: "errands", triggerType: "errand_group", place: "Shoprite", tasks: ["buy cookies", "buy detergent"] }, { count: 2 })
    ).toBe("You have 2 things to do at Shoprite: buy cookies, buy detergent.");
  });

  it("keeps action prompts confirmation-first", () => {
    expect(generateVoiceScript({ taskTitle: "pay rent", triggerType: "action_prompt", action: "open_payment_app" }, {})).toContain("Please confirm");
  });

  it("generates a weather alert script", () => {
    expect(
      generateVoiceScript(
        { taskTitle: "Check the forecast", triggerType: "weather", place: "Abuja" },
        { condition: "Rain is likely tomorrow" }
      )
    ).toContain("weather in Abuja");
  });

  it("keeps action prompts behind confirmation", () => {
    expect(
      generateVoiceScript(
        { taskTitle: "Draft proposal email", triggerType: "action_prompt", action: "draft_email" },
        {}
      )
    ).toContain("Please confirm");
  });
});
