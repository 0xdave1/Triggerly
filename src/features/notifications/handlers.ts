import * as Notifications from "expo-notifications";
import { completeReminder, snoozeReminder } from "@/features/reminders/api";

export async function handleNotificationAction(response: Notifications.NotificationResponse): Promise<void> {
  const reminderId = response.notification.request.content.data?.reminderId;
  if (typeof reminderId !== "string") return;

  switch (response.actionIdentifier) {
    case "MARK_DONE":
      await completeReminder(reminderId);
      break;
    case "SNOOZE":
      await snoozeReminder(reminderId);
      break;
    default:
      break;
  }
}
