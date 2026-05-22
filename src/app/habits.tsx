import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { HabitLoopCard } from "@/components/reminders/HabitLoopCard";
import { TerminalButton } from "@/components/ui/TerminalButton";
import { TerminalCard } from "@/components/ui/TerminalCard";
import { TerminalHeader } from "@/components/ui/TerminalHeader";
import { TerminalScreen } from "@/components/ui/TerminalScreen";
import { useReminderActions, useReminders } from "@/features/reminders/hooks";
import { colors, spacing, typography } from "@/styles/theme";

export default function HabitScreen() {
  const remindersQuery = useReminders();
  const actions = useReminderActions();
  const habits = (remindersQuery.data ?? []).filter((reminder) => reminder.type === "habit" && reminder.status !== "deleted");

  return (
    <TerminalScreen>
      <TerminalHeader title="habit_loop.config" subtitle="routine nudges · user-defined cadence" status="system: armed" />
      <View style={styles.row}>
        <TerminalButton variant="secondary" onPress={() => router.push("/reminders/new")}>
          NEW_HABIT_LOOP
        </TerminalButton>
      </View>

      {habits.length === 0 ? (
        <TerminalCard title="habit_queue_empty">
          <Text style={styles.body}>no_habit_loops · create daily, weekly, monthly, or custom cadence</Text>
        </TerminalCard>
      ) : null}

      {habits.map((reminder) => (
        <HabitLoopCard key={reminder.id} reminder={reminder} onDone={() => actions.complete.mutate(reminder.id)} />
      ))}
    </TerminalScreen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  body: {
    color: colors.textMuted,
    fontFamily: typography.mono,
    fontSize: typography.body,
    lineHeight: 23
  }
});
