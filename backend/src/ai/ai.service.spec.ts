import { ReminderType } from "@/common/enums";
import { AiTriggerParserService } from "./ai-trigger-parser.service";
import { AiService } from "./ai.service";

describe("AiService", () => {
  const service = new AiService(new AiTriggerParserService(), {} as any);

  it("detects time reminders", () => {
    expect(service.parseReminderInput("remind me to call David at 6pm")).toMatchObject({
      triggerTypeGuess: ReminderType.TIME,
      requiresConfirmation: true
    });
  });

  it("detects location reminders", () => {
    expect(service.parseReminderInput("buy cookies when I get to Shoprite")).toMatchObject({
      triggerTypeGuess: ReminderType.LOCATION,
      locationCandidate: "Shoprite"
    });
  });

  it("detects habit reminders", () => {
    expect(service.parseReminderInput("call mum every week")).toMatchObject({
      triggerTypeGuess: ReminderType.HABIT,
      habitCandidate: "every week"
    });
  });
});
