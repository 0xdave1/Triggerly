import { StyleSheet, Text, View } from "react-native";
import { TerminalCard } from "@/components/ui/TerminalCard";
import type { ReminderWithTriggers } from "@/features/reminders/types";
import { colors, spacing, typography } from "@/styles/theme";

type ActiveTriggerPanelProps = {
  reminders: ReminderWithTriggers[];
};

export function ActiveTriggerPanel({ reminders }: ActiveTriggerPanelProps) {
  const active = reminders.filter((reminder) => reminder.status === "active" || reminder.status === "snoozed");
  const locationCount = active.filter((reminder) => reminder.type === "location").length;
  const timeCount = active.filter((reminder) => reminder.type === "time").length;
  const habitCount = active.filter((reminder) => reminder.type === "habit").length;

  return (
    <TerminalCard title="Your overview" active>
      <View style={styles.summary}>
        <View style={styles.primaryStat}>
          <Text style={styles.count}>{active.length}</Text>
          <Text style={styles.caption}>active reminders</Text>
        </View>
        <View style={styles.breakdown}>
          <Stat value={timeCount} label="time" />
          <Stat value={locationCount} label="location" />
          <Stat value={habitCount} label="habits" />
        </View>
      </View>
    </TerminalCard>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.caption}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: spacing.xl,
    justifyContent: "space-between"
  },
  primaryStat: {
    gap: spacing.xs
  },
  count: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 56,
    fontWeight: "800",
    lineHeight: 60
  },
  caption: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: typography.small
  },
  breakdown: {
    flexDirection: "row",
    gap: spacing.xl
  },
  stat: {
    alignItems: "flex-end",
    gap: spacing.xs
  },
  statValue: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 22,
    fontWeight: "700"
  }
});
