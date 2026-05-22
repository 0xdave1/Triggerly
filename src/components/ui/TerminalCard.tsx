import { PropsWithChildren, useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { colors, glows, radii, spacing, typography } from "@/styles/theme";
import { useReducedMotion } from "./animation";

type TerminalCardProps = PropsWithChildren<{
  title?: string;
  active?: boolean;
  tone?: "green" | "cyan" | "amber" | "neutral";
}>;

export function TerminalCard({ children, title, active = false, tone = "green" }: TerminalCardProps) {
  const reducedMotion = useReducedMotion();
  const fade = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(reducedMotion ? 0 : 10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: reducedMotion ? 1 : 280, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: reducedMotion ? 1 : 280, useNativeDriver: true })
    ]).start();
  }, [fade, reducedMotion, translateY]);

  return (
    <Animated.View
      style={[
        styles.card,
        toneStyles[tone],
        active && styles.active,
        active && glows.primary,
        { opacity: fade, transform: [{ translateY }] }
      ]}
    >
      {title ? (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>
      ) : null}
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(11, 15, 12, 0.92)",
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    overflow: "hidden",
    padding: spacing.lg
  },
  active: {
    borderColor: colors.borderStrong
  },
  header: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingBottom: spacing.sm
  },
  title: {
    color: colors.textMuted,
    fontFamily: typography.mono,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: typography.letterSpacing,
    textTransform: "uppercase"
  }
});

const toneStyles = {
  green: { borderColor: colors.border },
  cyan: { borderColor: "rgba(24,216,255,0.22)" },
  amber: { borderColor: "rgba(255,184,46,0.22)" },
  neutral: { borderColor: "rgba(109,117,109,0.22)" }
};
