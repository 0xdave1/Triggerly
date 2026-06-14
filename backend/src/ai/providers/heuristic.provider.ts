import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import type { ParsedIntent } from "../intent-types";
import { HeuristicIntentParserProvider } from "../heuristic-intent-parser.provider";
import { validateAgentPlan } from "../schemas/agent-plan.schema";
import type {
  AgentPlan,
  AgentPlanItem,
  CreateAgentPlanInput,
  GenerateNormalAnswerInput
} from "../types/agent-plan.types";
import type { AiProvider } from "./ai-provider.interface";

@Injectable()
export class HeuristicAiProvider implements AiProvider {
  constructor(private readonly parser: HeuristicIntentParserProvider) {}

  async generateNormalAnswer(input: GenerateNormalAnswerInput): Promise<string> {
    const message = input.message.trim().toLowerCase();
    if (/\bcompound interest\b/.test(message)) {
      return "Compound interest is interest calculated on both the original amount and the interest already added. Over time, this makes savings grow faster and debts become more expensive than with simple interest.";
    }
    if (/\bwhat is ai\b|\bartificial intelligence\b/.test(message)) {
      return "Artificial intelligence is software designed to perform tasks that usually require human-like judgment, such as understanding language, recognizing patterns, making predictions, or generating content.";
    }
    if (/\bweather\b/.test(message)) {
      return "Live weather data is not configured yet, so I cannot give you a reliable current forecast. Once a weather provider is connected, I can answer this directly without creating a trigger.";
    }
    if (/\bpack\b.*\btravel|\btravel.*\bpack|\bpacking\b/.test(message)) {
      return "For Abuja, pack light clothing, a layer for cooler evenings, comfortable shoes, sun protection, toiletries, chargers, identification, medication, and anything specific to your plans. I can turn that into a checklist if you ask me to create one.";
    }
    if (/\binterview\b/.test(message)) {
      return "Prepare by researching the company, matching your experience to the role, practicing concise examples, planning thoughtful questions, and checking your route or call setup ahead of time.";
    }
    if (/\bproductiv/.test(message)) {
      return "Choose one important outcome, break it into a small next action, protect a focused time block, and review what actually moved forward at the end of the day.";
    }
    return "I can help explain that, but the full AI answer service is currently unavailable. Please try again when the backend AI provider is connected.";
  }

  async generateAgentPlan(input: CreateAgentPlanInput): Promise<AgentPlan> {
    const intents = await Promise.all(
      this.splitMessage(input.message).map((message) => this.parser.parse(message, { userId: input.userId }))
    );
    const items = intents.flatMap((intent) => this.toPlanItems(intent));
    const actionable = items.filter((item) => this.isActionable(item)).length;
    return validateAgentPlan({
      id: randomUUID(),
      summary:
        actionable > 0
          ? `I found ${actionable} ${actionable === 1 ? "thing" : "things"} to set up. Review the plan before I continue.`
          : items[0]?.description ?? "I need one more detail before setting this up.",
      requiresConfirmation: actionable > 0,
      items
    });
  }

  async createAgentPlan(input: CreateAgentPlanInput): Promise<AgentPlan> {
    return this.generateAgentPlan(input);
  }

  private toPlanItems(intent: ParsedIntent): AgentPlanItem[] {
    if (intent.intentType === "unknown") {
      return [
        this.item(
          "ask_clarification",
          "A little more detail",
          intent.clarificationQuestion ?? "Should this be a reminder, memory, or action?",
          {},
          false
        )
      ];
    }
    if (intent.intentType === "daily_briefing_request") {
      return [
        this.item(
          "answer_only",
          "Prepare today's briefing",
          "Summarize today's active triggers, habits, and pending actions.",
          { intent },
          false
        )
      ];
    }
    if (intent.intentType === "travel_plan" && !intent.weatherCandidate) {
      return [
        this.item(
          "ask_clarification",
          `Trip to ${intent.destination ?? "your destination"}`,
          intent.clarificationQuestion ?? "Should I check the weather and prepare a travel checklist?",
          { intent },
          false
        )
      ];
    }
    if (["debt_memory", "promise_memory", "memory", "price_log"].includes(intent.intentType)) {
      return [
        this.item(
          "create_memory",
          intent.taskTitle ?? "Save memory",
          intent.intentType === "price_log"
            ? "Save this approved price and its place."
            : "Save this as user-approved memory.",
          {
            intent,
            operation: intent.intentType === "price_log" ? "price_log" : "memory",
            memoryType: intent.memoryCandidate?.type,
            ...intent.memoryCandidate
          },
          true
        )
      ];
    }
    if (intent.intentType === "action_prompt" || intent.actionCandidate) {
      const actionType = String(intent.actionCandidate?.actionType ?? intent.actionType ?? "GENERATE_CHECKLIST").toUpperCase();
      return [
        this.item(
          "create_action_prompt",
          intent.taskTitle ?? "Prepare action",
          this.actionDescription(actionType),
          {
            intent,
            actionType,
            ...(intent.actionCandidate?.payload ?? {}),
            executionAllowed: false
          },
          true,
          this.isSensitiveAction(actionType) ? "sensitive" : "medium",
          this.isSensitiveAction(actionType)
        )
      ];
    }
    if (
      ["weather_trigger", "exchange_rate_trigger", "travel_plan"].includes(intent.intentType) ||
      ["weather", "exchange_rate", "travel"].includes(String(intent.triggerType))
    ) {
      return [
        this.item(
          "create_live_context_trigger",
          intent.taskTitle ?? "Create live alert",
          this.triggerDescription(intent),
          {
            intent,
            triggerType: intent.triggerType,
            location: intent.destination ?? intent.locationCandidate?.placeName,
            time: intent.timeCandidate,
            baseCurrency: intent.baseCurrency,
            quoteCurrency: intent.quoteCurrency,
            targetRate: intent.targetRate,
            condition: intent.condition
          },
          true
        )
      ];
    }
    if (intent.intentType === "habit" || intent.intentType === "reminder") {
      const isLocation = String(intent.triggerType).startsWith("location_");
      return [
        this.item(
          "create_trigger",
          intent.taskTitle ?? "Create reminder",
          this.triggerDescription(intent),
          {
            intent,
            triggerType: intent.triggerType,
            taskTitle: intent.taskTitle,
            location: intent.locationCandidate,
            time: intent.timeCandidate,
            habit: intent.habitCandidate
          },
          true,
          isLocation ? "medium" : "low",
          isLocation
        )
      ];
    }
    return [
      this.item(
        "ask_clarification",
        "Confirm your intent",
        "Should this be a reminder, memory, or action?",
        { intent },
        false
      )
    ];
  }

