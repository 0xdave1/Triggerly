import { StyleSheet, Text, View } from "react-native";
import { TerminalBadge } from "@/components/ui/TerminalBadge";
import { TerminalButton } from "@/components/ui/TerminalButton";
import type { AgentPlanItem } from "@/features/chat/types";
import { colors, radii, spacing, typography } from "@/styles/theme";

export function AgentPlanItemCard({
  item,
  onConfirm,
  onReject,
  onEditDetails,
  onEnableFeature,
  busy
}: {
  item: AgentPlanItem;
  onConfirm: () => void;
  onReject: () => void;
  onEditDetails: () => void;
  onEnableFeature?: () => void;
  busy?: boolean;
}) {
  const blockedBy = typeof item.payload.blockedBy === "string" ? item.payload.blockedBy : undefined;
  const complete = item.status === "completed";
  return (
    <View style={[styles.card, item.sensitive && styles.sensitive]}>
      <View style={styles.heading}>
        <TerminalBadge
          label={complete ? "completed" : item.riskLevel}
          tone={complete ? "green" : item.riskLevel === "sensitive" ? "amber" : item.riskLevel === "medium" ? "cyan" : "grey"}
        />
        <Text style={styles.type}>{item.type.replace(/_/g, " ")}</Text>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
      {item.sensitive ? (
        <Text style={styles.warning}>
          Sensitive actions stay locked behind your approval. Triggerly never sends money, email, or messages automatically.
        </Text>
      ) : null}
      {item.error ? <Text style={styles.error}>{item.error}</Text> : null}
      {blockedBy ? (
        <TerminalButton variant="secondary" onPress={onEnableFeature}>
          Enable feature
        </TerminalButton>
      ) : item.status === "proposed" && item.requiresConfirmation ? (
        <View style={styles.actions}>
          <TerminalButton loading={busy} onPress={onConfirm}>Confirm</TerminalButton>
          <TerminalButton variant="secondary" onPress={onEditDetails}>Edit details</TerminalButton>
          <TerminalButton variant="ghost" onPress={onReject}>Discard</TerminalButton>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg
  },
  sensitive: {
    borderColor: colors.warning
  },
  heading: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  type: {
    color: colors.textMuted,
    fontFamily: typography.code,
    fontSize: 10,
    textTransform: "uppercase"
  },
  title: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: typography.body,
    fontWeight: "800"
  },
  description: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: typography.small,
    lineHeight: 20
  },
  warning: {
    color: colors.warning,
    fontFamily: typography.sans,
    fontSize: typography.small,
    lineHeight: 20
  },
  error: {
    color: colors.danger,
    fontFamily: typography.sans,
    fontSize: typography.small
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  }
});
