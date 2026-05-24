import { HabitFrequencyType } from "../enums";

export function calculateNextDueAt(frequencyType: HabitFrequencyType, frequencyCount: number, fromDate = new Date()): Date {
  const count = Math.max(1, frequencyCount);
  const next = new Date(fromDate);

  switch (frequencyType) {
    case HabitFrequencyType.WEEKLY:
      next.setDate(next.getDate() + count * 7);
      return next;
    case HabitFrequencyType.MONTHLY:
      next.setMonth(next.getMonth() + count);
      return next;
    case HabitFrequencyType.CUSTOM:
    case HabitFrequencyType.DAILY:
    default:
      next.setDate(next.getDate() + count);
      return next;
  }
}
