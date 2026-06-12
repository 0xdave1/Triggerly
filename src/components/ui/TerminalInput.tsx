import { useState } from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { colors, radii, spacing, typography } from "@/styles/theme";

type TerminalInputProps = TextInputProps & {
  label: string;
  error?: string;
  command?: boolean;
};

export function TerminalInput({ label, error, command = false, style, onFocus, onBlur, ...props }: TerminalInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, focused && styles.focused]}>
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
    fontFamily: typography.sans,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18
  },
  inputWrap: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 50,
    paddingHorizontal: spacing.md
  },
  focused: {
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceRaised
  },
  input: {
    color: colors.text,
    flex: 1,
    fontFamily: typography.sans,
    fontSize: typography.body,
    paddingVertical: spacing.md
  },
  commandInput: {
    color: colors.text
  },
  error: {
    color: colors.danger,
    fontFamily: typography.sans,
    fontSize: typography.small
  }
});
