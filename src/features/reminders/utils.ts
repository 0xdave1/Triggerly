import { addMinutes, parseISO } from "date-fns";
import { getNextHabitDueDate, isIsoToday } from "@/lib/dates";
import type { ParsedReminderInput, ReminderStatus, ReminderType, ReminderWithTriggers } from "./types";

export type ReminderFilter = "all" | "time" | "location" | "habit";

export function parseReminderInput(input: string): ParsedReminderInput {
  const normalized = input.trim();
  const lower = normalized.toLowerCase();
  const hasHabit = /\b(every day|daily|weekly|every week|monthly|every month)\b/.test(lower);
  const hasLocation =
    lower.includes("when i get to") ||
    lower.includes("when i arrive") ||
    lower.includes("when i leave") ||
    lower.includes("at shoprite") ||
    lower.includes("at home");
  const hasTime =
    /\b(at|by|tomorrow|tonight|today)\b/.test(lower) ||
    /\b\d{1,2}(:\d{2})?\s?(am|pm)\b/.test(lower) ||
    /\b\d{1,2}:\d{2}\b/.test(lower);

  if (hasHabit) {
    return { title: normalized, triggerType: "habit", confidence: 0.78 };
  }

  if (hasLocation) {
    const possibleLocationPhrase = extractLocationPhrase(normalized);
    return { title: normalized, triggerType: "location", possibleLocationPhrase, confidence: 0.74 };
  }

  if (hasTime) {
    return { title: normalized, triggerType: "time", possibleTime: extractTimePhrase(normalized), confidence: 0.7 };
  }

  return { title: normalized, triggerType: "time", confidence: 0.35 };
}

function extractLocationPhrase(input: string): string | undefined {
  const match = input.match(/(?:when i get to|when i arrive at|when i leave|at)\s+(.+)$/i);
  return match?.[1]?.trim();
}

function extractTimePhrase(input: string): string | undefined {
  const match = input.match(/\b(tomorrow|tonight|today|by .+|at \d{1,2}(:\d{2})?\s?(am|pm)?|\d{1,2}:\d{2})\b/i);
  return match?.[0]?.trim();
}

export function filterReminders(reminders: ReminderWithTriggers[], filter: ReminderFilter): ReminderWithTriggers[] {
  const visible = reminders.filter((reminder) => reminder.status !== "deleted");
  return filter === "all" ? visible : visible.filter((reminder) => reminder.type === filter);
}

export function getTodayReminders(reminders: ReminderWithTriggers[]): ReminderWithTriggers[] {
  return reminders.filter((reminder) => {
    if (reminder.status !== "active" && reminder.status !== "snoozed") return false;
    if (reminder.timeTrigger && isIsoToday(reminder.timeTrigger.triggerDateTime)) return true;
    if (reminder.habit && isIsoToday(getNextHabitDueDate(reminder.habit))) return true;
    return false;
  });
}

export function getReminderTriggerSummary(reminder: ReminderWithTriggers): string {
  if (reminder.timeTrigger) return `Time: ${new Date(reminder.timeTrigger.triggerDateTime).toLocaleString()}`;
  if (reminder.locationTrigger) return `${reminder.locationTrigger.triggerType} at ${reminder.locationTrigger.placeName}, ${reminder.locationTrigger.radiusMeters}m`;
  if (reminder.habit) return `${reminder.habit.frequencyType} every ${reminder.habit.frequencyCount}`;
  return "Trigger details not set";
}

export function snoozeTimeFromNow(minutes: number): string {
  return addMinutes(new Date(), minutes).toISOString();
}

export function compareReminderDueDate(a: ReminderWithTriggers, b: ReminderWithTriggers): number {
  return getSortableDate(a) - getSortableDate(b);
}

function getSortableDate(reminder: ReminderWithTriggers): number {
  if (reminder.timeTrigger) return parseISO(reminder.timeTrigger.triggerDateTime).getTime();
  if (reminder.habit) return parseISO(getNextHabitDueDate(reminder.habit)).getTime();
  return parseISO(reminder.updatedAt).getTime();
}

export function isTerminalStatus(status: ReminderStatus): boolean {
  return status === "completed" || status === "deleted";
}
