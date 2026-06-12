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
    minHeight: 48
  },
  label: {
    color: colors.textMuted,
    flex: 1,
    fontFamily: typography.sans,
    fontSize: typography.small
  },
  value: {
    flex: 1,
    fontFamily: typography.sans,
    fontSize: typography.small,
    fontWeight: "700",
    textAlign: "right"
  }
});

const toneStyles = {
  green: { color: colors.text },
  cyan: { color: colors.cyan },
  amber: { color: colors.warning },
  muted: { color: colors.textMuted }
};
