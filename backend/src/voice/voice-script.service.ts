import { Injectable, NotFoundException } from "@nestjs/common";
import { ActionType, LocationTriggerType, ReminderType } from "@/common/enums";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class VoiceScriptService {
  constructor(private readonly prisma: PrismaService) {}

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
