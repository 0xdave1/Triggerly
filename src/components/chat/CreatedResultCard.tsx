import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing, typography } from "@/styles/theme";

export function CreatedResultCard({
  title,
  blocked,
  message
}: {
  title: string;
  blocked?: boolean;
  message?: string;
}) {
  return (
    <View style={[styles.card, blocked && styles.blocked]}>
      <Ionicons
        color={blocked ? colors.warning : colors.primary}
        name={blocked ? "lock-closed-outline" : "checkmark-circle-outline"}
        size={20}
      />
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "flex-start",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md
  },
  blocked: {
    borderColor: colors.warning
  },
  copy: {
    flex: 1,
    gap: 3
  },
  title: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: typography.small,
    fontWeight: "700"
  },
  message: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 12,
    lineHeight: 18
  }
});
