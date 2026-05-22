import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@/styles/theme";

type TerminalStatRowProps = {
  label: string;
  value: string;
  tone?: "green" | "cyan" | "amber" | "muted";
};

export function TerminalStatRow({ label, value, tone = "green" }: TerminalStatRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, toneStyles[tone]]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    minHeight: 42
  },
  label: {
    color: colors.textMuted,
    flex: 1,
    fontFamily: typography.mono,
    fontSize: typography.small
  },
  value: {
    flex: 1,
    fontFamily: typography.mono,
    fontSize: typography.small,
    fontWeight: "900",
    textAlign: "right"
  }
});

const toneStyles = {
  green: { color: colors.primary },
  cyan: { color: colors.cyan },
  amber: { color: colors.warning },
  muted: { color: colors.textMuted }
};
