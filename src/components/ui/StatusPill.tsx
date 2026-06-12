import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@/styles/theme";

type StatusPillProps = {
  label: string;
  tone?: "green" | "cyan" | "amber";
};

export function StatusPill({ label, tone = "green" }: StatusPillProps) {
  const color = tone === "cyan" ? colors.cyan : tone === "amber" ? colors.warning : colors.primary;
  return (
    <View style={styles.pill}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 28
  },
  dot: {
    borderRadius: 4,
    height: 7,
    width: 7
  },
  text: {
    fontFamily: typography.code,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.3,
    textTransform: "uppercase"
  }
});
