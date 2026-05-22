import { StyleSheet, Text, View } from "react-native";
import { TerminalBadge } from "@/components/ui/TerminalBadge";
import { TerminalButton } from "@/components/ui/TerminalButton";
import { TerminalCard } from "@/components/ui/TerminalCard";
import { TerminalStatRow } from "@/components/ui/TerminalStatRow";
import type { ReminderStatus, ReminderWithTriggers } from "@/features/reminders/types";
import { colors, spacing, typography } from "@/styles/theme";

type ReminderTerminalCardProps = {
  reminder: ReminderWithTriggers;
  onPress?: () => void;
  onComplete?: () => void;
  onSnooze?: () => void;
};

export function ReminderTerminalCard({ reminder, onPress, onComplete, onSnooze }: ReminderTerminalCardProps) {
  return (
    <TerminalCard active={reminder.status === "active"} tone={reminder.type === "location" ? "cyan" : reminder.status === "snoozed" ? "amber" : "green"}>
      <View style={styles.header}>
        <Text style={styles.kind}>[{reminder.type}_trigger]</Text>
        <TerminalBadge label={statusLabel(reminder.status)} tone={statusTone(reminder.status, reminder.type)} />
      </View>
      <TerminalStatRow label="task" value={reminder.title} tone="green" />
      {reminder.locationTrigger ? (
        <>
          <TerminalStatRow label="place" value={reminder.locationTrigger.placeName} tone="cyan" />
          <TerminalStatRow label="radius" value={`${reminder.locationTrigger.radiusMeters}m`} tone="muted" />
        </>
      ) : null}
      {reminder.timeTrigger ? <TerminalStatRow label="time" value={new Date(reminder.timeTrigger.triggerDateTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} tone="cyan" /> : null}
      {reminder.habit ? <TerminalStatRow label="frequency" value={`${reminder.habit.frequencyCount}x ${reminder.habit.frequencyType}`} tone="amber" /> : null}
      <TerminalStatRow label="privacy" value={reminder.locationTrigger ? "location only" : "user-defined"} tone="muted" />
      <View style={styles.actions}>
        {onComplete ? (
          <TerminalButton variant="secondary" onPress={onComplete}>
            done
          </TerminalButton>
        ) : null}
        {onSnooze ? (
          <TerminalButton variant="ghost" onPress={onSnooze}>
            snooze
          </TerminalButton>
        ) : null}
        {onPress ? (
          <TerminalButton variant="ghost" onPress={onPress}>
            edit
          </TerminalButton>
        ) : null}
      </View>
    </TerminalCard>
  );
}

function statusLabel(status: ReminderStatus) {
  if (status === "active") return "armed";
  return status;
}

function statusTone(status: ReminderStatus, type: ReminderWithTriggers["type"]) {
  if (status === "completed") return "grey";
  if (status === "snoozed") return "amber";
  if (status === "deleted") return "red";
  if (type === "location") return "cyan";
  return "green";
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  kind: {
    color: colors.text,
    flex: 1,
    fontFamily: typography.mono,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.4,
    textTransform: "uppercase"
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  }
});
