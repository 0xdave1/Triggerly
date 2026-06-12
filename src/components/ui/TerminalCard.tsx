import { PropsWithChildren, useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing, typography } from "@/styles/theme";
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
    backgroundColor: "transparent",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    gap: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm
  },
  active: {
    borderBottomColor: colors.borderStrong
  },
  header: {
    paddingBottom: spacing.xs
  },
  title: {
    color: colors.success,
    fontFamily: typography.code,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.8,
    textTransform: "uppercase"
  }
});

const toneStyles = {
  green: {},
  cyan: {},
  amber: {},
  neutral: {}
};
