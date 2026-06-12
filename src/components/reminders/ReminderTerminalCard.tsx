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
        <Text style={styles.kind}>{reminder.type} reminder</Text>
        <TerminalBadge label={statusLabel(reminder.status)} tone={statusTone(reminder.status, reminder.type)} />
      </View>
      <Text style={styles.task}>{reminder.title}</Text>
      {reminder.locationTrigger ? (
        <>
          <TerminalStatRow label="Place" value={reminder.locationTrigger.placeName} tone="cyan" />
          <TerminalStatRow label="Radius" value={`${reminder.locationTrigger.radiusMeters}m`} tone="muted" />
        </>
      ) : null}
      {reminder.timeTrigger ? <TerminalStatRow label="Time" value={new Date(reminder.timeTrigger.triggerDateTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} tone="cyan" /> : null}
      {reminder.habit ? <TerminalStatRow label="Frequency" value={`${reminder.habit.frequencyCount}x ${reminder.habit.frequencyType}`} tone="amber" /> : null}
      {reminder.deliveryMode ? <TerminalStatRow label="Delivery" value={reminder.deliveryMode.replace(/_/g, " ")} tone={reminder.voiceEnabled ? "cyan" : "muted"} /> : null}
      {reminder.actionType ? <TerminalStatRow label="Action" value="your approval is required" tone="amber" /> : null}
      <View style={styles.actions}>
        {onComplete ? (
          <TerminalButton variant="secondary" onPress={onComplete}>
            Done
          </TerminalButton>
        ) : null}
        {onSnooze ? (
          <TerminalButton variant="ghost" onPress={onSnooze}>
            Snooze
          </TerminalButton>
        ) : null}
        {onPress ? (
          <TerminalButton variant="ghost" onPress={onPress}>
            Details
          </TerminalButton>
        ) : null}
      </View>
    </TerminalCard>
  );
}

function statusLabel(status: ReminderStatus) {
  if (status === "active") return "active";
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
    color: colors.textMuted,
    flex: 1,
    fontFamily: typography.code,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  task: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 27
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  }
});
