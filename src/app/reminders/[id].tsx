import { Alert, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { TerminalBadge } from "@/components/ui/TerminalBadge";
import { TerminalButton } from "@/components/ui/TerminalButton";
import { TerminalCard } from "@/components/ui/TerminalCard";
import { TerminalHeader } from "@/components/ui/TerminalHeader";
import { TerminalScreen } from "@/components/ui/TerminalScreen";
import { TerminalStatRow } from "@/components/ui/TerminalStatRow";
import { formatDateTime } from "@/lib/dates";
import { useReminder, useReminderActions } from "@/features/reminders/hooks";
import { colors, spacing, typography } from "@/styles/theme";

export default function ReminderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const reminderQuery = useReminder(id);
  const actions = useReminderActions();
  const reminder = reminderQuery.data;

  const remove = () => {
    Alert.alert("Delete reminder?", "This removes the reminder from your active list.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await actions.delete.mutateAsync(id);
          router.replace("/");
        }
      }
    ]);
  };

  if (!reminderQuery.isLoading && !reminder) {
    return (
      <TerminalScreen>
        <TerminalHeader title="trigger_not_found" subtitle="record unavailable" status="system: idle" />
        <TerminalCard title="error">
          <Text style={styles.body}>reminder_not_found · it may have been deleted</Text>
          <TerminalButton onPress={() => router.replace("/")}>BACK_HOME</TerminalButton>
        </TerminalCard>
      </TerminalScreen>
    );
  }

  if (!reminder) {
    return (
      <TerminalScreen>
        <Text style={styles.body}>loading_trigger...</Text>
      </TerminalScreen>
    );
  }

  return (
    <TerminalScreen>
      <TerminalHeader title="trigger.detail" subtitle="reminders fire when conditions match" status="privacy_mode: on" />
      <TerminalCard title={`${reminder.type}_trigger`} active={reminder.status === "active"}>
        <View style={styles.header}>
          <Text style={styles.title}>{reminder.title}</Text>
          <TerminalBadge label={reminder.status === "active" ? "armed" : reminder.status} tone={reminder.status === "snoozed" ? "amber" : reminder.status === "completed" ? "grey" : "green"} />
        </View>
        {reminder.notes ? <Text style={styles.body}>{reminder.notes}</Text> : null}
        <TerminalStatRow label="trigger_type" value={reminder.type} tone="cyan" />
        <TerminalStatRow label="status" value={reminder.status === "active" ? "armed" : reminder.status} tone="green" />
      </TerminalCard>

      <TerminalCard title="trigger_details">
        {reminder.timeTrigger ? <TerminalStatRow label="time" value={formatDateTime(reminder.timeTrigger.triggerDateTime)} tone="cyan" /> : null}
        {reminder.locationTrigger ? (
          <>
            <TerminalStatRow label="place" value={reminder.locationTrigger.placeName} tone="cyan" />
            <TerminalStatRow label="coordinates" value={`${reminder.locationTrigger.latitude}, ${reminder.locationTrigger.longitude}`} tone="muted" />
            <TerminalStatRow label="radius" value={`${reminder.locationTrigger.radiusMeters}m`} tone="green" />
            <TerminalStatRow label="condition" value={`${reminder.locationTrigger.triggerType}_signal`} tone="cyan" />
          </>
        ) : null}
        {reminder.habit ? (
          <>
            <TerminalStatRow label="frequency" value={`${reminder.habit.frequencyCount}x ${reminder.habit.frequencyType}`} tone="amber" />
            <TerminalStatRow label="last_done" value={formatDateTime(reminder.habit.lastCompletedAt)} tone="muted" />
            <TerminalStatRow label="next_nudge" value={formatDateTime(reminder.habit.nextDueAt)} tone="cyan" />
          </>
        ) : null}
      </TerminalCard>

      <View style={styles.actions}>
        <TerminalButton onPress={() => actions.complete.mutate(id)}>MARK_DONE</TerminalButton>
        <TerminalButton variant="secondary" onPress={() => actions.snooze.mutate(id)}>SNOOZE</TerminalButton>
        <TerminalButton variant="secondary" onPress={() => router.push({ pathname: "/reminders/new", params: { id } })}>EDIT</TerminalButton>
        <TerminalButton variant="danger" onPress={remove}>DELETE</TerminalButton>
      </View>
    </TerminalScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  title: {
    color: colors.text,
    flex: 1,
    fontFamily: typography.mono,
    fontSize: typography.section,
    fontWeight: "900",
    letterSpacing: 1
  },
  body: {
    color: colors.textMuted,
    fontFamily: typography.mono,
    fontSize: typography.body,
    lineHeight: 23
  }
});
