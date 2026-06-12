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
    <TerminalCard title="Habit">
      <TerminalStatRow label="Habit" value={reminder.title} tone="green" />
      <TerminalStatRow label="Frequency" value={`${reminder.habit?.frequencyCount ?? 1}x ${reminder.habit?.frequencyType ?? "daily"}`} tone="cyan" />
      <TerminalStatRow label="Last completed" value={formatDateTime(reminder.habit?.lastCompletedAt)} tone="muted" />
      <TerminalStatRow label="Next reminder" value={formatDateTime(reminder.habit?.nextDueAt)} tone="amber" />
      <TerminalStatRow label="Status" value={reminder.status} tone="green" />
      <TerminalButton variant="secondary" onPress={onDone}>
        Mark done
      </TerminalButton>
    </TerminalCard>
  );
}
