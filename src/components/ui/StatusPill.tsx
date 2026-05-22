import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing, typography } from "@/styles/theme";

type StatusPillProps = {
  label: string;
  tone?: "green" | "cyan" | "amber";
};

export function StatusPill({ label, tone = "green" }: StatusPillProps) {
  const color = tone === "cyan" ? colors.cyan : tone === "amber" ? colors.warning : colors.primary;
  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    minHeight: 32,
    paddingHorizontal: spacing.sm
  },
  dot: {
    borderRadius: 4,
    height: 7,
    width: 7
  },
  text: {
    fontFamily: typography.mono,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase"
  }
});
