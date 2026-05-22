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
    fontFamily: typography.mono,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase"
  }
});

const toneStyles = {
  green: { box: { borderColor: colors.primary, backgroundColor: "rgba(0,255,102,0.06)" }, text: { color: colors.primary } },
  cyan: { box: { borderColor: colors.cyan, backgroundColor: "rgba(24,216,255,0.06)" }, text: { color: colors.cyan } },
  amber: { box: { borderColor: colors.warning, backgroundColor: "rgba(255,184,46,0.06)" }, text: { color: colors.warning } },
  grey: { box: { borderColor: colors.textMuted, backgroundColor: "rgba(109,117,109,0.08)" }, text: { color: colors.textMuted } },
  red: { box: { borderColor: colors.danger, backgroundColor: "rgba(255,77,77,0.06)" }, text: { color: colors.danger } }
};
