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
        <TerminalHeader title="Reminder not found" subtitle="This reminder may have been deleted or is unavailable." status="unavailable" />
        <TerminalCard title="error">
          <Text style={styles.body}>reminder_not_found · it may have been deleted</Text>
          <TerminalButton onPress={() => router.replace("/(tabs)/triggers")}>Back to triggers</TerminalButton>
        </TerminalCard>
      </TerminalScreen>
    );
  }

  if (!reminder) {
    return (
      <TerminalScreen>
        <Text style={styles.body}>Loading reminder...</Text>
      </TerminalScreen>
    );
  }

  return (
    <TerminalScreen>
      <TerminalHeader title={reminder.title} subtitle="This reminder runs only when its chosen condition matches." status={reminder.status} />
      <TerminalCard title={`${reminder.type} reminder`} active={reminder.status === "active"}>
        <View style={styles.header}>
          <Text style={styles.title}>{reminder.title}</Text>
          <TerminalBadge label={reminder.status === "active" ? "armed" : reminder.status} tone={reminder.status === "snoozed" ? "amber" : reminder.status === "completed" ? "grey" : "green"} />
        </View>
        {reminder.notes ? <Text style={styles.body}>{reminder.notes}</Text> : null}
        <TerminalStatRow label="Type" value={reminder.type} tone="cyan" />
        <TerminalStatRow label="status" value={reminder.status === "active" ? "armed" : reminder.status} tone="green" />
      </TerminalCard>

      <TerminalCard title="Details">
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
        <TerminalButton onPress={() => actions.complete.mutate(id)}>Mark done</TerminalButton>
        <TerminalButton variant="secondary" onPress={() => actions.snooze.mutate(id)}>Snooze</TerminalButton>
        <TerminalButton variant="secondary" onPress={() => router.push({ pathname: "/reminders/new", params: { id } })}>Edit</TerminalButton>
        <TerminalButton variant="danger" onPress={remove}>Delete</TerminalButton>
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
