import { ReminderType } from "@/common/enums";
import { AiTriggerParserService } from "./ai-trigger-parser.service";
import { AiService } from "./ai.service";

describe("AiService", () => {
  function setup(provider = "heuristic") {
    const heuristicProvider = {
      createAgentPlan: jest.fn().mockResolvedValue({
        summary: "Plan ready",
        requiresConfirmation: true,
        items: [
          {
            type: "create_trigger",
            title: "Call David",
            description: "Tomorrow",
            riskLevel: "low",
            payload: { triggerType: "time", taskTitle: "Call David", time: "tomorrow" },
            requiresConfirmation: true,
            sensitive: false
          }
        ]
      })
    };
    const freeModelProvider = { createAgentPlan: jest.fn() };
    const service = new AiService(
      new AiTriggerParserService(),
      {} as any,
      { get: jest.fn((key: string) => (key === "ai.provider" ? provider : undefined)) } as any,
      { assertCanParseAi: jest.fn().mockResolvedValue(undefined) } as any,
      heuristicProvider as any,
      freeModelProvider as any
    );
    return { service, heuristicProvider, freeModelProvider };
  }

  const service = setup().service;

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

  it("uses FreeModel plans when configured", async () => {
    const { service: ai, freeModelProvider, heuristicProvider } = setup("freemodel");
    freeModelProvider.createAgentPlan.mockResolvedValue({
      summary: "Location reminder ready",
      requiresConfirmation: true,
      items: [
        {
          type: "create_trigger",
          title: "Buy cookies",
          description: "When you arrive at Shoprite",
          riskLevel: "medium",
          payload: { triggerType: "location_arrival", location: "Shoprite" },
          requiresConfirmation: true,
          sensitive: true
        }
      ]
    });

    const plan = await ai.createAgentPlan("u1", "Buy cookies at Shoprite");

    expect(plan.items[0]).toMatchObject({ type: "create_trigger", title: "Buy cookies" });
    expect(heuristicProvider.createAgentPlan).not.toHaveBeenCalled();
  });

  it("falls back to heuristics when FreeModel fails", async () => {
    const { service: ai, freeModelProvider, heuristicProvider } = setup("freemodel");
    freeModelProvider.createAgentPlan.mockRejectedValue(new Error("invalid provider response"));

    const plan = await ai.createAgentPlan("u1", "Remind me tomorrow");

    expect(plan.summary).toBe("Plan ready");
    expect(heuristicProvider.createAgentPlan).toHaveBeenCalled();
  });
});
