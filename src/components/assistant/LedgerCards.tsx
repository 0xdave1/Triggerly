import { StyleSheet, Text, View } from "react-native";
import { TerminalButton } from "@/components/ui/TerminalButton";
import type { AccountabilityGoal, DebtItem, FollowUpSuggestion, PriceItem, PromiseItem, TravelPlan } from "@/features/assistant/types";
import { colors, spacing, typography } from "@/styles/theme";

function Shell({ eyebrow, title, detail, children }: { eyebrow: string; title: string; detail: string; children?: React.ReactNode }) {
  return <View style={styles.card}><Text style={styles.eyebrow}>{eyebrow}</Text><Text style={styles.title}>{title}</Text><Text style={styles.detail}>{detail}</Text>{children}</View>;
}

export const PromiseCard = ({ item, onComplete }: { item: PromiseItem; onComplete: () => void }) => (
  <Shell eyebrow={item.status} title={`${item.taskTitle} · ${item.personName}`} detail={item.deadline ? `Due ${new Date(item.deadline).toLocaleDateString()}` : "No deadline"}>
    {item.status !== "COMPLETED" ? <TerminalButton variant="secondary" onPress={onComplete}>Mark complete</TerminalButton> : null}
  </Shell>
);

export const DebtFavourCard = ({ item, onSettle }: { item: DebtItem; onSettle: () => void }) => (
  <Shell eyebrow={item.direction === "OWED_TO_ME" ? "Owed to me" : "I owe"} title={item.personName} detail={`${item.currency} ${Number(item.amount).toLocaleString("en-NG")}`}>
    {item.status === "PENDING" ? <TerminalButton variant="secondary" onPress={onSettle}>Mark settled</TerminalButton> : null}
  </Shell>
);

export const PriceMemoryCard = ({ item }: { item: PriceItem }) => (
  <Shell eyebrow="Price memory" title={item.itemName} detail={`${item.currency} ${Number(item.price).toLocaleString("en-NG")}${item.placeName ? ` · ${item.placeName}` : ""}`} />
);

export const TravelModeCard = ({ item, onChecklist }: { item: TravelPlan; onChecklist: () => void }) => (
  <Shell eyebrow={item.status} title={item.destination} detail={`${item.checklistItems.length} checklist items · weather ${item.weatherAlertsEnabled ? "on" : "off"}`}>
    <TerminalButton variant="secondary" onPress={onChecklist}>Prepare checklist</TerminalButton>
  </Shell>
);

export const AccountabilityGoalCard = ({ item, onDone, onSnooze }: { item: AccountabilityGoal; onDone: () => void; onSnooze: () => void }) => (
  <Shell eyebrow={`${item.strictness} · ${item.frequencyType}`} title={item.title} detail={item.description ?? "Keep showing up consistently."}>
    <View style={styles.actions}><TerminalButton onPress={onDone}>Done today</TerminalButton><TerminalButton variant="secondary" onPress={onSnooze}>Snooze</TerminalButton></View>
  </Shell>
);

export const FollowUpSuggestionCard = ({ item, onAccept, onDismiss }: { item: FollowUpSuggestion; onAccept: () => void; onDismiss: () => void }) => (
  <Shell eyebrow="Suggested next step" title={item.title} detail={item.description}>
    <View style={styles.actions}><TerminalButton onPress={onAccept}>Review</TerminalButton><TerminalButton variant="ghost" onPress={onDismiss}>Dismiss</TerminalButton></View>
  </Shell>
);

const styles = StyleSheet.create({
  card: { borderBottomColor: colors.border, borderBottomWidth: 1, gap: spacing.sm, paddingBottom: spacing.lg },
  eyebrow: { color: colors.cyan, fontFamily: typography.sans, fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  title: { color: colors.text, fontFamily: typography.sans, fontSize: typography.body, fontWeight: "800" },
  detail: { color: colors.textMuted, fontFamily: typography.sans, fontSize: typography.small, lineHeight: 19 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }
});
