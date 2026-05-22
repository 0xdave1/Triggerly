import { Pressable, StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getReminderTriggerSummary } from "@/features/reminders/utils";
import type { ReminderWithTriggers } from "@/features/reminders/types";
import { colors, spacing, typography } from "@/styles/theme";

type ReminderCardProps = {
  reminder: ReminderWithTriggers;
  onPress?: () => void;
  onComplete?: () => void;
};

export function ReminderCard({ reminder, onPress, onComplete }: ReminderCardProps) {
  return (
    <Pressable onPress={onPress}>
      <Card>
        <View style={styles.header}>
          <View style={styles.titleGroup}>
            <Text style={styles.type}>{reminder.type.toUpperCase()}</Text>
            <Text style={styles.title}>{reminder.title}</Text>
          </View>
          <Text style={styles.status}>{reminder.status}</Text>
        </View>
        {reminder.notes ? <Text style={styles.notes}>{reminder.notes}</Text> : null}
        <Text style={styles.summary}>{getReminderTriggerSummary(reminder)}</Text>
        {onComplete && reminder.status !== "completed" ? (
          <Button variant="secondary" onPress={onComplete}>
            Mark as done
          </Button>
        ) : null}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  titleGroup: {
    flex: 1,
    gap: spacing.xs
  },
  type: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800"
  },
  title: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800"
  },
  status: {
    color: colors.textMuted,
    fontSize: typography.small,
    fontWeight: "700"
  },
  notes: {
    color: colors.textMuted,
    fontSize: typography.body,
    lineHeight: 22
  },
  summary: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: "700"
  }
});
