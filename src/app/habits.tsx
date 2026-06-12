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
      <TerminalHeader title="Habits" subtitle="Routine reminders using a schedule you choose." status="active" />
      <View style={styles.row}>
        <TerminalButton variant="secondary" onPress={() => router.push("/reminders/new")}>
          Create habit
        </TerminalButton>
      </View>

      {habits.length === 0 ? (
        <TerminalCard title="No habits yet">
          <Text style={styles.body}>Create a daily, weekly, monthly, or custom reminder.</Text>
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
