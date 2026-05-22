import { addDays, addMonths, addWeeks, format, isToday, parseISO } from "date-fns";
import type { Habit } from "@/features/reminders/types";

export function toIsoDate(value: Date | string): string {
  return typeof value === "string" ? new Date(value).toISOString() : value.toISOString();
}

export function formatDateTime(value?: string): string {
  if (!value) return "Not set";
  return format(parseISO(value), "PPp");
}

export function isIsoToday(value?: string): boolean {
  return Boolean(value && isToday(parseISO(value)));
}

export function getNextHabitDueDate(habit: Pick<Habit, "frequencyType" | "frequencyCount" | "lastCompletedAt" | "nextDueAt">): string {
  if (habit.nextDueAt) return habit.nextDueAt;

  const count = Math.max(1, habit.frequencyCount);
  const baseDate = habit.lastCompletedAt ? parseISO(habit.lastCompletedAt) : new Date();

  switch (habit.frequencyType) {
    case "weekly":
      return addWeeks(baseDate, count).toISOString();
    case "monthly":
      return addMonths(baseDate, count).toISOString();
    case "custom":
    case "daily":
    default:
      return addDays(baseDate, count).toISOString();
  }
}
