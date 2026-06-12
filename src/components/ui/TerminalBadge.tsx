import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing, typography } from "@/styles/theme";

type BadgeTone = "green" | "cyan" | "amber" | "grey" | "red";

type TerminalBadgeProps = {
  label: string;
  tone?: BadgeTone;
};

export function TerminalBadge({ label, tone = "green" }: TerminalBadgeProps) {
  return (
    <View style={[styles.badge, toneStyles[tone].box]}>
      <Text style={[styles.text, toneStyles[tone].text]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: radii.sm,
    borderWidth: 1,
    minHeight: 28,
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  text: {
    fontFamily: typography.sans,
    fontSize: 11,
    fontWeight: "700"
  }
});

const toneStyles = {
  green: { box: { borderColor: colors.primary, backgroundColor: colors.surfaceRaised }, text: { color: colors.primary } },
  cyan: { box: { borderColor: colors.cyan, backgroundColor: colors.surfaceRaised }, text: { color: colors.cyan } },
  amber: { box: { borderColor: colors.warning, backgroundColor: colors.surfaceRaised }, text: { color: colors.warning } },
  grey: { box: { borderColor: colors.textMuted, backgroundColor: colors.surfaceMuted }, text: { color: colors.textMuted } },
  red: { box: { borderColor: colors.danger, backgroundColor: colors.surfaceRaised }, text: { color: colors.danger } }
};
