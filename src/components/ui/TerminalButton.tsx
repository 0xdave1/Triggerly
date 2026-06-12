import type { PropsWithChildren } from "react";
import { useRef } from "react";
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { colors, radii, spacing, typography } from "@/styles/theme";

type TerminalButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type TerminalButtonProps = PropsWithChildren<{
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: TerminalButtonVariant;
  style?: ViewStyle;
}>;

export function TerminalButton({ children, onPress, disabled, loading, variant = "primary", style }: TerminalButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 30 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        accessibilityRole="button"
        disabled={disabled || loading}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={[styles.base, styles[variant], (disabled || loading) && styles.disabled]}
      >
        {loading ? (
          <ActivityIndicator color={variant === "primary" ? colors.black : colors.textMuted} />
        ) : (
          <Text style={[styles.text, styles[`${variant}Text` as const]]}>{children}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  secondary: {
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  danger: {
    borderColor: colors.danger
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: "transparent"
  },
  disabled: {
    opacity: 0.42
  },
  text: {
    fontFamily: typography.sans,
    fontSize: 14,
    fontWeight: "700"
  },
  primaryText: {
    color: colors.black
  },
  secondaryText: {
    color: colors.text
  },
  dangerText: {
    color: colors.danger
  },
  ghostText: {
    color: colors.primary
  }
});
