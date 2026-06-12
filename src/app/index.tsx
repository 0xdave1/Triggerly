import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ActiveTriggerPanel } from "@/components/reminders/ActiveTriggerPanel";
import { QuickTriggerInput } from "@/components/reminders/QuickTriggerInput";
import { ReminderEmptyState } from "@/components/reminders/ReminderEmptyState";
import { ReminderTerminalCard } from "@/components/reminders/ReminderTerminalCard";
import { TerminalCard } from "@/components/ui/TerminalCard";
import { TerminalHeader } from "@/components/ui/TerminalHeader";
import { TerminalScreen } from "@/components/ui/TerminalScreen";
import { useActionPrompts } from "@/features/action-prompts/hooks";
import { useMemoryItems } from "@/features/memory/hooks";
import { useForegroundDueReminders } from "@/features/reminders/dueWatcher";
import { useReminderActions, useReminders } from "@/features/reminders/hooks";
import { getTodayReminders, parseReminderInput } from "@/features/reminders/utils";
import { getFriendlyApiError } from "@/lib/apiClient";
import { colors, spacing, typography } from "@/styles/theme";

const destinations = [
  { label: "New reminder", detail: "Time, place or habit", icon: "add-outline", route: "/reminders/new" },
  { label: "All triggers", detail: "Review what is active", icon: "notifications-outline", route: "/triggers" },
  { label: "Memory", detail: "Things you approved", icon: "bookmark-outline", route: "/memory" },
  { label: "Live context", detail: "Weather, rates and prices", icon: "pulse-outline", route: "/live-context" },
  { label: "Actions", detail: "Drafts that need approval", icon: "checkmark-circle-outline", route: "/actions" },
  { label: "Privacy", detail: "Your controls", icon: "shield-checkmark-outline", route: "/settings" }
] as const;

export default function HomeScreen() {
  const [quickInput, setQuickInput] = useState("");
  const remindersQuery = useReminders();
  const memoryQuery = useMemoryItems({ status: "active" });
  const actionsQuery = useActionPrompts({ status: "pending_confirmation" });
  const reminderActions = useReminderActions();
  const reminders = remindersQuery.data ?? [];
  useForegroundDueReminders(reminders);

  const today = useMemo(() => getTodayReminders(reminders), [reminders]);
  const upcoming = today.length ? today.slice(0, 3) : reminders.filter((item) => item.status === "active").slice(0, 3);

  const parseIntent = () => {
    const parsed = parseReminderInput(quickInput);
    router.push({ pathname: "/triggers/confirm", params: { input: parsed.title } });
  };

  return (
    <TerminalScreen>
      <TerminalHeader
        title="Remember less. Live more."
        subtitle="Tell Triggerly once. It brings the right thing back at the right time or place."
        status="private by design"
      />

      <View style={styles.hero}>
        <Text style={styles.eyebrow}>YOUR PRIVATE ASSISTANT</Text>
        <Text style={styles.heroTitle}>
          Say it once.
          {"\n"}
          <Text style={styles.heroAccent}>We will remember.</Text>
        </Text>
        <Text style={styles.heroBody}>No background listening. No hidden tracking. Every memory and action stays under your control.</Text>
      </View>

      <TerminalCard title="Create with natural language" active>
        <QuickTriggerInput value={quickInput} onChangeText={setQuickInput} onSubmit={parseIntent} />
        <Text style={styles.hint}>Try: “When I leave home, remind me to take my charger.”</Text>
      </TerminalCard>

      <View style={styles.destinationList}>
        {destinations.map((item) => (
          <Pressable
            accessibilityRole="button"
            key={item.label}
            onPress={() => router.push(item.route as never)}
            style={({ pressed }) => [styles.destination, pressed && styles.destinationPressed]}
          >
            <View style={styles.destinationIcon}>
              <Ionicons color={colors.primary} name={item.icon} size={19} />
            </View>
            <View style={styles.destinationText}>
              <Text style={styles.destinationLabel}>{item.label}</Text>
              <Text style={styles.destinationDetail}>{item.detail}</Text>
            </View>
            <Ionicons color={colors.textMuted} name="arrow-forward-outline" size={18} />
          </Pressable>
        ))}
      </View>

      <ActiveTriggerPanel reminders={reminders} />

      <View style={styles.threeStats}>
        <SimpleStat label="memories" value={String(memoryQuery.data?.length ?? 0)} />
        <SimpleStat label="needs approval" value={String(actionsQuery.data?.length ?? 0)} />
        <SimpleStat label="due today" value={String(today.length)} />
      </View>

      <TerminalCard title={today.length ? "Today" : "Upcoming"}>
        {remindersQuery.isLoading ? <Text style={styles.hint}>Loading reminders...</Text> : null}
        {remindersQuery.error ? <Text style={styles.error}>{getFriendlyApiError(remindersQuery.error)}</Text> : null}
        {!remindersQuery.isLoading && upcoming.length === 0 ? <ReminderEmptyState /> : null}
        {upcoming.map((reminder) => (
          <ReminderTerminalCard
            key={reminder.id}
            reminder={reminder}
            onPress={() => router.push(`/reminders/${reminder.id}`)}
            onComplete={() => reminderActions.complete.mutate(reminder.id)}
            onSnooze={() => reminderActions.snooze.mutate(reminder.id)}
          />
        ))}
      </TerminalCard>

      <View style={styles.footer}>
        <Ionicons color={colors.success} name="lock-closed-outline" size={14} />
        <Text style={styles.footerText}>User-defined triggers only. Sensitive actions always require approval.</Text>
      </View>
    </TerminalScreen>
  );
}

function SimpleStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.simpleStat}>
      <Text style={styles.simpleStatValue}>{value}</Text>
      <Text style={styles.simpleStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.md,
    paddingVertical: spacing.xl
  },
  eyebrow: {
    color: colors.success,
    fontFamily: typography.code,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.8
  },
  heroTitle: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 46,
    fontWeight: "800",
    lineHeight: 50
  },
  heroAccent: {
    color: colors.textMuted
  },
  heroBody: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: typography.body,
    lineHeight: 25,
    maxWidth: 560
  },
  hint: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: typography.small,
    lineHeight: 19
  },
  destinationList: {
    borderTopColor: colors.border,
    borderTopWidth: 1
  },
  destination: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 72,
    paddingVertical: spacing.md
  },
  destinationPressed: {
    opacity: 0.62
  },
  destinationIcon: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 36
  },
  destinationText: {
    flex: 1,
    gap: 3
  },
  destinationLabel: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: typography.body,
    fontWeight: "700"
  },
  destinationDetail: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: typography.small
  },
  threeStats: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.lg
  },
  simpleStat: {
    flex: 1,
    gap: spacing.xs
  },
  simpleStatValue: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 24,
    fontWeight: "800"
  },
  simpleStatLabel: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 11,
    textTransform: "uppercase"
  },
  error: {
    color: colors.danger,
    fontFamily: typography.sans,
    fontSize: typography.small
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.lg
  },
  footerText: {
    color: colors.textMuted,
    flex: 1,
    fontFamily: typography.sans,
    fontSize: 11,
    lineHeight: 18
  }
});
