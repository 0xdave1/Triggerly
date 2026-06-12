import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@/styles/theme";

export function TypingIndicator() {
  return (
    <View style={styles.row}>
      <View style={styles.dot} />
      <Text style={styles.text}>Triggerly is building a plan...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.sm
  },
  dot: {
    backgroundColor: colors.cyan,
    borderRadius: 4,
    height: 7,
    width: 7
  },
  text: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: typography.small
  }
});
