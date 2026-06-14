import { StyleSheet, Text, View } from "react-native";
import type { MemoryItem } from "@/features/memory/types";
import { colors, spacing, typography } from "@/styles/theme";

export function MemoryTimelineCard({ item }: { item: MemoryItem }) {
  return (
    <View style={styles.row}>
      <View style={styles.dot} />
      <View style={styles.content}>
        <Text style={styles.meta}>{item.type} · {new Date(item.createdAt).toLocaleDateString()}</Text>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.body}>{item.body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.md },
  dot: { backgroundColor: colors.primary, borderRadius: 5, height: 10, marginTop: 5, width: 10 },
  content: { borderBottomColor: colors.border, borderBottomWidth: 1, flex: 1, gap: spacing.xs, paddingBottom: spacing.md },
  meta: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 11, textTransform: "capitalize" },
  title: { color: colors.text, fontFamily: typography.sans, fontSize: typography.body, fontWeight: "700" },
  body: { color: colors.textMuted, fontFamily: typography.sans, fontSize: typography.small, lineHeight: 19 }
});
