import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, TextProps } from "react-native";
import { colors, typography } from "@/styles/theme";
import { useReducedMotion } from "./animation";

type GlowTextProps = TextProps & {
  pulse?: boolean;
};

export function GlowText({ pulse = false, style, children, ...props }: GlowTextProps) {
  const reducedMotion = useReducedMotion();
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!pulse || reducedMotion) return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.72, duration: 1100, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 1100, useNativeDriver: true })
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity, pulse, reducedMotion]);

  return (
    <Animated.Text {...props} style={[styles.text, { opacity }, style]}>
      {children}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  text: {
    color: colors.primary,
    fontFamily: typography.mono,
    fontWeight: "900",
    letterSpacing: typography.letterSpacing
  }
});
