import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@/styles/theme";
import { StatusPill } from "./StatusPill";
import { useReducedMotion } from "./animation";

type TerminalHeaderProps = {
  title?: string;
  subtitle?: string;
  status?: string;
};

export function TerminalHeader({ title = "triggerly.sh", subtitle = "context reminder engine", status = "privacy_mode: on" }: TerminalHeaderProps) {
  const [typed, setTyped] = useState("");
  const reducedMotion = useReducedMotion();
  const flicker = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reducedMotion) {
      setTyped(subtitle);
      return;
    }

    let index = 0;
    const timer = setInterval(() => {
      index += 1;
      setTyped(subtitle.slice(0, index));
      if (index >= subtitle.length) clearInterval(timer);
    }, 38);
    return () => clearInterval(timer);
  }, [reducedMotion, subtitle]);

  useEffect(() => {
    if (reducedMotion) return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(flicker, { toValue: 0.76, duration: 70, useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 1, duration: 1600, useNativeDriver: true })
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [flicker, reducedMotion]);

  return (
    <View style={styles.header}>
      <View style={styles.titleGroup}>
        <Animated.Text style={[styles.title, { opacity: flicker }]}>{title}</Animated.Text>
        <Text style={styles.subtitle}>
          {typed}
          <Text style={styles.cursor}>_</Text>
        </Text>
      </View>
      <StatusPill label={status} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  titleGroup: {
    flex: 1,
    gap: spacing.xs
  },
  title: {
    color: colors.text,
    fontFamily: typography.mono,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: typography.letterSpacing
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: typography.mono,
    fontSize: typography.small
  },
  cursor: {
    color: colors.primary
  }
});
