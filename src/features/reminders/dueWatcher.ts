import { useEffect } from "react";
import { Alert, Platform } from "react-native";
import type { ReminderWithTriggers } from "./types";
import { formatNigeriaDateTimeDisplay } from "@/lib/timezone";

const FIRED_STORAGE_KEY = "triggerly:fired-time-reminders";

export function useForegroundDueReminders(reminders: ReminderWithTriggers[]): void {
  useEffect(() => {
    if (Platform.OS !== "web") return;

    const checkDueReminders = () => {
      const fired = readFiredKeys();
      const now = Date.now();

      for (const reminder of reminders) {
        if ((reminder.status !== "active" && reminder.status !== "snoozed") || !reminder.timeTrigger) continue;

        const dueAt = new Date(reminder.timeTrigger.triggerDateTime).getTime();
        if (Number.isNaN(dueAt) || dueAt > now) continue;

        const firedKey = `${reminder.id}:${reminder.timeTrigger.triggerDateTime}`;
        if (fired.has(firedKey)) continue;

        fired.add(firedKey);
        writeFiredKeys(fired);
        notifyForegroundReminder(reminder);
      }
    };

    checkDueReminders();
    const interval = setInterval(checkDueReminders, 30_000);
    return () => clearInterval(interval);
  }, [reminders]);
}

function notifyForegroundReminder(reminder: ReminderWithTriggers): void {
  const body = `${reminder.title}\nDue ${formatNigeriaDateTimeDisplay(reminder.timeTrigger!.triggerDateTime)} WAT`;

  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
    new Notification("Triggerly reminder", { body });
    return;
  }

  Alert.alert("Triggerly reminder", body);
}

function readFiredKeys(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(window.localStorage.getItem(FIRED_STORAGE_KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

function writeFiredKeys(keys: Set<string>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FIRED_STORAGE_KEY, JSON.stringify([...keys].slice(-200)));
}
