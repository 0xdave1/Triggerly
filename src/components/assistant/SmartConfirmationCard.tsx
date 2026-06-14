import { StyleSheet, Text, View } from "react-native";
import type { AgentPlan, AgentPlanItem } from "@/features/chat/types";
import { colors, spacing, typography } from "@/styles/theme";
import { AgentPlanCard } from "@/components/chat/AgentPlanCard";

export function SmartConfirmationCard(props: {
  plan: AgentPlan;
  busy?: boolean;
  onConfirmAll: () => void;
  onRejectAll: () => void;
  onConfirmItem: (itemId: string) => void;
  onRejectItem: (itemId: string) => void;
  onEditDetails: (itemId: string) => void;
  onEnableFeature: () => void;
}) {
  const first = props.plan.items[0];
  return (
    <View style={styles.wrap}>
      {first ? <ConfirmationFieldPreview item={first} /> : null}
      <AgentPlanCard {...props} />
    </View>
  );
}

export function ConfirmationRiskBadge({ item }: { item: AgentPlanItem }) {
  return <Text style={[styles.risk, item.sensitive && styles.sensitive]}>{item.riskLevel.toUpperCase()}</Text>;
}

export function ConfirmationFieldPreview({ item }: { item: AgentPlanItem }) {
  const permission = typeof item.payload.blockedBy === "string" ? item.payload.blockedBy : item.sensitive ? "Explicit approval" : "None beyond confirmation";
  return (
    <View style={styles.preview}>
      <View style={styles.line}><Text style={styles.key}>Detected intent</Text><Text style={styles.value}>{item.type.replace(/_/g, " ")}</Text></View>
      <View style={styles.line}><Text style={styles.key}>Permission</Text><Text style={styles.value}>{permission}</Text></View>
      <View style={styles.line}><Text style={styles.key}>Delivery</Text><Text style={styles.value}>{String(item.payload.deliveryMode ?? "push")}</Text></View>
      <View style={styles.line}><Text style={styles.key}>Voice</Text><Text style={styles.value}>{item.payload.voiceEnabled ? "enabled" : "off"}</Text></View>
      <ConfirmationRiskBadge item={item} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  preview: { borderBottomColor: colors.border, borderBottomWidth: 1, gap: spacing.sm, paddingBottom: spacing.md },
  line: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md },
  key: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 12 },
  value: { color: colors.text, flex: 1, fontFamily: typography.sans, fontSize: 12, textAlign: "right" },
  risk: { alignSelf: "flex-start", color: colors.cyan, fontFamily: typography.sans, fontSize: 11, fontWeight: "800" },
  sensitive: { color: colors.warning }
});
