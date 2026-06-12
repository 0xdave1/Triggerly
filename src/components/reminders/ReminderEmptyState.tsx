import { StyleSheet, Text } from "react-native";
import { TerminalCard } from "@/components/ui/TerminalCard";
import { colors, typography } from "@/styles/theme";

export function ReminderEmptyState() {
  return (
    <TerminalCard title="No active reminders">
      <Text style={styles.title}>queue_empty</Text>
      <Text style={styles.body}>create a time, place, or habit trigger when ready</Text>
    </TerminalCard>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.primary,
    fontFamily: typography.mono,
    fontSize: typography.section,
    fontWeight: "900"
  },
  body: {
    color: colors.textMuted,
    fontFamily: typography.mono,
    fontSize: typography.body,
    lineHeight: 22
  }
});
