import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { TriggerCard } from "@/components/reminders/TriggerCard";
import { AccountabilityGoalCard, TravelModeCard } from "@/components/assistant/LedgerCards";
import { SmartSnoozeSheet } from "@/components/assistant/SmartSnoozeSheet";
import { TerminalButton } from "@/components/ui/TerminalButton";
import { TerminalCard } from "@/components/ui/TerminalCard";
import { TerminalHeader } from "@/components/ui/TerminalHeader";
import { TerminalScreen } from "@/components/ui/TerminalScreen";
import { TerminalStatRow } from "@/components/ui/TerminalStatRow";
import { useReminderActions, useReminders } from "@/features/reminders/hooks";
import type { ReminderWithTriggers } from "@/features/reminders/types";
import { colors, spacing, typography } from "@/styles/theme";
import { useAccountabilityGoals, useAssistantActions, useTravelPlans } from "@/features/assistant/hooks";

const groups = [
  ["time_triggers", "Time reminders"],
  ["location_triggers", "Location reminders"],
  ["habit_loops", "Habits"],
  ["weather_triggers", "Weather alerts"],
  ["exchange_rate_triggers", "Exchange-rate alerts"],
  ["price_triggers", "Price alerts"],
  ["travel_triggers", "Travel alerts"],
  ["action_prompts", "Prepared actions"]
] as const;

export default function TriggerDashboardScreen() {
  const remindersQuery = useReminders();
  const actions = useReminderActions();
  const reminders = remindersQuery.data ?? [];
  const grouped = useMemo(() => groupReminders(reminders), [reminders]);
  const [snoozeId, setSnoozeId] = useState<string>();
  const travel = useTravelPlans();
  const accountability = useAccountabilityGoals();
  const assistantActions = useAssistantActions();

  return (
    <TerminalScreen>
      <TerminalHeader title="Triggers" subtitle="Everything Triggerly is waiting to remind you about." status="active" />
      <TerminalCard title="Overview" active>
        <TerminalStatRow label="Active" value={String(reminders.filter((item) => item.status === "active").length)} />
        <TerminalStatRow label="Snoozed" value={String(reminders.filter((item) => item.status === "snoozed").length)} tone="amber" />
        <TerminalStatRow label="Voice enabled" value={String(reminders.filter((item) => item.voiceEnabled).length)} tone="cyan" />
      </TerminalCard>

      {groups.map(([group, title]) => (
        <TerminalCard key={group} title={title} tone={group.includes("weather") || group.includes("exchange") ? "cyan" : "green"}>
          {(grouped[group] ?? []).map((reminder) => (
            <TriggerCard
              key={reminder.id}
              reminder={reminder}
              onDone={() => actions.complete.mutate(reminder.id)}
              onSnooze={() => setSnoozeId(reminder.id)}
              onEdit={() => router.push(`/reminders/${reminder.id}`)}
              onDelete={() => actions.delete.mutate(reminder.id)}
            />
          ))}
          {!grouped[group]?.length ? <Text style={styles.empty}>Nothing here yet.</Text> : null}
        </TerminalCard>
      ))}

      <TerminalCard title="Travel mode">
        {(travel.data ?? []).map((item) => <TravelModeCard key={item.id} item={item} onChecklist={() => assistantActions.travelChecklist.mutate(item.id)} />)}
        {!travel.data?.length ? <Text style={styles.empty}>Tell Triggerly about a trip to prepare weather, reminders, and a checklist.</Text> : null}
      </TerminalCard>

      <TerminalCard title="Accountability">
        {(accountability.data ?? []).map((item) => (
          <AccountabilityGoalCard
            key={item.id}
            item={item}
            onDone={() => assistantActions.checkIn.mutate({ id: item.id, status: "DONE" })}
            onSnooze={() => assistantActions.checkIn.mutate({ id: item.id, status: "SNOOZED" })}
          />
        ))}
        {!accountability.data?.length ? <Text style={styles.empty}>Ask Triggerly to help you stay consistent with a routine.</Text> : null}
      </TerminalCard>

      <View style={styles.row}>
        <TerminalButton onPress={() => router.push("/reminders/new")}>Create manually</TerminalButton>
      </View>
      <SmartSnoozeSheet
        visible={Boolean(snoozeId)}
        onClose={() => setSnoozeId(undefined)}
        onSelect={(mode) => {
          if (!snoozeId) return;
          if (["arrival", "departure", "person", "custom"].includes(mode)) {
            setSnoozeId(undefined);
            router.push(`/reminders/${snoozeId}`);
            return;
          }
          assistantActions.smartSnooze.mutate({ id: snoozeId, mode });
          setSnoozeId(undefined);
        }}
      />
    </TerminalScreen>
  );
}

function groupReminders(reminders: ReminderWithTriggers[]): Record<string, ReminderWithTriggers[]> {
  return reminders.reduce<Record<string, ReminderWithTriggers[]>>((acc, reminder) => {
    const key = reminder.type === "time" ? "time_triggers" : reminder.type === "location" ? "location_triggers" : reminder.type === "habit" ? "habit_loops" : "time_triggers";
    acc[key] = [...(acc[key] ?? []), reminder];
    if (reminder.actionType) acc.action_prompts = [...(acc.action_prompts ?? []), reminder];
    return acc;
  }, {});
}

const styles = StyleSheet.create({
  empty: {
    color: colors.textMuted,
    fontFamily: typography.mono,
    fontSize: typography.small
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  }
});
