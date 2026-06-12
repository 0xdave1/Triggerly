import "dotenv/config";
import { ConfigService } from "@nestjs/config";
import { FreeModelProvider } from "../src/ai/providers/freemodel.provider";
import { HeuristicAiProvider } from "../src/ai/providers/heuristic.provider";
import { HeuristicIntentParserProvider } from "../src/ai/heuristic-intent-parser.provider";
import { validateAgentPlan } from "../src/ai/schemas/agent-plan.schema";

async function main() {
  const config = new ConfigService({
    ai: {
      provider: process.env.AI_PROVIDER ?? "heuristic",
      baseUrl: process.env.AI_BASE_URL ?? "https://api.freemodel.dev",
      apiKey: process.env.OPENAI_API_KEY ?? "",
      model: process.env.AI_MODEL ?? "gpt-5.5",
      reasoningEffort: process.env.AI_REASONING_EFFORT ?? "xhigh",
      disableResponseStorage: process.env.AI_DISABLE_RESPONSE_STORAGE !== "false"
    }
  });
  const heuristic = new HeuristicAiProvider(new HeuristicIntentParserProvider());
  const useFreeModel =
    config.get<string>("ai.provider") === "freemodel" &&
    Boolean(config.get<string>("ai.apiKey"));
  const provider = useFreeModel ? new FreeModelProvider(config) : heuristic;
  const plan = validateAgentPlan(
    await provider.createAgentPlan({
      userId: "smoke-test",
      message: "Remind me to buy cookies when I get to Shoprite.",
      context: { timezone: "Africa/Lagos", locale: "en-NG" }
    })
  );
  const locationItem = plan.items.find(
    (item) =>
      item.type === "create_trigger" &&
      String(item.payload.triggerType).toLowerCase() === "location_arrival"
  );

  if (!locationItem || !locationItem.requiresConfirmation) {
    throw new Error("Expected a confirmation-first location trigger plan.");
  }

  console.log(`PASS: ${useFreeModel ? "FreeModel" : "heuristic"} returned a valid location plan.`);
}

main().catch((error) => {
  console.error(`FAIL: ${error instanceof Error ? error.message : "AI smoke test failed."}`);
  process.exitCode = 1;
});
