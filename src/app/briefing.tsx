import { useMemo } from "react";
import { TerminalCard } from "@/components/ui/TerminalCard";
import { TerminalHeader } from "@/components/ui/TerminalHeader";
import { TerminalScreen } from "@/components/ui/TerminalScreen";
import { TerminalStatRow } from "@/components/ui/TerminalStatRow";
import { useMemoryItems } from "@/features/memory/hooks";
import { useReminders } from "@/features/reminders/hooks";
import { getTodayReminders } from "@/features/reminders/utils";

export default function BriefingScreen() {
  const reminders = useReminders();
  const memory = useMemoryItems();
  const allReminders = reminders.data ?? [];
  const today = useMemo(() => getTodayReminders(allReminders), [allReminders]);
  const completed = allReminders.filter((item) => item.status === "completed");
  const habitsDue = allReminders.filter((item) => item.type === "habit" && item.status === "active");

  return (
    <TerminalScreen>
      <TerminalHeader title="Daily briefing" subtitle="A summary built only from data you confirmed." status="ready" />
      <TerminalCard title="Morning">
        <TerminalStatRow label="today_triggers" value={String(today.length)} />
        <TerminalStatRow label="habits_due" value={String(habitsDue.length)} tone="cyan" />
        <TerminalStatRow label="pending_actions" value="review actions screen" tone="amber" />
        <TerminalStatRow label="weather_context" value="provider_not_configured" tone="muted" />
        <TerminalStatRow label="important_memory" value={memory.data?.[0]?.title ?? "none"} tone="muted" />
      </TerminalCard>
      <TerminalCard title="Evening" tone="amber">
        <TerminalStatRow label="completed_triggers" value={String(completed.length)} />
        <TerminalStatRow label="missed_or_postponed" value={String(allReminders.filter((item) => item.status === "snoozed").length)} tone="amber" />
        <TerminalStatRow label="habits_not_done" value={String(habitsDue.length)} tone="cyan" />
        <TerminalStatRow label="suggested_reschedule" value={habitsDue.length ? "review habit loops" : "none"} tone="muted" />
      </TerminalCard>
    </TerminalScreen>
  );
}
