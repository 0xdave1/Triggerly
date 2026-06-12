import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing, typography } from "@/styles/theme";

export function SensitiveWarning() {
  return (
    <View accessibilityRole="alert" style={styles.warning}>
      <Ionicons color={colors.warning} name="lock-closed-outline" size={18} />
      <Text style={styles.text}>
        This needs your approval. Triggerly never sends money, email, or messages automatically.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  warning: {
    alignItems: "flex-start",
    backgroundColor: colors.surface,
    borderColor: colors.warning,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md
  },
  text: {
    color: colors.warning,
    flex: 1,
    fontFamily: typography.sans,
    fontSize: typography.small,
    lineHeight: 20
  }
});
