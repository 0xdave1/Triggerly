import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ActionType, LocationTriggerType, ReminderType } from "@/common/enums";
import { PrismaService } from "@/prisma/prisma.service";
import { GenerateScriptDto } from "./dto/generate-script.dto";

@Injectable()
export class VoiceScriptService {
  constructor(private readonly prisma: PrismaService) {}

  async generateVoiceScript(userId: string, dto: GenerateScriptDto) {
    if (dto.reminderId) return this.generateForReminder(userId, dto.reminderId, dto.context);
    if (dto.intent) return { script: this.generateForIntent(dto.intent, dto.context) };
    throw new BadRequestException("Provide reminderId or intent.");
  }

  async generateForReminder(userId: string, reminderId: string, context?: Record<string, unknown>) {
    const reminder = await this.prisma.reminder.findFirst({
      where: { id: reminderId, userId, status: { not: "DELETED" } },
      include: { locationTrigger: true, habit: true, actionPrompt: true, contactMemory: true }
    });
    if (!reminder) throw new NotFoundException("Reminder not found.");

    return { script: this.generate(reminder, context) };
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

    if (actionType === ActionType.OPEN_PAYMENT_APP) return `You asked to send money. Please confirm before taking action.`;
    if (actionType === ActionType.DRAFT_EMAIL) return `You asked to email someone about ${task}. Review the draft before sending.`;
    if (actionType === ActionType.DRAFT_MESSAGE) return `You asked me to prepare a message. Review it before sending.`;
    if (actionType === ActionType.CREATE_CALENDAR_EVENT) return `You asked me to prepare a calendar event. Please confirm before I continue.`;
    if (actionType === ActionType.GENERATE_CHECKLIST) return `You asked me to generate a checklist for ${task}.`;
    if (actionType === ActionType.CALL_CONTACT) return `You asked to call ${reminder.contactMemory?.name ?? task}. Please confirm before I continue.`;

    if (reminder.locationTrigger?.triggerType === LocationTriggerType.DEPARTURE) {
      return `You're leaving ${reminder.locationTrigger.placeName}. Remember to ${task}.`;
    }
    if (reminder.locationTrigger?.triggerType === LocationTriggerType.ARRIVAL) {
      return `You're near ${reminder.locationTrigger.placeName}. You asked me to remind you to ${task}.`;
    }
    if (reminder.type === ReminderType.HABIT) return `You haven't completed ${task} yet. Want to do it now?`;
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

    if (action?.actionType === ActionType.OPEN_PAYMENT_APP) return `You asked to send money. Please confirm before taking action.`;
    if (action?.actionType === ActionType.DRAFT_EMAIL) return `You asked to email someone about ${task.toLowerCase()}. Review the draft before sending.`;
    if (triggerType === "location_departure") return `You're leaving ${place}. Remember to ${task.toLowerCase()}.`;
    if (triggerType === "location_arrival") return `You're near ${place}. You asked me to ${task.toLowerCase()}.`;
    if (triggerType === "weather") return `It may rain in ${place} around ${String(context?.time ?? "your travel time")}. You may want to prepare before traveling.`;
    if (triggerType === "exchange_rate") return `The ${String(context?.currency ?? "currency")} rate has reached your target of ${String(context?.targetRate ?? "the saved rate")}.`;
    if (triggerType === "price") return `You logged ${String(context?.item ?? task)} before. Today's price is ${String(context?.newPrice ?? "ready to review")}.`;
    if (triggerType === "habit") return `You haven't completed ${task.toLowerCase()} yet. Want to do it now?`;
    return `You asked me to remind you to ${task.toLowerCase()}.`;
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
