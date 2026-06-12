import { randomUUID } from "node:crypto";
import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import {
  ActionType,
  AgentRunStatus,
  ChatMessageRole,
  DeliveryMode,
  HabitFrequencyType,
  LocationTriggerType,
  MemorySource,
  MemoryType,
  PriceLogSource,
  ReminderType,
  ToolExecutionStatus,
  TriggerType,
  UserApprovalDecision
} from "@/common/enums";
import { toNullablePrismaJson, toPrismaJson } from "@/common/utils/prisma-json";
import { ActionPromptsService } from "@/action-prompts/action-prompts.service";
import { AiIntentService } from "@/ai/ai-intent.service";
import type { ParsedIntent } from "@/ai/intent-types";
import { LiveContextService } from "@/live-context/live-context.service";
import { MemoryService } from "@/memory/memory.service";
import { PrismaService } from "@/prisma/prisma.service";
import { PrivacyService } from "@/privacy/privacy.service";
import { RemindersService } from "@/reminders/reminders.service";
import { TriggersService } from "@/triggers/triggers.service";
import { VoiceScriptService } from "@/voice/voice-script.service";
import type { AgentExecutionResult, AgentPlan, AgentPlanItem } from "./agent.types";

@Injectable()
export class AgentOrchestratorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiIntentService,
    private readonly privacy: PrivacyService,
    private readonly reminders: RemindersService,
    private readonly triggers: TriggersService,
    private readonly memory: MemoryService,
    private readonly liveContext: LiveContextService,
    private readonly actions: ActionPromptsService,
    private readonly voice: VoiceScriptService
  ) {}

  async createRun(userId: string, conversationId: string, userInput: string) {
    const settings = await this.privacy.getSettings(userId);
    const plan = settings.aiParsingEnabled
      ? await this.buildPlan(userId, userInput, settings)
      : this.featureDisabledPlan("AI parsing is disabled. Enable it in Control to let Triggerly build a plan.", "aiParsingEnabled");

    const run = await this.prisma.agentRun.create({
      data: {
        userId,
        conversationId,
        status: AgentRunStatus.WAITING_FOR_CONFIRMATION,
        userInput,
        plan: toPrismaJson(plan)
      }
    });
    return { ...run, plan };
  }

  async getRun(userId: string, id: string) {
    const run = await this.prisma.agentRun.findFirst({
      where: { id, userId },
      include: { approvals: true, toolExecutions: true }
    });
    if (!run) throw new NotFoundException("Agent run not found.");
    return run;
  }

  async confirmRun(userId: string, id: string, itemIds?: string[]) {
    const run = await this.findOwnedRun(userId, id);
    const plan = this.readPlan(run.plan);
    const selected = new Set(itemIds ?? plan.items.filter((item) => item.type !== "ask_clarification").map((item) => item.id));

    for (const item of plan.items) {
      if (!selected.has(item.id) || item.status !== "proposed") continue;
      item.status = "confirmed";
      await this.prisma.userApproval.create({
        data: {
          userId,
          agentRunId: id,
          itemId: item.id,
          decision: UserApprovalDecision.APPROVED
        }
      });
    }

    await this.prisma.agentRun.update({
      where: { id },
      data: { status: AgentRunStatus.EXECUTING, plan: toPrismaJson(plan) }
    });

    const created: AgentExecutionResult["created"] = [];
    let failedCount = 0;
    for (const item of plan.items.filter((candidate) => candidate.status === "confirmed")) {
      try {
        const output = await this.executeItem(userId, id, item);
        item.status = "completed";
        item.result = output;
        created.push({ itemId: item.id, type: item.type, recordId: typeof output.id === "string" ? output.id : undefined });
      } catch (error) {
        failedCount += 1;
        item.status = "failed";
        item.error = error instanceof Error ? error.message : "This plan item could not be completed.";
      }
    }

    const completedCount = plan.items.filter((item) => item.status === "completed").length;
    const message = this.completionMessage(plan, completedCount, failedCount);
    const result: AgentExecutionResult = { message, completedCount, failedCount, created };
    const status = failedCount > 0 && completedCount === 0 ? AgentRunStatus.FAILED : AgentRunStatus.COMPLETED;

    await this.prisma.$transaction([
      this.prisma.agentRun.update({
        where: { id },
        data: {
          status,
          plan: toPrismaJson(plan),
          result: toPrismaJson(result),
          errorMessage: failedCount ? "One or more plan items need attention." : null,
          completedAt: new Date()
        }
      }),
      this.prisma.chatMessage.create({
        data: {
          userId,
          conversationId: run.conversationId,
          role: ChatMessageRole.ASSISTANT,
          content: message,
          metadata: toPrismaJson({ agentRunId: id, result })
        }
      })
    ]);

    return { id, status, plan, result };
  }

  async rejectRun(userId: string, id: string) {
    const run = await this.findOwnedRun(userId, id);
    const plan = this.readPlan(run.plan);
    const approvals = plan.items
      .filter((item) => item.status === "proposed")
      .map((item) => {
        item.status = "rejected" as const;
        return this.prisma.userApproval.create({
          data: { userId, agentRunId: id, itemId: item.id, decision: UserApprovalDecision.REJECTED }
        });
      });
    await this.prisma.$transaction([
      ...approvals,
      this.prisma.agentRun.update({
        where: { id },
        data: { status: AgentRunStatus.CANCELLED, plan: toPrismaJson(plan), completedAt: new Date() }
      })
    ]);
    return { id, status: AgentRunStatus.CANCELLED, plan };
  }

  async rejectItem(userId: string, id: string, itemId: string) {
    const run = await this.findOwnedRun(userId, id);
    const plan = this.readPlan(run.plan);
    const item = this.findItem(plan, itemId);
    item.status = "rejected";
    await this.prisma.$transaction([
      this.prisma.userApproval.create({
        data: { userId, agentRunId: id, itemId, decision: UserApprovalDecision.REJECTED }
      }),
      this.prisma.agentRun.update({ where: { id }, data: { plan: toPrismaJson(plan) } })
    ]);
    return { id, plan };
  }

  async editItem(userId: string, id: string, itemId: string, payload: Record<string, unknown>) {
    const run = await this.findOwnedRun(userId, id);
    const plan = this.readPlan(run.plan);
    const item = this.findItem(plan, itemId);
    item.payload = { ...item.payload, ...payload };
    await this.prisma.$transaction([
      this.prisma.userApproval.create({
        data: {
          userId,
          agentRunId: id,
          itemId,
          decision: UserApprovalDecision.EDITED,
          editedPayload: toPrismaJson(payload)
        }
      }),
      this.prisma.agentRun.update({ where: { id }, data: { plan: toPrismaJson(plan) } })
    ]);
    return { id, plan };
  }

  private async buildPlan(userId: string, input: string, settings: Record<string, boolean | string | number | Date | null>) {
    const clauses = this.splitMessage(input);
    const intents = await Promise.all(clauses.map((clause) => this.ai.parseUserMessage(clause, { userId })));
    const items = intents.flatMap((intent) => this.planItemsFromIntent(intent, settings));
    const actionable = items.filter((item) => item.type !== "ask_clarification" && item.type !== "answer_only").length;
    return {
      id: randomUUID(),
      summary:
        actionable > 0
          ? `I found ${actionable} ${actionable === 1 ? "thing" : "things"} to set up. Review the plan before I continue.`
          : items[0]?.description ?? "I need a little more detail.",
      requiresConfirmation: actionable > 0,
      items
    } satisfies AgentPlan;
  }

  private planItemsFromIntent(intent: ParsedIntent, settings: Record<string, boolean | string | number | Date | null>): AgentPlanItem[] {
    if (intent.intentType === "unknown") {
      return [this.item("ask_clarification", "A little more detail", intent.clarificationQuestion ?? "Should this be a reminder, memory, or action?", "low", {}, false)];
    }
    if (intent.intentType === "daily_briefing_request") {
      return [this.item("answer_only", "Prepare today's briefing", "Summarize today's active triggers, habits, and pending actions.", "low", { intent }, false)];
    }
    if (intent.intentType === "travel_plan" && !intent.weatherCandidate) {
      return [
        this.item(
          "ask_clarification",
          `Trip to ${intent.destination ?? "your destination"}`,
          intent.clarificationQuestion ?? "Do you want me to check the weather before you leave and prepare a travel checklist?",
          "low",
          { intent },
          false
        )
      ];
    }
    if (["debt_memory", "promise_memory", "memory", "price_log"].includes(intent.intentType)) {
      const item = this.item(
        "create_memory",
        intent.taskTitle ?? "Save memory",
        intent.intentType === "price_log" ? "Save this approved price and its place." : "Save this as user-approved memory.",
        "low",
        { intent, operation: intent.intentType === "price_log" ? "price_log" : "memory" },
        true
      );
      return [this.gate(item, settings.memoryEnabled === false ? "memoryEnabled" : intent.intentType === "price_log" && settings.priceMemoryEnabled === false ? "priceMemoryEnabled" : undefined)];
    }
    if (intent.intentType === "action_prompt" || intent.actionCandidate) {
      const actionType = String(intent.actionCandidate?.actionType ?? intent.actionType ?? "GENERATE_CHECKLIST").toUpperCase();
      const gate = this.actionGate(actionType, settings);
      return [
        this.gate(
          this.item(
            "create_action_prompt",
            intent.taskTitle ?? "Prepare action",
            this.actionDescription(actionType),
            this.isSensitiveAction(actionType) ? "sensitive" : "medium",
            { intent, actionType, ...(intent.actionCandidate?.payload ?? {}), executionAllowed: false },
            true,
            this.isSensitiveAction(actionType)
          ),
          gate
        )
      ];
    }
    if (["weather_trigger", "exchange_rate_trigger", "travel_plan"].includes(intent.intentType) || ["weather", "exchange_rate", "travel"].includes(String(intent.triggerType))) {
      const gate =
        intent.triggerType === "weather"
          ? settings.weatherTriggersEnabled === false
            ? "weatherTriggersEnabled"
            : undefined
          : intent.triggerType === "exchange_rate" && settings.exchangeRateTriggersEnabled === false
            ? "exchangeRateTriggersEnabled"
            : intent.triggerType === "travel" && settings.travelContextEnabled === false
              ? "travelContextEnabled"
              : undefined;
      return [
        this.gate(
          this.item(
            "create_live_context_trigger",
            intent.taskTitle ?? "Create live alert",
            this.triggerDescription(intent),
            "low",
            { intent, triggerType: intent.triggerType },
            true
          ),
          gate
        )
      ];
    }
    if (intent.intentType === "habit" || intent.intentType === "reminder") {
      const isLocation = String(intent.triggerType).startsWith("location_");
      return [
        this.gate(
          this.item(
            "create_trigger",
            intent.taskTitle ?? "Create reminder",
            this.triggerDescription(intent),
            isLocation ? "medium" : "low",
            { intent, triggerType: intent.triggerType },
            true,
            isLocation
          ),
          isLocation && settings.locationTriggersEnabled === false ? "locationTriggersEnabled" : undefined
        )
      ];
    }
    return [this.item("ask_clarification", "Confirm your intent", "Should this be a reminder, memory, or action?", "low", { intent }, false)];
  }

  private item(
    type: AgentPlanItem["type"],
    title: string,
    description: string,
    riskLevel: AgentPlanItem["riskLevel"],
    payload: Record<string, unknown>,
    requiresConfirmation: boolean,
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

  private gate(item: AgentPlanItem, blockedBy?: string) {
    if (!blockedBy) return item;
    item.payload = { ...item.payload, blockedBy };
    item.description = `${item.description} This feature is disabled in Control. Enable it before confirming.`;
    return item;
  }

  private async executeItem(userId: string, agentRunId: string, item: AgentPlanItem) {
    if (item.payload.blockedBy) throw new ForbiddenException(`${String(item.payload.blockedBy)} is disabled in Control.`);
    const toolName = this.toolName(item);
    const execution = await this.prisma.toolExecution.create({
      data: {
        userId,
        agentRunId,
        toolName,
        input: toPrismaJson(item.payload),
        status: ToolExecutionStatus.PENDING
      }
    });
    try {
      const output = await this.callTool(userId, item);
      await this.prisma.toolExecution.update({
        where: { id: execution.id },
        data: { status: ToolExecutionStatus.SUCCESS, output: toPrismaJson(output) }
      });
      return output;
    } catch (error) {
      await this.prisma.toolExecution.update({
        where: { id: execution.id },
        data: {
          status: ToolExecutionStatus.FAILED,
          output: toPrismaJson({ error: error instanceof Error ? error.message : "Tool failed." })
        }
      });
      throw error;
    }
  }

  private async callTool(userId: string, item: AgentPlanItem): Promise<Record<string, unknown>> {
    const intent = (item.payload.intent ?? {}) as ParsedIntent;
    if (item.type === "create_trigger") return this.createTrigger(userId, intent);
    if (item.type === "create_live_context_trigger") return this.createLiveContextTrigger(userId, intent);
    if (item.type === "create_memory") return this.createMemory(userId, intent, String(item.payload.operation ?? "memory"));
    if (item.type === "create_action_prompt") {
      return this.actions.create(userId, {
        actionType: String(item.payload.actionType ?? intent.actionCandidate?.actionType) as ActionType,
        title: item.title,
        payload: {
          ...((intent.actionCandidate?.payload ?? {}) as Record<string, unknown>),
          executionAllowed: false,
          userApprovedPlanItem: true
        }
      }) as unknown as Promise<Record<string, unknown>>;
    }
    if (item.type === "answer_only") {
      return { answer: this.voice.generateForIntent(intent, { count: 1, topTask: intent.taskTitle }) };
    }
    return { acknowledged: true };
  }

  private async createTrigger(userId: string, intent: ParsedIntent): Promise<Record<string, unknown>> {
    if (intent.triggerType === "time") {
      return this.reminders.create(userId, {
        title: intent.taskTitle ?? "Reminder",
        type: ReminderType.TIME,
        deliveryMode: intent.suggestedDeliveryMode ?? DeliveryMode.PUSH,
        voiceScript: intent.suggestedVoiceScript,
        voiceEnabled: intent.suggestedDeliveryMode === DeliveryMode.VOICE || intent.suggestedDeliveryMode === DeliveryMode.VOICE_AND_PUSH,
        timeTrigger: {
          triggerDateTime: this.resolveTimeCandidate(intent.timeCandidate),
          timezone: "Africa/Lagos"
        }
      }) as unknown as Promise<Record<string, unknown>>;
    }
    if (intent.triggerType === "habit") {
      const frequency = String(intent.habitCandidate?.frequency ?? intent.frequency ?? "daily").toUpperCase();
      return this.reminders.create(userId, {
        title: intent.taskTitle ?? "Habit",
        type: ReminderType.HABIT,
        deliveryMode: intent.suggestedDeliveryMode ?? DeliveryMode.PUSH,
        voiceScript: intent.suggestedVoiceScript,
        voiceEnabled: false,
        habit: {
          frequencyType: Object.values(HabitFrequencyType).includes(frequency as HabitFrequencyType)
            ? (frequency as HabitFrequencyType)
            : HabitFrequencyType.DAILY,
          frequencyCount: 1
        }
      }) as unknown as Promise<Record<string, unknown>>;
    }
    const type = intent.triggerType === "location_departure" ? TriggerType.LOCATION_DEPARTURE : TriggerType.LOCATION_ARRIVAL;
    return this.triggers.confirm(userId, {
      confirmed: true,
      type,
      title: intent.taskTitle,
      configuration: {
        ...(intent.locationCandidate ?? {}),
        radiusMeters: 250,
        needsCoordinateConfirmation: true,
        voiceScript: intent.suggestedVoiceScript
      }
    }) as unknown as Promise<Record<string, unknown>>;
  }

  private async createLiveContextTrigger(userId: string, intent: ParsedIntent): Promise<Record<string, unknown>> {
    if (intent.triggerType === "exchange_rate") {
      return this.liveContext.createExchangeRateTrigger(userId, {
        title: intent.taskTitle ?? "Exchange rate alert",
        base: intent.baseCurrency ?? String(intent.exchangeRateCandidate?.baseCurrency ?? "USD"),
        quote: intent.quoteCurrency ?? String(intent.exchangeRateCandidate?.quoteCurrency ?? "NGN"),
        operator: intent.condition === "less_than_or_equal" ? "<=" : ">=",
        targetRate: intent.targetRate ?? Number(intent.exchangeRateCandidate?.targetRate ?? 0)
      }) as unknown as Promise<Record<string, unknown>>;
    }
    return this.liveContext.createWeatherTrigger(userId, {
      title: intent.taskTitle ?? `Weather alert for ${intent.destination ?? "your trip"}`,
      location: intent.destination ?? String(intent.locationCandidate?.placeName ?? "current location"),
      date: String(intent.timeCandidate?.phrase ?? "tomorrow"),
      event: "rain_probability_above",
      threshold: 50
    }) as unknown as Promise<Record<string, unknown>>;
  }

  private async createMemory(userId: string, intent: ParsedIntent, operation: string): Promise<Record<string, unknown>> {
    if (operation === "price_log" && intent.item && typeof intent.price === "number") {
      await this.liveContext.createPriceLog(userId, {
        itemName: intent.item,
        price: intent.price,
        currency: intent.currency ?? "NGN",
        placeName: intent.place,
        source: PriceLogSource.AI_PARSE
      });
    }
    const candidate = (intent.memoryCandidate ?? intent.priceCandidate ?? {}) as Record<string, unknown>;
    const type = this.memoryType(intent);
    return this.memory.create(userId, {
      type,
      title: this.memoryTitle(intent, type),
      body: intent.taskTitle ?? "Saved from a confirmed Triggerly conversation.",
      entities: candidate,
      source: MemorySource.AI_EXTRACTED,
      confidence: intent.confidence
    }) as unknown as Promise<Record<string, unknown>>;
  }

  private memoryType(intent: ParsedIntent) {
    if (intent.intentType === "debt_memory") return MemoryType.DEBT;
    if (intent.intentType === "promise_memory") return MemoryType.PROMISE;
    if (intent.intentType === "price_log") return MemoryType.PRICE;
    return MemoryType.GENERAL;
  }

  private memoryTitle(intent: ParsedIntent, type: MemoryType) {
    if (type === MemoryType.DEBT) return `${intent.person ?? "Someone"} owes me NGN ${Number(intent.amount ?? 0).toLocaleString("en-NG")}`;
    if (type === MemoryType.PRICE) return `${intent.item ?? "Item"} price at ${intent.place ?? "saved place"}`;
    return intent.taskTitle ?? "User-approved memory";
  }

  private resolveTimeCandidate(candidate?: Record<string, unknown>) {
    const phrase = String(candidate?.phrase ?? "in one hour").toLowerCase();
    const now = new Date();
    const lagosNow = new Date(now.getTime() + 60 * 60 * 1000);
    let date = new Date(lagosNow);
    if (phrase.includes("tomorrow")) date.setUTCDate(date.getUTCDate() + 1);
    const weekday = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].findIndex((day) => phrase.includes(day));
    if (weekday >= 0) {
      let delta = (weekday - date.getUTCDay() + 7) % 7;
      if (delta === 0) delta = 7;
      date.setUTCDate(date.getUTCDate() + delta);
    }
    let hour = phrase.includes("morning") ? 9 : phrase.includes("afternoon") ? 14 : phrase.includes("evening") ? 18 : phrase.includes("tonight") ? 20 : 9;
    const time = phrase.match(/(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
    let minute = 0;
    if (time) {
      hour = Number(time[1]);
      minute = Number(time[2] ?? 0);
      if (time[3] === "pm" && hour < 12) hour += 12;
      if (time[3] === "am" && hour === 12) hour = 0;
    }
    date.setUTCHours(hour, minute, 0, 0);
    if (!candidate && date.getTime() <= lagosNow.getTime()) date = new Date(lagosNow.getTime() + 60 * 60 * 1000);
    return new Date(date.getTime() - 60 * 60 * 1000).toISOString();
  }

  private triggerDescription(intent: ParsedIntent) {
    if (intent.triggerType === "location_arrival") return `When you arrive at ${String(intent.locationCandidate?.placeName ?? intent.place ?? "the selected place")}.`;
    if (intent.triggerType === "location_departure") return `When you leave ${String(intent.locationCandidate?.placeName ?? intent.place ?? "the selected place")}.`;
    if (intent.triggerType === "weather") return `Check ${intent.destination ?? String(intent.locationCandidate?.placeName ?? "destination")} weather before the plan.`;
    if (intent.triggerType === "exchange_rate") return `Alert when ${intent.baseCurrency ?? "USD"}/${intent.quoteCurrency ?? "NGN"} reaches ${intent.targetRate ?? "the target"}.`;
    if (intent.triggerType === "habit") return `Repeat ${intent.frequency ?? String(intent.habitCandidate?.frequency ?? "regularly")}.`;
    return `Remind you ${String(intent.timeCandidate?.phrase ?? "at the selected time")}.`;
  }

  private actionDescription(actionType: string) {
    if (actionType.includes("PAYMENT")) return "Prepare a payment reminder only. Triggerly will never move money automatically.";
    if (actionType === "DRAFT_EMAIL") return "Prepare an email draft. Triggerly will not send it.";
    if (actionType === "DRAFT_MESSAGE") return "Prepare a message draft. Triggerly will not send it.";
    return "Prepare this action for your review. External execution remains locked.";
  }

  private actionGate(actionType: string, settings: Record<string, boolean | string | number | Date | null>) {
    if (actionType === "DRAFT_EMAIL" && settings.emailDraftingEnabled === false) return "emailDraftingEnabled";
    if (actionType === "DRAFT_MESSAGE" && settings.messageDraftingEnabled === false) return "messageDraftingEnabled";
    if (actionType === "PAYMENT_REMINDER" && settings.paymentRemindersEnabled === false) return "paymentRemindersEnabled";
    if (actionType === "OPEN_PAYMENT_APP" && settings.paymentActionsEnabled === false) return "paymentActionsEnabled";
    if (actionType === "CALL_CONTACT" && settings.contactAccessEnabled === false) return "contactAccessEnabled";
    if (actionType === "CREATE_CALENDAR_EVENT" && settings.calendarIntegrationEnabled === false) return "calendarIntegrationEnabled";
    return undefined;
  }

  private isSensitiveAction(actionType: string) {
    return ["DRAFT_EMAIL", "DRAFT_MESSAGE", "OPEN_PAYMENT_APP", "PAYMENT_REMINDER", "CALL_CONTACT", "CREATE_CALENDAR_EVENT"].includes(actionType);
  }

  private featureDisabledPlan(description: string, blockedBy: string): AgentPlan {
    return {
      id: randomUUID(),
      summary: description,
      requiresConfirmation: false,
      items: [this.item("ask_clarification", "Enable AI parsing", description, "low", { blockedBy }, false)]
    };
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

  private toolName(item: AgentPlanItem) {
    if (item.type === "create_trigger") return `create${String(item.payload.triggerType ?? "Trigger")}`;
    if (item.type === "create_live_context_trigger") return `create${String(item.payload.triggerType ?? "LiveContext")}Trigger`;
    if (item.type === "create_memory") return item.payload.operation === "price_log" ? "createPriceLogAndMemory" : "createMemory";
    if (item.type === "create_action_prompt") return "createActionPrompt";
    return "answerOnly";
  }

  private completionMessage(plan: AgentPlan, completedCount: number, failedCount: number) {
    const triggers = plan.items.filter((item) => item.status === "completed" && (item.type === "create_trigger" || item.type === "create_live_context_trigger")).length;
    const memories = plan.items.filter((item) => item.status === "completed" && item.type === "create_memory").length;
    const actions = plan.items.filter((item) => item.status === "completed" && item.type === "create_action_prompt").length;
    if (!completedCount) return failedCount ? "I could not finish that plan. Review the blocked items and try again." : "Nothing was changed.";
    const parts = [
      triggers ? `${triggers} ${triggers === 1 ? "trigger" : "triggers"}` : "",
      memories ? `${memories} ${memories === 1 ? "memory" : "memories"}` : "",
      actions ? `${actions} ${actions === 1 ? "action" : "actions"}` : ""
    ].filter(Boolean);
    return `Done. I set up ${parts.join(" and ")}${failedCount ? `. ${failedCount} item needs attention.` : "."}`;
  }

  private readPlan(value: unknown) {
    return value as AgentPlan;
  }

  private findItem(plan: AgentPlan, itemId: string) {
    const item = plan.items.find((candidate) => candidate.id === itemId);
    if (!item) throw new NotFoundException("Agent plan item not found.");
    return item;
  }

  private async findOwnedRun(userId: string, id: string) {
    const run = await this.prisma.agentRun.findFirst({ where: { id, userId } });
    if (!run) throw new NotFoundException("Agent run not found.");
    return run;
  }
}
