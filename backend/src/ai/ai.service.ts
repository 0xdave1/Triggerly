import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ReminderType } from "@/common/enums";
import { toPrismaJson } from "@/common/utils/prisma-json";
import { PrismaService } from "@/prisma/prisma.service";
import { PrivacyService } from "@/privacy/privacy.service";
import { AiTriggerParserService } from "./ai-trigger-parser.service";
import { FreeModelProvider } from "./providers/freemodel.provider";
import { HeuristicAiProvider } from "./providers/heuristic.provider";
import { validateAgentPlan } from "./schemas/agent-plan.schema";
import type { AgentPlan } from "./types/agent-plan.types";
import { safeClarificationPlan } from "./utils/safe-json.util";

export type ParsedReminder = {
  title: string;
  triggerTypeGuess: ReminderType;
  timeCandidate?: string;
  locationCandidate?: string;
  habitCandidate?: string;
  confidence: number;
  requiresConfirmation: true;
};

@Injectable()
export class AiService {
  constructor(
    private readonly parser: AiTriggerParserService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly privacy: PrivacyService,
    private readonly heuristicProvider: HeuristicAiProvider,
    private readonly freeModelProvider: FreeModelProvider
  ) {}

  async createAgentPlan(
    userId: string,
    message: string,
    context: Record<string, unknown> = {}
  ): Promise<AgentPlan> {
    await this.privacy.assertCanParseAi(userId);
    const provider = this.config.get<string>("ai.provider") ?? this.config.get<string>("aiProvider") ?? "heuristic";

    if (provider === "freemodel") {
      try {
        return validateAgentPlan(
          await this.freeModelProvider.createAgentPlan({ userId, message, context })
        );
      } catch {
        // FreeModel is an enhancement, not a single point of failure for reminder creation.
      }
    }

    try {
      return validateAgentPlan(
        await this.heuristicProvider.createAgentPlan({ userId, message, context })
      );
    } catch {
      return validateAgentPlan(safeClarificationPlan());
    }
  }

  async parseTrigger(userId: string, input: string) {
    const parsed = this.parser.parse(input);
    await this.prisma.intentParseLog.create({
      data: {
        userId,
        input,
        parsedOutput: toPrismaJson(parsed),
        confidence: parsed.confidence
      }
    });
    return parsed;
  }

  parseReminderInput(input: string): ParsedReminder {
    const title = input.trim();
    const lower = title.toLowerCase();
    const habitMatch = lower.match(/\b(every\s+(day|week|month|monday|tuesday|wednesday|thursday|friday|saturday|sunday)|daily|weekly|monthly)\b/);
    const locationMatch = title.match(/(?:when i get to|when i arrive at|when i leave|at)\s+(.+)$/i);
    const timeMatch = title.match(/\b(at\s+\d{1,2}(:\d{2})?\s?(am|pm)?|by\s+.+|tomorrow|tonight|today|\d{1,2}:\d{2})\b/i);

    if (habitMatch) {
      return {
        title,
        triggerTypeGuess: ReminderType.HABIT,
        habitCandidate: habitMatch[0],
        confidence: 0.82,
        requiresConfirmation: true
      };
    }

    if (lower.includes("when i get to") || lower.includes("when i arrive") || lower.includes("when i leave") || lower.includes("at shoprite") || lower.includes("at home")) {
      return {
        title,
        triggerTypeGuess: ReminderType.LOCATION,
        locationCandidate: locationMatch?.[1]?.trim(),
        confidence: 0.76,
        requiresConfirmation: true
      };
    }

    if (timeMatch) {
      return {
        title,
        triggerTypeGuess: ReminderType.TIME,
        timeCandidate: timeMatch[0],
        confidence: 0.72,
        requiresConfirmation: true
      };
    }

    return {
      title,
      triggerTypeGuess: ReminderType.TIME,
      confidence: 0.35,
      requiresConfirmation: true
    };
  }
}
