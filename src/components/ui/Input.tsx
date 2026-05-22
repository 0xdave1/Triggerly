import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { colors, radii, spacing, typography } from "@/styles/theme";

type InputProps = TextInputProps & {
  label: string;
  error?: string;
};

export function Input({ label, error, style, ...props }: InputProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.textMuted} style={[styles.input, style]} {...props} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.sm
  },
  label: {
    color: colors.text,
    fontSize: typography.small,
    fontWeight: "700"
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: typography.body,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md
  },
  error: {
    color: colors.danger,
    fontSize: typography.small
  }
});
