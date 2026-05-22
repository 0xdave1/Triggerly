import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { colors, radii, spacing, typography } from "@/styles/theme";
import { useReducedMotion } from "./animation";

type TerminalInputProps = TextInputProps & {
  label: string;
  error?: string;
  command?: boolean;
};

export function TerminalInput({ label, error, command = false, style, onFocus, onBlur, ...props }: TerminalInputProps) {
  const [focused, setFocused] = useState(false);
  const reducedMotion = useReducedMotion();
  const cursorOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!focused || reducedMotion) return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, { toValue: 0, duration: 520, useNativeDriver: true }),
        Animated.timing(cursorOpacity, { toValue: 1, duration: 520, useNativeDriver: true })
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [cursorOpacity, focused, reducedMotion]);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, focused && styles.focused]}>
        {command ? <Text style={styles.prompt}>{">"}</Text> : null}
        <TextInput
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.primary}
          style={[styles.input, command && styles.commandInput, style]}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...props}
        />
        {command && focused ? <Animated.Text style={[styles.cursor, { opacity: cursorOpacity }]}>_</Animated.Text> : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.sm
  },
  label: {
    color: colors.textMuted,
    fontFamily: typography.mono,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "lowercase"
  },
  inputWrap: {
    alignItems: "center",
    backgroundColor: colors.black,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 50,
    paddingHorizontal: spacing.md
  },
  focused: {
    borderColor: colors.primary
  },
  prompt: {
    color: colors.primary,
    fontFamily: typography.mono,
    fontSize: typography.body,
    fontWeight: "900",
    marginRight: spacing.sm
  },
  input: {
    color: colors.text,
    flex: 1,
    fontFamily: typography.mono,
    fontSize: typography.body,
    paddingVertical: spacing.md
  },
  commandInput: {
    color: colors.success
  },
  cursor: {
    color: colors.primary,
    fontFamily: typography.mono,
    fontSize: typography.body,
    fontWeight: "900"
  },
  error: {
    color: colors.danger,
    fontFamily: typography.mono,
    fontSize: typography.small
  }
});
