import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { getPrivacySettings } from "@/features/privacy/api";
import { completeReminder, getReminder, snoozeReminder } from "@/features/reminders/api";
import { getVoiceSettings } from "@/features/voice/api";
import { privacySafeVoiceText, speakText } from "@/features/voice/speech";

export async function handleNotificationAction(response: Notifications.NotificationResponse): Promise<void> {
  const reminderId = response.notification.request.content.data?.reminderId;
  if (typeof reminderId !== "string") return;

  switch (response.actionIdentifier) {
    case "MARK_DONE":
      await completeReminder(reminderId);
      return;
    case "SNOOZE":
      await snoozeReminder(reminderId);
      return;
    default:
      router.push(`/reminders/${reminderId}` as never);
      await speakOpenedReminder(reminderId);
  }
}

async function speakOpenedReminder(reminderId: string): Promise<void> {
  try {
    const [reminder, settings, privacy] = await Promise.all([
      getReminder(reminderId),
      getVoiceSettings(),
      getPrivacySettings().catch(() => undefined)
    ]);
    if (!reminder || !settings.voiceNotificationsEnabled || privacy?.voiceNotificationsEnabled === false) return;

    const script =
      reminder.voiceScript?.trim() ||
      `You asked me to remind you to ${reminder.title.trim().toLowerCase()}.`;
    const safeScript = privacySafeVoiceText(script, settings, {
      locationBased: Boolean(reminder.locationTrigger)
    });
    await speakText(safeScript, settings);
  } catch {
    // Opening the reminder and push delivery still work if speech is unavailable.
  }
}
