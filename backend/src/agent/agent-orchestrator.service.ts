import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import {
  ActionType,
  AccountabilityStrictness,
  AgentRunStatus,
  ChatMessageRole,
  DeliveryMode,
  DebtDirection,
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
import { toPrismaJson } from "@/common/utils/prisma-json";
import { ActionPromptsService } from "@/action-prompts/action-prompts.service";
import { AiService } from "@/ai/ai.service";
import type { ParsedIntent } from "@/ai/intent-types";
import { LiveContextService } from "@/live-context/live-context.service";
import { MemoryService } from "@/memory/memory.service";
import { PrismaService } from "@/prisma/prisma.service";
import { PrivacyService } from "@/privacy/privacy.service";
import { RemindersService } from "@/reminders/reminders.service";
import { TriggersService } from "@/triggers/triggers.service";
import { VoiceScriptService } from "@/voice/voice-script.service";
import { PromisesService } from "@/promises/promises.service";
import { DebtsService } from "@/debts/debts.service";
import { PricesService } from "@/prices/prices.service";
import { TravelService } from "@/travel/travel.service";
import { AccountabilityService } from "@/accountability/accountability.service";
import type { AgentExecutionResult, AgentPlan, AgentPlanItem } from "./agent.types";

@Injectable()
export class AgentOrchestratorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly privacy: PrivacyService,
    private readonly reminders: RemindersService,
    private readonly triggers: TriggersService,
    private readonly memory: MemoryService,
    private readonly liveContext: LiveContextService,
    private readonly actions: ActionPromptsService,
    private readonly voice: VoiceScriptService,
    private readonly promises: PromisesService,
    private readonly debts: DebtsService,
    private readonly prices: PricesService,
    private readonly travel: TravelService,
    private readonly accountability: AccountabilityService
  ) {}

  async preparePlan(userId: string, userInput: string) {
    const settings = await this.privacy.getSettings(userId);
    return this.applyPrivacyGates(
      await this.ai.generateAgentPlan(userId, userInput, {
        timezone: "Africa/Lagos",
        locale: "en-NG"
      }),
      settings
    );
  }

  async createRun(
    userId: string,
    conversationId: string,
    userInput: string,
    preparedPlan?: AgentPlan
  ) {
    const plan = preparedPlan ?? (await this.preparePlan(userId, userInput));
    const status = plan.requiresConfirmation
      ? AgentRunStatus.WAITING_FOR_CONFIRMATION
      : AgentRunStatus.COMPLETED;

    const run = await this.prisma.agentRun.create({
      data: {
        userId,
        conversationId,
        status,
        userInput,
        plan: toPrismaJson(plan),
        completedAt: status === AgentRunStatus.COMPLETED ? new Date() : undefined
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

  async turnThisInto(userId: string, sourceMessageId: string, targetType: string) {
    const source = await this.prisma.chatMessage.findFirst({
      where: { id: sourceMessageId, userId, role: ChatMessageRole.ASSISTANT }
    });
    if (!source) throw new NotFoundException("Source assistant message not found.");
    const instruction = this.turnIntoInstruction(targetType, source.content);
    const plan = this.turnIntoPlan(targetType, source.content);
    const run = await this.createRun(userId, source.conversationId, instruction, plan);
    return { agentRunId: run.id, plan };
  }

  async confirmRun(userId: string, id: string, itemIds?: string[]) {
    const run = await this.findOwnedRun(userId, id);
    const plan = this.readPlan(run.plan);
    const selected = new Set(
      itemIds ??
        plan.items
          .filter((item) => this.isActionablePlanItem(item))
          .map((item) => item.id)
    );

    for (const item of plan.items) {
      if (
        !selected.has(item.id) ||
        item.status !== "proposed" ||
        !this.isActionablePlanItem(item)
      ) {
        continue;
      }
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
      if (typeof item.payload.blockedBy === "string") {
        failedCount += 1;
        const setting = item.payload.blockedBy;
        const message = `${this.settingLabel(setting)} is disabled in Control.`;
        item.status = "failed";
        item.error = message;
        item.result = {
          status: "blocked_by_privacy",
          setting,
          message
        };
        continue;
      }
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
    const intent = this.intentFromItem(item);
    if (item.type === "create_trigger") return this.createTrigger(userId, intent);
    if (item.type === "create_live_context_trigger") return this.createLiveContextTrigger(userId, intent);
    if (item.type === "create_memory") {
      const operation = String(item.payload.operation ?? "memory");
      if (operation === "travel_plan") {
        return this.travel.create(userId, {
          destination: intent.destination ?? String(item.payload.destination ?? "Destination"),
          departureDate: this.resolveOptionalDate(intent.timeCandidate)
        }) as unknown as Promise<Record<string, unknown>>;
      }
      if (intent.intentType === "promise_memory") {
        return this.promises.create(userId, {
          personName: intent.person ?? String(intent.memoryCandidate?.person ?? "Someone"),
          taskTitle: intent.taskTitle ?? String(intent.memoryCandidate?.commitment ?? "Follow up"),
          deadline: this.resolveOptionalDate(intent.timeCandidate ?? (intent.deadline ? { phrase: intent.deadline } : undefined))
        }) as unknown as Promise<Record<string, unknown>>;
      }
      if (intent.intentType === "debt_memory") {
        return this.debts.create(userId, {
          personName: intent.person ?? String(intent.memoryCandidate?.person ?? "Someone"),
          amount: intent.amount ?? Number(intent.memoryCandidate?.amount ?? 0),
          currency: intent.currency ?? String(intent.memoryCandidate?.currency ?? "NGN"),
          direction: intent.direction === "payable" ? DebtDirection.I_OWE : DebtDirection.OWED_TO_ME
        }) as unknown as Promise<Record<string, unknown>>;
      }
      if (operation === "price_log" && intent.item && typeof intent.price === "number") {
        return this.prices.create(userId, {
          itemName: intent.item,
          price: intent.price,
          currency: intent.currency ?? "NGN",
          placeName: intent.place,
          source: PriceLogSource.AI_CHAT
        }) as unknown as Promise<Record<string, unknown>>;
      }
      return this.createMemory(userId, intent, operation);
    }
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
      if (intent.habitCandidate?.accountability === true) {
        return this.accountability.create(userId, {
          title: intent.taskTitle ?? "Accountability goal",
          frequencyType: this.habitFrequency(intent),
          frequencyCount: 1,
          strictness: AccountabilityStrictness.BALANCED,
          voiceEnabled: false
        }) as unknown as Promise<Record<string, unknown>>;
      }
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
    const explicit = candidate?.dateTime ?? candidate?.iso ?? candidate?.value;
    if (typeof explicit === "string") {
      const parsed = new Date(explicit);
      if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
    }
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

  private applyPrivacyGates(
    plan: AgentPlan,
    settings: Record<string, boolean | string | number | Date | null>
  ): AgentPlan {
    return {
      ...plan,
      requiresConfirmation: plan.items.some((item) => this.isActionablePlanItem(item)),
      items: plan.items.map((item) => {
        const intent = this.intentFromItem(item);
        const triggerType = String(item.payload.triggerType ?? intent.triggerType ?? "").toLowerCase();
        const actionType = String(
          item.payload.actionType ?? intent.actionCandidate?.actionType ?? intent.actionType ?? ""
        ).toUpperCase();
        const memoryType = String(
          item.payload.memoryType ?? intent.memoryCandidate?.type ?? intent.intentType ?? ""
        ).toLowerCase();
        let blockedBy: string | undefined;

        if (item.type === "create_trigger" && triggerType.startsWith("location_")) {
          blockedBy = settings.locationTriggersEnabled === false ? "locationTriggersEnabled" : undefined;
        } else if (item.type === "create_live_context_trigger") {
          if (triggerType === "weather") {
            blockedBy = settings.weatherTriggersEnabled === false ? "weatherTriggersEnabled" : undefined;
          } else if (triggerType === "exchange_rate") {
            blockedBy =
              settings.exchangeRateTriggersEnabled === false
                ? "exchangeRateTriggersEnabled"
                : undefined;
          } else if (triggerType === "travel") {
            blockedBy = settings.travelContextEnabled === false ? "travelContextEnabled" : undefined;
          }
        } else if (item.type === "create_memory") {
          blockedBy = settings.memoryEnabled === false ? "memoryEnabled" : undefined;
          if (!blockedBy && (memoryType === "price" || item.payload.operation === "price_log")) {
            blockedBy = settings.priceMemoryEnabled === false ? "priceMemoryEnabled" : undefined;
          }
        } else if (item.type === "create_action_prompt") {
          blockedBy = this.actionGate(actionType, settings);
        }

        const sensitive =
          item.sensitive ||
          item.riskLevel === "sensitive" ||
          triggerType.startsWith("location_") ||
          this.isSensitiveAction(actionType);
        const next = {
          ...item,
          riskLevel: sensitive && item.riskLevel === "low" ? ("medium" as const) : item.riskLevel,
          sensitive,
          requiresConfirmation: this.isActionablePlanItem(item) ? true : item.requiresConfirmation,
          payload:
            item.type === "create_action_prompt"
              ? { ...item.payload, actionType, executionAllowed: false }
              : { ...item.payload }
        };
        return this.gate(next, blockedBy);
      })
    };
  }

  private intentFromItem(item: AgentPlanItem): ParsedIntent {
    if (item.payload.intent && typeof item.payload.intent === "object") {
      return item.payload.intent as ParsedIntent;
    }

    const triggerType = String(item.payload.triggerType ?? "").toLowerCase() as ParsedIntent["triggerType"];
    const actionType = String(item.payload.actionType ?? "").toUpperCase();
    const time = item.payload.time;
    const location = item.payload.location;
    const habit = item.payload.habit;
    const memoryType = String(item.payload.memoryType ?? "general").toLowerCase();

    return {
      intentType:
        item.type === "create_action_prompt"
          ? "action_prompt"
          : item.type === "create_memory"
            ? memoryType === "debt"
              ? "debt_memory"
              : memoryType === "promise"
                ? "promise_memory"
                : item.payload.operation === "price_log"
                  ? "price_log"
                  : "memory"
            : item.type === "create_live_context_trigger"
              ? triggerType === "exchange_rate"
                ? "exchange_rate_trigger"
                : triggerType === "weather"
                  ? "weather_trigger"
                  : "travel_plan"
              : triggerType === "habit"
                ? "habit"
                : "reminder",
      triggerType,
      taskTitle: String(item.payload.taskTitle ?? item.title),
      timeCandidate:
        time && typeof time === "object"
          ? (time as Record<string, unknown>)
          : typeof time === "string"
            ? { phrase: time }
            : undefined,
      locationCandidate:
        location && typeof location === "object"
          ? (location as Record<string, unknown>)
          : typeof location === "string"
            ? { placeName: location }
            : undefined,
      habitCandidate:
        habit && typeof habit === "object"
          ? (habit as Record<string, unknown>)
          : typeof habit === "string"
            ? { frequency: habit }
            : undefined,
      memoryCandidate: item.type === "create_memory" ? { ...item.payload, type: memoryType } : undefined,
      actionCandidate:
        item.type === "create_action_prompt"
          ? {
              actionType: this.toActionType(actionType),
              payload: { ...item.payload, executionAllowed: false }
            }
          : undefined,
      actionType: actionType.toLowerCase(),
      destination: this.stringValue(item.payload.destination ?? item.payload.location),
      baseCurrency: this.stringValue(item.payload.baseCurrency ?? item.payload.base),
      quoteCurrency: this.stringValue(item.payload.quoteCurrency ?? item.payload.quote),
      targetRate: this.numberValue(item.payload.targetRate),
      condition: this.stringValue(item.payload.condition ?? item.payload.operator),
      item: this.stringValue(item.payload.item ?? item.payload.itemName),
      price: this.numberValue(item.payload.price),
      currency: this.stringValue(item.payload.currency),
      place: this.stringValue(item.payload.place ?? item.payload.placeName),
      person: this.stringValue(item.payload.person ?? item.payload.recipient),
      amount: this.numberValue(item.payload.amount),
      direction: item.payload.direction === "payable" ? "payable" : "receivable",
      frequency: this.stringValue(item.payload.frequency),
      suggestedVoiceScript: this.stringValue(item.payload.suggestedVoiceScript),
      confidence: this.numberValue(item.payload.confidence) ?? 0.8,
      requiresConfirmation: true,
      sensitive: item.sensitive,
      executionAllowed: false
    };
  }

  private toActionType(value: string): ActionType {
    return Object.values(ActionType).includes(value as ActionType)
      ? (value as ActionType)
      : ActionType.GENERATE_CHECKLIST;
  }

  private isActionablePlanItem(item: AgentPlanItem) {
    return !["ask_clarification", "answer_only"].includes(item.type);
  }

  private settingLabel(setting: string) {
    const labels: Record<string, string> = {
      locationTriggersEnabled: "Location triggers",
      weatherTriggersEnabled: "Weather triggers",
      exchangeRateTriggersEnabled: "Exchange-rate triggers",
      travelContextEnabled: "Travel context",
      memoryEnabled: "Memory",
      priceMemoryEnabled: "Price memory",
      emailDraftingEnabled: "Email drafting",
      messageDraftingEnabled: "Message drafting",
      paymentRemindersEnabled: "Payment reminders",
      paymentActionsEnabled: "Payment actions",
      contactAccessEnabled: "Contact access",
      calendarIntegrationEnabled: "Calendar integration"
    };
    return labels[setting] ?? "This feature";
  }

  private stringValue(value: unknown) {
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
  }

  private numberValue(value: unknown) {
    const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
    return Number.isFinite(number) ? number : undefined;
  }

  private habitFrequency(intent: ParsedIntent): HabitFrequencyType {
    const frequency = String(intent.habitCandidate?.frequency ?? intent.frequency ?? "daily").toUpperCase();
    return Object.values(HabitFrequencyType).includes(frequency as HabitFrequencyType)
      ? (frequency as HabitFrequencyType)
      : HabitFrequencyType.DAILY;
  }

  private resolveOptionalDate(candidate?: Record<string, unknown>) {
    return candidate ? this.resolveTimeCandidate(candidate) : undefined;
  }

  private turnIntoInstruction(targetType: string, content: string) {
    const instructions: Record<string, string> = {
      reminder: `Create a reminder from this answer: ${content}`,
      checklist: `Create a checklist from this answer: ${content}`,
      habit: `Create a recurring habit from this answer: ${content}`,
      memory: `Save the useful facts in this answer as memory: ${content}`,
      email_draft: `Draft an email based on this answer: ${content}`,
      travel_plan: `Create a travel plan from this answer: ${content}`,
      weather_alert: `Create a weather alert related to this answer: ${content}`,
      price_memory: `Save the price information in this answer as price memory: ${content}`
    };
    return instructions[targetType] ?? `Create a reviewable plan from this answer: ${content}`;
  }

  private turnIntoPlan(targetType: string, content: string): AgentPlan {
    const itemId = randomUUID();
    const common = {
      id: itemId,
      title: this.turnIntoTitle(targetType),
      description: "Review and edit the details before Triggerly creates anything.",
      riskLevel: "low" as const,
      status: "proposed" as const,
      requiresConfirmation: true,
      sensitive: false
    };
    const item: AgentPlanItem =
      targetType === "checklist"
        ? { ...common, type: "create_action_prompt", payload: { actionType: "GENERATE_CHECKLIST", sourceText: content, executionAllowed: false } }
        : targetType === "email_draft"
          ? { ...common, type: "create_action_prompt", riskLevel: "sensitive", sensitive: true, payload: { actionType: "DRAFT_EMAIL", sourceText: content, executionAllowed: false } }
          : targetType === "weather_alert"
            ? { ...common, type: "create_live_context_trigger", payload: { triggerType: "weather", sourceText: content, needsDetails: true } }
            : targetType === "memory" || targetType === "price_memory" || targetType === "travel_plan"
              ? { ...common, type: "create_memory", payload: { memoryType: targetType === "price_memory" ? "price" : targetType === "travel_plan" ? "travel" : "general", sourceText: content } }
              : { ...common, type: "create_trigger", payload: { triggerType: targetType === "habit" ? "habit" : "time", taskTitle: this.turnIntoTitle(targetType), sourceText: content, needsDetails: true } };
    return {
      id: randomUUID(),
      summary: "I prepared one option from that answer. Check the details before confirming.",
      requiresConfirmation: true,
      items: [item]
    };
  }

  private turnIntoTitle(targetType: string) {
    const labels: Record<string, string> = {
      reminder: "Reminder from this answer",
      checklist: "Checklist from this answer",
      habit: "Habit from this answer",
      memory: "Save this answer as memory",
      email_draft: "Email draft from this answer",
      travel_plan: "Travel plan from this answer",
      weather_alert: "Weather alert from this answer",
      price_memory: "Price memory from this answer"
    };
    return labels[targetType] ?? "Plan from this answer";
  }
}
