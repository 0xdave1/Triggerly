import { StyleSheet, Text, View } from "react-native";
import { GlowText } from "@/components/ui/GlowText";
import { TerminalCard } from "@/components/ui/TerminalCard";
import { TerminalStatRow } from "@/components/ui/TerminalStatRow";
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
  const nextTime = active.find((reminder) => reminder.timeTrigger)?.timeTrigger?.triggerDateTime;

  return (
    <TerminalCard title="ACTIVE MEMORY QUEUE" active>
      <View style={styles.center}>
        <GlowText pulse style={styles.count}>
          {String(active.length).padStart(2, "0")}
        </GlowText>
        <Text style={styles.status}>SECURED · USER-DEFINED · READY</Text>
      </View>
      <TerminalStatRow label="location_triggers" value={`${locationCount} armed`} tone="cyan" />
      <TerminalStatRow label="time_triggers" value={`${timeCount} scheduled`} tone="green" />
      <TerminalStatRow label="habit_loops" value={`${habitCount} active`} tone="amber" />
      <TerminalStatRow label="next_trigger" value={nextTime ? new Date(nextTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "none"} tone="cyan" />
      <TerminalStatRow label="privacy_mode" value="enabled" tone="green" />
      <TerminalStatRow label="background_audio" value="disabled" tone="muted" />
    </TerminalCard>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md
  },
  count: {
    fontSize: 72,
    lineHeight: 82
  },
  status: {
    color: colors.textMuted,
    fontFamily: typography.mono,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2.2,
    textAlign: "center"
  }
});
