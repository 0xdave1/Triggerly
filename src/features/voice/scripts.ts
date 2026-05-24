import type { ActionPromptType, TriggerIntentType } from "@/features/reminders/types";

type VoiceScriptReminder = {
  taskTitle: string;
  triggerType: TriggerIntentType;
  place?: string;
  habit?: string;
  action?: ActionPromptType;
  tasks?: string[];
};

type VoiceScriptContext = {
  count?: number;
};

export function generateVoiceScript(reminder: VoiceScriptReminder, context: VoiceScriptContext): string {
  const task = reminder.taskTitle.toLowerCase();
  const place = reminder.place ?? "this place";

  switch (reminder.triggerType) {
    case "location_arrival":
      return `You're near ${place}. You asked me to remind you to ${task}.`;
    case "location_departure":
      return `You're leaving ${place}. Remember to ${task}.`;
    case "habit":
      return `You haven't completed ${reminder.habit ?? task} yet. Want to do it now?`;
    case "errand_group": {
      const tasks = reminder.tasks?.join(", ") ?? task;
      return `You have ${context.count ?? reminder.tasks?.length ?? 1} things to do at ${place}: ${tasks}.`;
    }
    case "action_prompt":
      return `You asked me to help with ${reminder.action ?? "an action"}. Please confirm before I continue.`;
    case "contact":
      return `You asked me to remember ${task} when this contact matters.`;
    case "time":
    default:
      return `You asked me to remind you to ${task}.`;
  }
}