  private item(
    type: AgentPlanItem["type"],
    title: string,
    description: string,
    payload: Record<string, unknown>,
    requiresConfirmation: boolean,
    riskLevel: AgentPlanItem["riskLevel"] = "low",
    sensitive = false
  ): AgentPlanItem {
    return {
      id: randomUUID(),
      type,
      title,
      description,
      riskLevel,
      status: "proposed",
      payload,
      requiresConfirmation,
      sensitive
    };
  }

  private isActionable(item: AgentPlanItem) {
    return !["ask_clarification", "answer_only"].includes(item.type);
  }

  private actionDescription(actionType: string) {
    if (actionType.includes("PAYMENT")) {
      return "Prepare a payment reminder only. Triggerly will never move money automatically.";
    }
    if (actionType === "DRAFT_EMAIL") return "Prepare an email draft. Triggerly will not send it.";
    if (actionType === "DRAFT_MESSAGE") return "Prepare a message draft. Triggerly will not send it.";
    return "Prepare this action for your review. External execution remains locked.";
  }

  private isSensitiveAction(actionType: string) {
    return [
      "DRAFT_EMAIL",
      "DRAFT_MESSAGE",
      "OPEN_PAYMENT_APP",
      "PAYMENT_REMINDER",
      "CALL_CONTACT",
      "CREATE_CALENDAR_EVENT"
    ].includes(actionType);
  }

  private triggerDescription(intent: ParsedIntent) {
    if (intent.triggerType === "location_arrival") {
      return `When you arrive at ${String(intent.locationCandidate?.placeName ?? intent.place ?? "the selected place")}.`;
    }
    if (intent.triggerType === "location_departure") {
      return `When you leave ${String(intent.locationCandidate?.placeName ?? intent.place ?? "the selected place")}.`;
    }
    if (intent.triggerType === "weather") {
      return `Check ${intent.destination ?? String(intent.locationCandidate?.placeName ?? "destination")} weather before the plan.`;
    }
    if (intent.triggerType === "exchange_rate") {
      return `Alert when ${intent.baseCurrency ?? "USD"}/${intent.quoteCurrency ?? "NGN"} reaches ${intent.targetRate ?? "the target"}.`;
    }
    if (intent.triggerType === "habit") {
      return `Repeat ${intent.frequency ?? String(intent.habitCandidate?.frequency ?? "regularly")}.`;
    }
    return `Remind you ${String(intent.timeCandidate?.phrase ?? "at the selected time")}.`;
  }

  private splitMessage(input: string) {
    const sentences = input
      .trim()
      .split(/(?<=[.!?])\s+/)
      .map((part) => part.trim())
      .filter(Boolean);
    const merged: string[] = [];
    for (const sentence of sentences) {
      const previous = merged[merged.length - 1];
      if (previous && /\b(traveling|travelling|going)\s+to\b/i.test(previous) && /\bweather\b/i.test(sentence)) {
        merged[merged.length - 1] = `${previous} ${sentence}`;
      } else {
        merged.push(sentence);
      }
    }
    return merged.flatMap((part) =>
      part
        .split(/\s+and\s+(?=(?:remind|tell|draft|save|create|check|when)\b)/i)
        .map((clause) => clause.trim())
        .filter(Boolean)
    );
  }
}
