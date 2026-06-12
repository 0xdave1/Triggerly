import { ForbiddenException } from "@nestjs/common";
import { ActionType } from "@/common/enums";
import { AiIntentService } from "./ai-intent.service";
import { HeuristicIntentParserProvider } from "./heuristic-intent-parser.provider";
import { OpenAiIntentParserProvider } from "./openai-intent-parser.provider";

describe("AiIntentService", () => {
  function service(privacy = { assertCanParseAi: jest.fn().mockResolvedValue(undefined) }) {
    const prisma = {
      intentParseLog: { create: jest.fn().mockResolvedValue({ id: "log1" }) }
    };
    const config = { get: jest.fn((key: string) => (key === "aiProvider" ? "heuristic" : "development")) };
    return {
      prisma,
      privacy,
      service: new AiIntentService(prisma as any, privacy as any, config as any, new HeuristicIntentParserProvider(), new OpenAiIntentParserProvider())
    };
  }

  it("blocks parsing when privacy disables AI parsing", async () => {
    const privacy = { assertCanParseAi: jest.fn().mockRejectedValue(new ForbiddenException()) };
    const setup = service(privacy);

    await expect(setup.service.parseIntent("remind me at 6pm", "u1")).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("parses location arrival reminders", async () => {
    const setup = service();

    await expect(setup.service.parseIntent("Remind me to buy cookies when I get to Shoprite.", "u1")).resolves.toMatchObject({
      intentType: "reminder",
      triggerType: "location_arrival",
      taskTitle: "Buy cookies",
      locationCandidate: { placeName: "Shoprite" },
      sensitive: true,
      executionAllowed: false,
      requiresConfirmation: true
    });
  });

  it("parses location departure reminders", async () => {
    const setup = service();

    await expect(setup.service.parseIntent("When I leave home, remind me to take my charger.", "u1")).resolves.toMatchObject({
      intentType: "reminder",
      triggerType: "location_departure",
      taskTitle: "Take my charger",
      locationCandidate: { placeName: "home" }
    });
  });

  it("parses travel weather plans", async () => {
    const setup = service();

    await expect(setup.service.parseIntent("I’m traveling to Abuja tomorrow. Tell me the weather before I leave.", "u1")).resolves.toMatchObject({
      intentType: "travel_plan",
      triggerType: "weather",
      destination: "Abuja",
      taskTitle: "Check Abuja weather before travel",
      timeCandidate: { phrase: "tomorrow" },
      weatherCandidate: { destination: "Abuja" }
    });
  });

  it("parses exchange rate triggers", async () => {
    const setup = service();

    await expect(setup.service.parseIntent("Tell me when dollar reaches 1600.", "u1")).resolves.toMatchObject({
      intentType: "exchange_rate_trigger",
      triggerType: "exchange_rate",
      baseCurrency: "USD",
      quoteCurrency: "NGN",
      targetRate: 1600,
      condition: "greater_than_or_equal"
    });
  });

  it("parses price logs with NGN default", async () => {
    const setup = service();

    await expect(setup.service.parseIntent(`I bought rice for ${String.fromCharCode(8358)}6,500 at Bodija market.`, "u1")).resolves.toMatchObject({
      intentType: "price_log",
      triggerType: "price",
      item: "rice",
      price: 6500,
      currency: "NGN",
      place: "Bodija market"
    });
  });

  it("parses debt memory with shorthand currency", async () => {
    const setup = service();

    await expect(setup.service.parseIntent("David owes me 8k.", "u1")).resolves.toMatchObject({
      intentType: "debt_memory",
      person: "David",
      amount: 8000,
      currency: "NGN",
      direction: "receivable",
      memoryCandidate: { type: "debt", amount: 8000 }
    });
  });

  it("parses email draft action prompts without execution", async () => {
    const setup = service();

    await expect(setup.service.parseIntent("Draft an email to Mr Ade about the proposal tomorrow morning.", "u1")).resolves.toMatchObject({
      intentType: "action_prompt",
      triggerType: "action_confirmation",
      actionType: "draft_email",
      recipientCandidate: "Mr Ade",
      topic: "the proposal",
      timeCandidate: { phrase: "tomorrow morning" },
      sensitive: true,
      executionAllowed: false,
      actionCandidate: {
        actionType: ActionType.DRAFT_EMAIL,
        payload: { safety: "confirmation_required_no_auto_send" }
      },
      requiresConfirmation: true
    });
  });

  it("parses payment reminders as confirmation-only action prompts", async () => {
    const setup = service();

    await expect(setup.service.parseIntent(`Remind me to send ${String.fromCharCode(8358)}20,000 to David on Friday.`, "u1")).resolves.toMatchObject({
      intentType: "action_prompt",
      triggerType: "action_confirmation",
      actionType: "payment_reminder",
      recipientCandidate: "David",
      timeCandidate: { phrase: "Friday" },
      sensitive: true,
      executionAllowed: false,
      actionCandidate: {
        actionType: ActionType.PAYMENT_REMINDER,
        payload: {
          recipientName: "David",
          amount: 20000,
          currency: "NGN",
          date: "Friday",
          safety: "confirmation_required_no_auto_payment"
        }
      },
      requiresConfirmation: true
    });
  });

  it("parses location checklist prompts without automatic execution", async () => {
    const setup = service();

    await expect(setup.service.parseIntent("When I get to Shoprite, make a shopping checklist.", "u1")).resolves.toMatchObject({
      intentType: "action_prompt",
      triggerType: "location_arrival",
      actionType: "generate_checklist",
      locationCandidate: { placeName: "Shoprite" },
      actionCandidate: {
        actionType: ActionType.GENERATE_CHECKLIST
      },
      requiresConfirmation: true
    });
  });

  it("parses promise memory", async () => {
    const setup = service();

    await expect(setup.service.parseIntent("I promised Tolu I would send the file by Friday.", "u1")).resolves.toMatchObject({
      intentType: "promise_memory",
      taskTitle: "Send the file",
      person: "Tolu",
      deadline: "Friday",
      memoryCandidate: { type: "promise", commitment: "send the file" }
    });
  });

  it("parses habit instructions", async () => {
    const setup = service();

    await expect(setup.service.parseIntent("Every Sunday evening remind me to review my spending.", "u1")).resolves.toMatchObject({
      intentType: "habit",
      triggerType: "habit",
      frequency: "weekly",
      dayOfWeek: "Sunday",
      timeOfDay: "evening",
      taskTitle: "Review my spending"
    });
  });

  it("parses daily briefing requests", async () => {
    const setup = service();

    await expect(setup.service.parseIntent("Give me my morning brief.", "u1")).resolves.toMatchObject({
      intentType: "daily_briefing_request",
      taskTitle: "Generate daily briefing"
    });
  });

  it("asks for clarification on unknown low-confidence input", async () => {
    const setup = service();

    await expect(setup.service.parseIntent("hmm maybe later", "u1")).resolves.toMatchObject({
      intentType: "unknown",
      confidence: expect.any(Number),
      requiresConfirmation: true,
      clarificationQuestion: "Should this be a reminder, memory, or action?"
    });
  });
});
