import { ActionType, LocationTriggerType, ReminderType } from "@/common/enums";
import { VoiceScriptService } from "./voice-script.service";

describe("VoiceScriptService", () => {
  const service = new VoiceScriptService({} as any);

  it("generates location scripts", () => {
    expect(
      service.generate({
        title: "Buy cookies",
        type: ReminderType.LOCATION,
        locationTrigger: { placeName: "Shoprite", triggerType: LocationTriggerType.ARRIVAL }
      })
    ).toBe("You're near Shoprite. You asked me to remind you to buy cookies.");
  });

  it("generates payment confirmation scripts", () => {
    expect(
      service.generate({
        title: "Pay David",
        type: ReminderType.TIME,
        actionPrompt: { actionType: ActionType.OPEN_PAYMENT_APP }
      })
    ).toContain("confirm");
  });

  it("groups errands by place", () => {
    const groups = service.groupErrands([
      { title: "Buy cookies", locationTrigger: { placeName: "Shoprite" } },
      { title: "Buy detergent", locationTrigger: { placeName: "Shoprite" } }
    ]);
    expect(groups[0].script).toBe("You have 2 things to do at Shoprite: buy cookies, buy detergent.");
  });

  it("generates weather and daily briefing scripts", () => {
    expect(
      service.generateForIntent(
        {
          taskTitle: "Check Abuja weather",
          triggerType: "weather",
          locationCandidate: { placeName: "Abuja" }
        },
        { condition: "Rain is likely tomorrow" }
      )
    ).toContain("weather in Abuja");

    expect(
      service.generateForIntent(
        { intentType: "daily_briefing_request", taskTitle: "Review the proposal" },
        { count: 3, topTask: "Review the proposal" }
      )
    ).toBe("Good morning. You have 3 important triggers today. First, Review the proposal.");
  });

  it("changes script tone using the selected style", async () => {
    const styledService = new VoiceScriptService({
      userVoiceSetting: {
        upsert: jest.fn().mockResolvedValue({ selectedVoiceStyle: "energetic" })
      }
    } as any);

    const result = await styledService.generatePreviewScript("u1", {
      intent: { taskTitle: "Call David", triggerType: "time" }
    });

    expect(result.script).toBe("Quick heads-up. You asked me to remind you to call david.");
  });
});
