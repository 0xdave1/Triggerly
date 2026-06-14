import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ActionType, LocationTriggerType, ReminderType } from "@/common/enums";
import { PrismaService } from "@/prisma/prisma.service";
import { GenerateScriptDto } from "./dto/generate-script.dto";

@Injectable()
export class VoiceScriptService {
  constructor(private readonly prisma: PrismaService) {}

  async generateVoiceScript(userId: string, dto: GenerateScriptDto) {
    const settings = await this.prisma.userVoiceSetting.upsert({ where: { userId }, create: { userId }, update: {} });
    const personality = await this.prisma.voicePersonality.upsert({ where: { userId }, create: { userId }, update: {} });
    const style = personality.style.toLowerCase();
    if (dto.reminderId) return this.generateForReminder(userId, dto.reminderId, dto.context, style);
    if (dto.intent) return { script: this.applyStyle(this.generateForIntent(dto.intent, dto.context), style) };
    throw new BadRequestException("Provide reminderId or intent.");
  }

  async generatePreviewScript(userId: string, dto: GenerateScriptDto) {
    const settings = await this.prisma.userVoiceSetting.upsert({ where: { userId }, create: { userId }, update: {} });
    const base = dto.intent
      ? this.generateForIntent(dto.intent, dto.context)
      : "You have one important reminder ready to review.";
    return { script: this.applyStyle(base, settings.selectedVoiceStyle) };
  }

  async generateForReminder(userId: string, reminderId: string, context?: Record<string, unknown>, style = "calm") {
    const reminder = await this.prisma.reminder.findFirst({
      where: { id: reminderId, userId, status: { not: "DELETED" } },
      include: { locationTrigger: true, habit: true, actionPrompt: true, contactMemory: true }
    });
    if (!reminder) throw new NotFoundException("Reminder not found.");

    return { script: this.applyStyle(this.generate(reminder, context), style) };
  }

  generate(reminder: {
    title: string;
    type: string;
    locationTrigger?: { placeName: string; triggerType: string } | null;
    actionPrompt?: { actionType: string; payload?: unknown } | null;
    contactMemory?: { name: string } | null;
  }, context?: Record<string, unknown>): string {
    const task = reminder.title.toLowerCase();
    const actionType = reminder.actionPrompt?.actionType;

    if (actionType === ActionType.GENERATE_CHECKLIST) return `You asked me to generate a checklist for ${task}.`;
    if (actionType === ActionType.CALL_CONTACT) return `You asked to call ${reminder.contactMemory?.name ?? task}. Please confirm before I continue.`;
    if (actionType) return `You asked me to prepare ${this.actionLabel(actionType)}. Please review and confirm before I continue.`;

    if (reminder.locationTrigger?.triggerType === LocationTriggerType.DEPARTURE) {
      return `You're leaving ${reminder.locationTrigger.placeName}. Remember to ${task}.`;
    }
    if (reminder.locationTrigger?.triggerType === LocationTriggerType.ARRIVAL) {
      return `You're near ${reminder.locationTrigger.placeName}. You asked me to remind you to ${task}.`;
    }
    if (reminder.type === ReminderType.HABIT) return `You haven't completed ${task} yet. Do you want to do it now?`;
    if (context?.errandCount && context?.placeName) {
      const tasks = Array.isArray(context.tasks) ? `: ${context.tasks.join(", ")}` : ".";
      return `You have ${context.errandCount} things to do at ${context.placeName}${tasks}`;
    }

    return `You asked me to remind you to ${task}.`;
  }

  generateForIntent(intent: Record<string, unknown>, context?: Record<string, unknown>): string {
    const task = String(intent.taskTitle ?? "this");
    const triggerType = String(intent.triggerType ?? "");
    const action = intent.actionCandidate as { actionType?: string } | undefined;
    const place =
      String((intent.locationCandidate as { placeName?: unknown } | undefined)?.placeName ?? context?.placeName ?? "this place");

    if (action?.actionType) return `You asked me to prepare ${this.actionLabel(action.actionType)}. Please review and confirm before I continue.`;
    if (triggerType === "location_departure") return `You're leaving ${place}. Remember to ${task.toLowerCase()}.`;
    if (triggerType === "location_arrival") return `You're near ${place}. You asked me to ${task.toLowerCase()}.`;
    if (triggerType === "weather") return `The weather in ${place} may affect your plan. ${String(context?.condition ?? "Conditions have changed")}. You may want to prepare.`;
    if (triggerType === "exchange_rate") return `The ${String(context?.base ?? "base")}/${String(context?.quote ?? "quote")} rate has reached ${String(context?.rate ?? context?.targetRate ?? "your target")}. This matches your alert.`;
    if (triggerType === "price") return `You logged ${String(context?.item ?? task)} before. Today's price is ${String(context?.newPrice ?? "ready to review")}.`;
    if (triggerType === "habit") return `You haven't completed ${task.toLowerCase()} yet. Do you want to do it now?`;
    if (String(intent.intentType ?? "") === "daily_briefing_request") {
      return `Good morning. You have ${String(context?.count ?? 1)} important triggers today. First, ${String(context?.topTask ?? task)}.`;
    }
    return `You asked me to remind you to ${task.toLowerCase()}.`;
  }

  private applyStyle(script: string, style: string) {
    if (style === "energetic") return `Quick heads-up. ${script}`;
    if (style === "professional") return `Reminder. ${script}`;
    if (style === "friendly") return `Hi there. ${script}`;
    if (style === "minimal") return script.replace(/You asked me to /g, "").replace(/Do you want to do it now\?/g, "Ready when you are.");
    if (style === "friendly_nigerian") return `Quick one. ${script}`;
    if (style === "strict_coach") return `You marked this important. It's time to act. ${script}`;
    return script;
  }

  private actionLabel(actionType: string) {
    return actionType.toLowerCase().replace(/_/g, " ");
  }

  groupErrands(reminders: Array<{ title: string; locationTrigger?: { placeName: string } | null }>) {
    const groups = new Map<string, string[]>();
    for (const reminder of reminders) {
      const place = reminder.locationTrigger?.placeName;
      if (!place) continue;
      groups.set(place, [...(groups.get(place) ?? []), reminder.title.toLowerCase()]);
    }
    return Array.from(groups.entries())
      .filter(([, tasks]) => tasks.length > 1)
      .map(([placeName, tasks]) => ({
        placeName,
        tasks,
        script: `You have ${tasks.length} things to do at ${placeName}: ${tasks.join(", ")}.`
      }));
  }
}
