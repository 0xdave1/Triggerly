import { StyleSheet, Text, View } from "react-native";
import type { AgentPlan } from "@/features/chat/types";
import { colors, spacing, typography } from "@/styles/theme";
import { AgentPlanItemCard } from "./AgentPlanItemCard";
import { ClarificationCard } from "./ClarificationCard";
import { ConfirmationActions } from "./ConfirmationActions";

export function AgentPlanCard({
  plan,
  onConfirmAll,
  onRejectAll,
  onConfirmItem,
  onRejectItem,
  onEditDetails,
  onEnableFeature,
  busy
}: {
  plan: AgentPlan;
  onConfirmAll: () => void;
  onRejectAll: () => void;
  onConfirmItem: (itemId: string) => void;
  onRejectItem: (itemId: string) => void;
  onEditDetails: (itemId: string) => void;
  onEnableFeature: () => void;
  busy?: boolean;
}) {
  const proposed = plan.items.filter((item) => item.status === "proposed" && item.requiresConfirmation);
  return (
    <View style={styles.plan}>
      <Text style={styles.label}>Plan ready</Text>
      <Text style={styles.summary}>{plan.summary}</Text>
      {plan.items.map((item) =>
        item.type === "ask_clarification" ? (
          <ClarificationCard key={item.id} question={item.description} />
        ) : (
          <AgentPlanItemCard
            key={item.id}
            item={item}
            busy={busy}
            onConfirm={() => onConfirmItem(item.id)}
            onReject={() => onRejectItem(item.id)}
            onEditDetails={() => onEditDetails(item.id)}
            onEnableFeature={onEnableFeature}
          />
        )
      )}
      {proposed.length > 1 && plan.requiresConfirmation ? (
        <ConfirmationActions
          confirming={busy}
          disabled={proposed.some((item) => Boolean(item.payload.blockedBy))}
          onConfirm={onConfirmAll}
          onReject={onRejectAll}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  plan: {
    borderLeftColor: colors.cyan,
    borderLeftWidth: 2,
    gap: spacing.md,
    marginLeft: spacing.sm,
    paddingLeft: spacing.md
  },
  label: {
    color: colors.cyan,
    fontFamily: typography.sans,
    fontSize: 12,
    fontWeight: "700"
  },
  summary: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: typography.body,
    fontWeight: "700",
    lineHeight: 23
  }
});
