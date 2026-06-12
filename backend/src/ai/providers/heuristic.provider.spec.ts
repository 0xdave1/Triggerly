import { HeuristicIntentParserProvider } from "../heuristic-intent-parser.provider";
import { HeuristicAiProvider } from "./heuristic.provider";

describe("HeuristicAiProvider", () => {
  const provider = new HeuristicAiProvider(new HeuristicIntentParserProvider());

  it.each([
    ["Remind me to buy cookies when I get to Shoprite.", "create_trigger", "location_arrival"],
    ["When I leave home, remind me to take my charger.", "create_trigger", "location_departure"],
    ["I'm traveling to Abuja tomorrow. Tell me the weather before I leave.", "create_live_context_trigger", "weather"],
    ["Tell me when dollar reaches 1600.", "create_live_context_trigger", "exchange_rate"],
    ["I bought rice for 6500 at Bodija market.", "create_memory", undefined],
    ["David owes me 8k.", "create_memory", undefined],
    ["Draft an email to Mr Ade about the proposal tomorrow morning.", "create_action_prompt", undefined],
    ["Every Sunday evening remind me to review my spending.", "create_trigger", "habit"],
    ["Send 20000 to David tomorrow.", "create_action_prompt", undefined]
  ])("creates a safe plan for %s", async (message, type, triggerType) => {
    const plan = await provider.createAgentPlan({ userId: "u1", message });
    const item = plan.items[0];

    expect(item.type).toBe(type);
    expect(item.requiresConfirmation).toBe(type !== "ask_clarification");
    if (triggerType) expect(item.payload.triggerType).toBe(triggerType);
  });

  it("marks payment requests sensitive and non-executable", async () => {
    const plan = await provider.createAgentPlan({
      userId: "u1",
      message: "Send 20000 to David tomorrow."
    });

    expect(plan.items[0]).toMatchObject({
      type: "create_action_prompt",
      riskLevel: "sensitive",
      sensitive: true,
      payload: expect.objectContaining({
        actionType: "PAYMENT_REMINDER",
        executionAllowed: false
      })
    });
  });
});
