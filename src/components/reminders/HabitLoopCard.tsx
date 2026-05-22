import { TerminalButton } from "@/components/ui/TerminalButton";
import { TerminalCard } from "@/components/ui/TerminalCard";
import { TerminalStatRow } from "@/components/ui/TerminalStatRow";
import { formatDateTime } from "@/lib/dates";
import type { ReminderWithTriggers } from "@/features/reminders/types";

type HabitLoopCardProps = {
  reminder: ReminderWithTriggers;
  onDone: () => void;
};

export function HabitLoopCard({ reminder, onDone }: HabitLoopCardProps) {
  return (
    <TerminalCard title="habit_loop">
      <TerminalStatRow label="habit_name" value={reminder.title} tone="green" />
      <TerminalStatRow label="frequency" value={`${reminder.habit?.frequencyCount ?? 1}x ${reminder.habit?.frequencyType ?? "daily"}`} tone="cyan" />
      <TerminalStatRow label="last_done" value={formatDateTime(reminder.habit?.lastCompletedAt)} tone="muted" />
      <TerminalStatRow label="next_nudge" value={formatDateTime(reminder.habit?.nextDueAt)} tone="amber" />
      <TerminalStatRow label="status" value={reminder.status === "active" ? "armed" : reminder.status} tone="green" />
      <TerminalButton variant="secondary" onPress={onDone}>
        MARK_DONE
      </TerminalButton>
    </TerminalCard>
  );
}
