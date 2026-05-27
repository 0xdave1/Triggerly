import { reminderCreateSchema } from "./schema";
import { useReminderStore } from "./store";
import type { ParsedReminderInput, ReminderCreateInput, ReminderUpdateInput, ReminderWithTriggers } from "./types";
import { cancelReminderNotification, scheduleTimeReminderNotification } from "@/features/notifications/scheduler";
import { registerLocationReminder } from "@/features/location/geofence";
import { apiClient, isBackendUnavailable } from "@/lib/apiClient";
import { getAuthToken } from "@/features/auth/tokenStorage";
import {
  BackendParsedReminder,
  mapParsedReminderFromBackend,
  mapReminderFromBackend,
  mapReminderInputToBackend
} from "./backendMapper";
import { parseReminderInput, snoozeTimeFromNow } from "./utils";

let lastReminderWarning: string | undefined;

export async function listReminders(): Promise<ReminderWithTriggers[]> {
  if (await shouldUseBackend()) {
    try {
      const reminders = await apiClient<unknown[]>({ method: "GET", path: "/reminders" });
      return reminders.map((reminder) => mapReminderFromBackend(reminder as Parameters<typeof mapReminderFromBackend>[0]));
    } catch (error) {
      if (!isBackendUnavailable(error)) throw error;
      lastReminderWarning = "Server unavailable. Showing reminders stored on this device.";
    }
  }

  await ensureHydrated();
  return useReminderStore.getState().reminders;
}

export async function getReminder(id: string): Promise<ReminderWithTriggers | undefined> {
  if (await shouldUseBackend()) {
    try {
      const reminder = await apiClient<unknown>({ method: "GET", path: `/reminders/${id}` });
      return mapReminderFromBackend(reminder as Parameters<typeof mapReminderFromBackend>[0]);
    } catch (error) {
      if (!isBackendUnavailable(error)) throw error;
      lastReminderWarning = "Server unavailable. Showing the local copy if available.";
    }
  }

  await ensureHydrated();
  return useReminderStore.getState().reminders.find((reminder) => reminder.id === id && reminder.status !== "deleted");
}

export async function createReminder(input: ReminderCreateInput): Promise<ReminderWithTriggers> {
  const parsed = reminderCreateSchema.parse(input);
  if (await shouldUseBackend()) {
    try {
      const backendReminder = await apiClient<unknown>({ method: "POST", path: "/reminders", body: mapReminderInputToBackend(parsed) });
      const reminder = mapReminderFromBackend(backendReminder as Parameters<typeof mapReminderFromBackend>[0]);
      await scheduleReminderSideEffectsSafely(reminder);
      return reminder;
    } catch (error) {
      if (!isBackendUnavailable(error)) throw error;
      lastReminderWarning = "Server unavailable. Saved this reminder locally.";
    }
  }

  await ensureHydrated();
  const reminder = await useReminderStore.getState().addReminder(parsed);
  await scheduleReminderSideEffectsSafely(reminder);
  return reminder;
}

export async function updateReminder(id: string, input: ReminderUpdateInput): Promise<ReminderWithTriggers | undefined> {
  if (await shouldUseBackend()) {
    try {
      const reminder = await apiClient<unknown>({ method: "PATCH", path: `/reminders/${id}`, body: mapReminderInputToBackend(input) });
      const mapped = mapReminderFromBackend(reminder as Parameters<typeof mapReminderFromBackend>[0]);
      await scheduleReminderSideEffectsSafely(mapped);
      return mapped;
    } catch (error) {
      if (!isBackendUnavailable(error)) throw error;
      lastReminderWarning = "Server unavailable. Updated the local copy if available.";
    }
  }

  await ensureHydrated();
  const reminder = await useReminderStore.getState().updateReminder(id, input);
  if (reminder) await scheduleReminderSideEffectsSafely(reminder);
  return reminder;
}

