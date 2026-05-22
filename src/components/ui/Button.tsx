import type { PropsWithChildren } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { colors, radii, spacing, typography } from "@/styles/theme";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type ButtonProps = PropsWithChildren<{
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  style?: ViewStyle;
}>;

export function Button({ children, onPress, disabled, loading, variant = "primary", style }: ButtonProps) {
  const textStyle = {
    primary: styles.primaryText,
    secondary: styles.secondaryText,
    danger: styles.dangerText,
    ghost: styles.ghostText
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style
      ]}
    >
      {loading ? <ActivityIndicator color={variant === "primary" ? colors.surface : colors.primary} /> : <Text style={[styles.text, textStyle]}>{children}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.border
  },
  danger: {
    backgroundColor: colors.danger,
    borderColor: colors.danger
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: "transparent"
  },
  disabled: {
    opacity: 0.5
  },
  pressed: {
    opacity: 0.82
  },
  text: {
    fontSize: typography.body,
    fontWeight: "700"
  },
  primaryText: {
    color: colors.surface
  },
  secondaryText: {
    color: colors.text
  },
  dangerText: {
    color: colors.surface
  },
  ghostText: {
    color: colors.primary
  }
});
