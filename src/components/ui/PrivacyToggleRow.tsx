import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing, typography } from "@/styles/theme";

type PrivacyToggleRowProps = {
  label: string;
  value: boolean;
  description?: string;
  onToggle: () => void;
};

export function PrivacyToggleRow({ label, value, description, onToggle }: PrivacyToggleRowProps) {
  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: value }} onPress={onToggle} style={styles.row}>
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <View style={[styles.switch, value && styles.switchOn]}>
        <View style={[styles.thumb, value && styles.thumbOn]} />
      </View>
    </Pressable>
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
    minHeight: 56,
    paddingVertical: spacing.sm
  },
  copy: {
    flex: 1,
    gap: spacing.xs
  },
  label: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 14,
    fontWeight: "700"
  },
  description: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 12,
    lineHeight: 18
  },
  switch: {
    backgroundColor: colors.black,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 28,
    justifyContent: "center",
    paddingHorizontal: 3,
    width: 52
  },
  switchOn: {
    borderColor: colors.primary
  },
  thumb: {
    backgroundColor: colors.textMuted,
    borderRadius: 999,
    height: 20,
    width: 20
  },
  thumbOn: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary
  }
});
