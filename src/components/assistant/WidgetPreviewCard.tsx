import { StyleSheet, Text, View } from "react-native";
import type { WidgetSummary } from "@/features/assistant/types";
import { colors, radii, spacing, typography } from "@/styles/theme";

export function WidgetPreviewCard({ summary }: { summary?: WidgetSummary }) {
  return (
    <View style={styles.preview}>
      <Text style={styles.label}>Widget preview</Text>
      <Text style={styles.title}>{summary?.nextTrigger?.title ?? "No next trigger"}</Text>
      <Text style={styles.body}>{summary?.pendingActions ?? 0} pending actions · {summary?.accountabilityGoals ?? 0} active goals</Text>
      <Text style={styles.note}>Preview only. Native home-screen widgets require an EAS development build and platform extension.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  preview: { backgroundColor: colors.surfaceMuted, borderColor: colors.border, borderRadius: radii.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.lg },
  label: { color: colors.cyan, fontFamily: typography.sans, fontSize: 11, fontWeight: "700" },
  title: { color: colors.text, fontFamily: typography.sans, fontSize: 18, fontWeight: "800" },
  body: { color: colors.textMuted, fontFamily: typography.sans, fontSize: typography.small },
  note: { color: colors.warning, fontFamily: typography.sans, fontSize: 11, lineHeight: 17 }
});
