import type { ReminderWithTriggers } from "@/features/reminders/types";
import { generateVoiceScript } from "@/features/voice/scripts";

export type ErrandGroup = {
  placeName: string;
  reminders: ReminderWithTriggers[];
  voiceScript: string;
};

export function groupErrandsByLocation(reminders: ReminderWithTriggers[]): ErrandGroup[] {
  const groups = new Map<string, ReminderWithTriggers[]>();

  reminders
    .filter((reminder) => reminder.status === "active" && reminder.locationTrigger)
    .forEach((reminder) => {
      const key = reminder.locationTrigger?.placeName.trim().toLowerCase();
      if (!key) return;
      groups.set(key, [...(groups.get(key) ?? []), reminder]);
    });

  return Array.from(groups.values())
    .filter((items) => items.length > 1)
    .map((items) => {
      const placeName = items[0].locationTrigger?.placeName ?? "this place";
      return {
        placeName,
        reminders: items,
        voiceScript: generateVoiceScript(
          {
            taskTitle: "errands",
            triggerType: "errand_group",
            place: placeName,
            tasks: items.map((item) => item.title.toLowerCase())
          },
          { count: items.length }
        )
      };
    });
}
