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
    ).toContain("Please confirm");
  });

  it("groups errands by place", () => {
    const groups = service.groupErrands([
      { title: "Buy cookies", locationTrigger: { placeName: "Shoprite" } },
      { title: "Buy detergent", locationTrigger: { placeName: "Shoprite" } }
    ]);
    expect(groups[0].script).toBe("You have 2 things to do at Shoprite: buy cookies, buy detergent.");
  });
});
