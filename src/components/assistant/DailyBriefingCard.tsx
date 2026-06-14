import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import type { Briefing } from "@/features/assistant/types";
import { colors, radii, spacing, typography } from "@/styles/theme";

export function DailyBriefingCard({ briefing, loading }: { briefing?: Briefing; loading?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push("/briefing")} style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.label}>Daily briefing</Text>
        <Text style={styles.open}>Open</Text>
      </View>
      <Text style={styles.title}>{loading ? "Preparing your day..." : briefing?.title ?? "Your day, at a glance"}</Text>
      <Text style={styles.body}>{briefing?.summary ?? "Review active triggers, promises, actions, and travel context."}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surfaceMuted, borderColor: colors.border, borderRadius: radii.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.lg },
  row: { flexDirection: "row", justifyContent: "space-between" },
  label: { color: colors.cyan, fontFamily: typography.sans, fontSize: 12, fontWeight: "700" },
  open: { color: colors.primary, fontFamily: typography.sans, fontSize: 12, fontWeight: "700" },
  title: { color: colors.text, fontFamily: typography.sans, fontSize: 18, fontWeight: "800" },
  body: { color: colors.textMuted, fontFamily: typography.sans, fontSize: typography.small, lineHeight: 20 }
});
