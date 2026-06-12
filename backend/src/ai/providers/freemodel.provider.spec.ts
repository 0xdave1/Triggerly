import { FreeModelProvider } from "./freemodel.provider";

describe("FreeModelProvider", () => {
  function provider(outputText: string) {
    const instance = new FreeModelProvider({
      get: jest.fn((key: string) => {
        const values: Record<string, unknown> = {
          "ai.model": "gpt-5.5",
          "ai.disableResponseStorage": true,
          "ai.reasoningEffort": "xhigh",
          "ai.apiKey": "test-key",
          "ai.baseUrl": "https://api.freemodel.dev"
        };
        return values[key];
      })
    } as any);
    const create = jest.fn().mockResolvedValue({ output_text: outputText });
    (instance as any).client = { responses: { create } };
    return { instance, create };
  }

  it("parses a validated Responses API plan", async () => {
    const { instance, create } = provider(
      JSON.stringify({
        summary: "One reminder",
        requiresConfirmation: true,
        items: [
          {
            type: "create_trigger",
            title: "Buy cookies",
            description: "At Shoprite",
            riskLevel: "medium",
            payload: { triggerType: "location_arrival", location: "Shoprite" },
            requiresConfirmation: true,
            sensitive: true
          }
        ]
      })
    );

    const plan = await instance.createAgentPlan({ userId: "u1", message: "Buy cookies at Shoprite" });

    expect(plan.items[0]).toMatchObject({ type: "create_trigger", status: "proposed" });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ store: false }));
  });

  it("rejects invalid JSON so AiService can use the heuristic fallback", async () => {
    const { instance } = provider("not-json");

    await expect(instance.createAgentPlan({ userId: "u1", message: "Remind me" })).rejects.toThrow(
      "invalid plan"
    );
  });
});
