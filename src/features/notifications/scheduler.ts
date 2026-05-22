import * as Notifications from "expo-notifications";
import { parseISO } from "date-fns";
import { Platform } from "react-native";
import type { ReminderWithTriggers } from "@/features/reminders/types";
import { getReminderTriggerSummary } from "@/features/reminders/utils";
import { requestNotificationPermission } from "./permissions";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false
  })
});

export async function registerNotificationActions(): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    await Notifications.setNotificationCategoryAsync("REMINDER", [
      { identifier: "MARK_DONE", buttonTitle: "Mark done", options: { opensAppToForeground: false } },
      { identifier: "SNOOZE", buttonTitle: "Snooze", options: { opensAppToForeground: false } },
      { identifier: "OPEN", buttonTitle: "Open", options: { opensAppToForeground: true } }
    ]);
  } catch {
    // Notification action categories vary by platform and Expo runtime.
    // Core reminder CRUD remains available when action categories are unsupported.
  }
}

export async function scheduleTimeReminderNotification(reminder: ReminderWithTriggers): Promise<string | undefined> {
  if (!reminder.timeTrigger) return undefined;

  const permission = await requestNotificationPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission denied.");
  }

  await cancelReminderNotification(reminder.id);
  const triggerDate = parseISO(reminder.timeTrigger.triggerDateTime);
  if (triggerDate.getTime() <= Date.now()) return undefined;

  return Notifications.scheduleNotificationAsync({
    identifier: reminder.id,
    content: {
      title: reminder.title,
      body: reminder.notes || getReminderTriggerSummary(reminder),
      categoryIdentifier: "REMINDER",
      data: { reminderId: reminder.id }
    },
    trigger: triggerDate as unknown as Notifications.NotificationTriggerInput
  });
}

export async function scheduleLocationReminderNotificationPlaceholder(reminder: ReminderWithTriggers): Promise<void> {
  if (!reminder.locationTrigger) return;
  // Platform geofence notification scheduling belongs with production geofencing.
  await Promise.resolve();
}

export async function cancelReminderNotification(reminderId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(reminderId).catch(() => undefined);
}
