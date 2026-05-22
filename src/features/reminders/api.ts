import { reminderCreateSchema } from "./schema";
import { useReminderStore } from "./store";
import type { ReminderCreateInput, ReminderUpdateInput, ReminderWithTriggers } from "./types";
import { cancelReminderNotification, scheduleTimeReminderNotification } from "@/features/notifications/scheduler";
import { registerLocationReminder } from "@/features/location/geofence";

export async function listReminders(): Promise<ReminderWithTriggers[]> {
  await ensureHydrated();
  return useReminderStore.getState().reminders;
}

export async function getReminder(id: string): Promise<ReminderWithTriggers | undefined> {
  await ensureHydrated();
  return useReminderStore.getState().reminders.find((reminder) => reminder.id === id && reminder.status !== "deleted");
}

export async function createReminder(input: ReminderCreateInput): Promise<ReminderWithTriggers> {
  const parsed = reminderCreateSchema.parse(input);
  await ensureHydrated();
  const reminder = await useReminderStore.getState().addReminder(parsed);
  await scheduleReminderSideEffects(reminder);
  return reminder;
}

export async function updateReminder(id: string, input: ReminderUpdateInput): Promise<ReminderWithTriggers | undefined> {
  await ensureHydrated();
  const reminder = await useReminderStore.getState().updateReminder(id, input);
  if (reminder) await scheduleReminderSideEffects(reminder);
  return reminder;
}

export async function deleteReminder(id: string): Promise<void> {
  await ensureHydrated();
  await cancelReminderNotification(id);
  await useReminderStore.getState().deleteReminder(id);
}

export async function completeReminder(id: string): Promise<ReminderWithTriggers | undefined> {
  await ensureHydrated();
  await cancelReminderNotification(id);
  return useReminderStore.getState().completeReminder(id);
}

export async function snoozeReminder(id: string): Promise<ReminderWithTriggers | undefined> {
  await ensureHydrated();
  const reminder = await useReminderStore.getState().snoozeReminder(id);
  if (reminder?.timeTrigger) await scheduleTimeReminderNotification(reminder);
  return reminder;
}

export async function clearLocalReminderData(): Promise<void> {
  await useReminderStore.getState().clearLocalData();
}

async function ensureHydrated(): Promise<void> {
  if (!useReminderStore.getState().hydrated) {
    await useReminderStore.getState().hydrate();
  }
}

async function scheduleReminderSideEffects(reminder: ReminderWithTriggers): Promise<void> {
  if (reminder.timeTrigger) {
    await scheduleTimeReminderNotification(reminder);
  }

  if (reminder.locationTrigger) {
    await registerLocationReminder(reminder);
  }
}
