import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { ActiveTriggerPanel } from "@/components/reminders/ActiveTriggerPanel";
import { QuickTriggerInput } from "@/components/reminders/QuickTriggerInput";
import { ReminderEmptyState } from "@/components/reminders/ReminderEmptyState";
import { ReminderFilters } from "@/components/reminders/ReminderFilters";
import { ReminderTerminalCard } from "@/components/reminders/ReminderTerminalCard";
import { TerminalButton } from "@/components/ui/TerminalButton";
import { TerminalCard } from "@/components/ui/TerminalCard";
import { TerminalHeader } from "@/components/ui/TerminalHeader";
import { TerminalScreen } from "@/components/ui/TerminalScreen";
import { useReminderActions, useReminders } from "@/features/reminders/hooks";
import { filterReminders, getTodayReminders, parseReminderInput, type ReminderFilter } from "@/features/reminders/utils";
import { groupErrandsByLocation } from "@/features/errands/grouping";
import { getFriendlyApiError } from "@/lib/apiClient";
import { colors, spacing, typography } from "@/styles/theme";

export default function HomeScreen() {
  const [filter, setFilter] = useState<ReminderFilter>("all");
  const [quickInput, setQuickInput] = useState("");
  const remindersQuery = useReminders();
  const actions = useReminderActions();

  const reminders = remindersQuery.data ?? [];
  const visibleReminders = useMemo(() => filterReminders(reminders, filter), [filter, reminders]);
  const todayReminders = useMemo(() => getTodayReminders(reminders), [reminders]);
  const errandGroups = useMemo(() => groupErrandsByLocation(reminders), [reminders]);

  const addQuickReminder = () => {
    const parsed = parseReminderInput(quickInput);
    router.push({ pathname: "/triggers/confirm", params: { input: parsed.title } });
  };

  return (
    <TerminalScreen>
      <TerminalHeader />
      <ActiveTriggerPanel reminders={reminders} />
      <QuickTriggerInput value={quickInput} onChangeText={setQuickInput} onSubmit={addQuickReminder} />

      <View style={styles.navRow}>
        <TerminalButton variant="secondary" onPress={() => router.push("/reminders/new")}>
          new_trigger
        </TerminalButton>
        <TerminalButton variant="ghost" onPress={() => router.push("/habits")}>
          habit_loop
        </TerminalButton>
        <TerminalButton variant="ghost" onPress={() => router.push("/settings")}>
          privacy.config
        </TerminalButton>
      </View>

      <TerminalCard title="today.queue" tone="cyan">
        {remindersQuery.isLoading ? <Text style={styles.muted}>loading_reminder_queue...</Text> : null}
        {remindersQuery.error ? <Text style={styles.error}>{getFriendlyApiError(remindersQuery.error)}</Text> : null}
        {todayReminders.length === 0 ? <Text style={styles.muted}>queue_empty · no triggers due today</Text> : null}
        {todayReminders.map((reminder) => (
          <ReminderTerminalCard
            key={reminder.id}
            reminder={reminder}
            onPress={() => router.push(`/reminders/${reminder.id}`)}
            onComplete={() => actions.complete.mutate(reminder.id)}
            onSnooze={() => actions.snooze.mutate(reminder.id)}
          />
        ))}
      </TerminalCard>

      {errandGroups.length > 0 ? (
        <TerminalCard title="errand_groups.by_location" tone="cyan">
          {errandGroups.map((group) => (
            <TerminalCard key={group.placeName} title={`${group.placeName}.tasks_here`} active>
              <Text style={styles.sectionTitle}>{group.reminders.length} tasks here</Text>
              {group.reminders.map((reminder) => (
                <Text key={reminder.id} style={styles.muted}>
                  - {reminder.title}
                </Text>
              ))}
              <Text style={styles.muted}>{group.voiceScript}</Text>
            </TerminalCard>
          ))}
        </TerminalCard>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>active_triggers</Text>
        <ReminderFilters value={filter} onChange={setFilter} />
      </View>

      {visibleReminders.length === 0 ? <ReminderEmptyState /> : null}
      {visibleReminders.map((reminder) => (
        <ReminderTerminalCard
          key={reminder.id}
          reminder={reminder}
          onPress={() => router.push(`/reminders/${reminder.id}`)}
          onComplete={() => actions.complete.mutate(reminder.id)}
          onSnooze={() => actions.snooze.mutate(reminder.id)}
        />
      ))}
    </TerminalScreen>
  );
}

const styles = StyleSheet.create({
  navRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  sectionHeader: {
    gap: spacing.md
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: typography.mono,
    fontSize: typography.section,
    fontWeight: "900",
    letterSpacing: typography.letterSpacing,
    textTransform: "uppercase"
  },
  muted: {
    color: colors.textMuted,
    fontFamily: typography.mono,
    fontSize: typography.small,
    lineHeight: 20
  },
  error: {
    color: colors.danger,
    fontFamily: typography.mono,
    fontSize: typography.small,
    lineHeight: 20
  }
});