export async function deleteReminder(id: string): Promise<void> {
  if (await shouldUseBackend()) {
    try {
      await apiClient<unknown>({ method: "DELETE", path: `/reminders/${id}` });
      await cancelReminderNotification(id);
      return;
    } catch (error) {
      if (!isBackendUnavailable(error)) throw error;
      lastReminderWarning = "Server unavailable. Deleted the local copy if available.";
    }
  }

  await ensureHydrated();
  await cancelReminderNotification(id);
  await useReminderStore.getState().deleteReminder(id);
}

export async function completeReminder(id: string): Promise<ReminderWithTriggers | undefined> {
  if (await shouldUseBackend()) {
    try {
      await cancelReminderNotification(id);
      const reminder = await apiClient<unknown>({ method: "POST", path: `/reminders/${id}/complete` });
      return mapReminderFromBackend(reminder as Parameters<typeof mapReminderFromBackend>[0]);
    } catch (error) {
      if (!isBackendUnavailable(error)) throw error;
      lastReminderWarning = "Server unavailable. Marked the local copy complete if available.";
    }
  }

  await ensureHydrated();
  await cancelReminderNotification(id);
  return useReminderStore.getState().completeReminder(id);
}

export async function snoozeReminder(id: string): Promise<ReminderWithTriggers | undefined> {
  if (await shouldUseBackend()) {
    try {
      const reminder = await apiClient<unknown>({
        method: "POST",
        path: `/reminders/${id}/snooze`,
        body: { snoozeUntil: snoozeTimeFromNow(15) }
      });
      const mapped = mapReminderFromBackend(reminder as Parameters<typeof mapReminderFromBackend>[0]);
      if (mapped.timeTrigger) await scheduleTimeReminderNotificationSafely(mapped);
      return mapped;
    } catch (error) {
      if (!isBackendUnavailable(error)) throw error;
      lastReminderWarning = "Server unavailable. Snoozed the local copy if available.";
    }
  }

  await ensureHydrated();
  const reminder = await useReminderStore.getState().snoozeReminder(id);
  if (reminder?.timeTrigger) await scheduleTimeReminderNotificationSafely(reminder);
  return reminder;
}

export async function clearLocalReminderData(): Promise<void> {
  await useReminderStore.getState().clearLocalData();
}

export async function parseReminderInputWithBackend(input: string): Promise<ParsedReminderInput> {
  if (await shouldUseBackend()) {
    try {
      const parsed = await apiClient<BackendParsedReminder>({ method: "POST", path: "/ai/parse-reminder", body: { input } });
      return mapParsedReminderFromBackend(parsed);
    } catch (error) {
      if (!isBackendUnavailable(error)) throw error;
      lastReminderWarning = "Server unavailable. Using local reminder parsing.";
    }
  }

  return parseReminderInput(input);
}

export function consumeReminderApiWarning(): string | undefined {
  const warning = lastReminderWarning;
  lastReminderWarning = undefined;
  return warning;
}

async function ensureHydrated(): Promise<void> {
  if (!useReminderStore.getState().hydrated) {
    await useReminderStore.getState().hydrate();
  }
}

async function shouldUseBackend(): Promise<boolean> {
  return Boolean(await getAuthToken());
}

async function scheduleReminderSideEffectsSafely(reminder: ReminderWithTriggers): Promise<void> {
  if (reminder.timeTrigger) {
    await scheduleTimeReminderNotificationSafely(reminder);
  }

  if (reminder.locationTrigger) {
    try {
      await registerLocationReminder(reminder);
    } catch (error) {
      lastReminderWarning =
        error instanceof Error
          ? error.message
          : "Reminder saved, but location trigger setup needs to be retried on this device.";
    }
  }
}

async function scheduleTimeReminderNotificationSafely(reminder: ReminderWithTriggers): Promise<void> {
  try {
    await scheduleTimeReminderNotification(reminder);
  } catch (error) {
    lastReminderWarning =
      error instanceof Error && error.message.includes("Web reminders")
        ? "Reminder saved. On web, time triggers alert only while Triggerly is open. Use the mobile app for background notifications."
        : "Reminder saved, but local notification scheduling needs permission or retry.";
  }
}
