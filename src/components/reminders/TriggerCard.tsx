import { StyleSheet, Text, View } from "react-native";
import { TerminalButton } from "@/components/ui/TerminalButton";
import { TerminalCard } from "@/components/ui/TerminalCard";
import { TerminalStatRow } from "@/components/ui/TerminalStatRow";
import type { ReminderWithTriggers } from "@/features/reminders/types";
import { colors, spacing, typography } from "@/styles/theme";

type TriggerCardProps = {
  reminder: ReminderWithTriggers;
  onDone?: () => void;
  onSnooze?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function TriggerCard({ reminder, onDone, onSnooze, onEdit, onDelete }: TriggerCardProps) {
  return (
    <TerminalCard title={`[${reminder.type}_trigger]`} active={reminder.status === "active"} tone={reminder.type === "location" ? "cyan" : "green"}>
      <Text style={styles.title}>{reminder.title}</Text>
      <TerminalStatRow label="status" value={reminder.status} tone={reminder.status === "snoozed" ? "amber" : "green"} />
      <TerminalStatRow label="condition" value={conditionFor(reminder)} tone="cyan" />
      <TerminalStatRow label="delivery" value={reminder.deliveryMode ?? "push"} tone="muted" />
      <TerminalStatRow label="voice" value={reminder.voiceEnabled ? "enabled" : "disabled"} tone={reminder.voiceEnabled ? "green" : "muted"} />
      <View style={styles.row}>
        <TerminalButton variant="secondary" onPress={onDone}>done</TerminalButton>
        <TerminalButton variant="secondary" onPress={onSnooze}>snooze</TerminalButton>
        <TerminalButton variant="ghost" onPress={onEdit}>edit</TerminalButton>
        <TerminalButton variant="danger" onPress={onDelete}>delete</TerminalButton>
      </View>
    </TerminalCard>
  );
}

function conditionFor(reminder: ReminderWithTriggers) {
  if (reminder.timeTrigger) return new Date(reminder.timeTrigger.triggerDateTime).toLocaleString();
  if (reminder.locationTrigger) return `${reminder.locationTrigger.triggerType} ${reminder.locationTrigger.placeName}`;
  if (reminder.habit) return `${reminder.habit.frequencyCount}x ${reminder.habit.frequencyType}`;
  return "user_defined";
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontFamily: typography.mono,
    fontSize: typography.body,
    fontWeight: "900"
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  }
});
