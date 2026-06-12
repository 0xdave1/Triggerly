import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing, typography } from "@/styles/theme";

export type SelectOption<T extends string | number> = {
  label: string;
  value: T;
};

type SelectProps<T extends string | number> = {
  label: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
};

export function Select<T extends string | number>({ label, value, options, onChange }: SelectProps<T>) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.options}>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <Pressable
              accessibilityRole="button"
              key={String(option.value)}
              onPress={() => onChange(option.value)}
              style={[styles.option, active && styles.activeOption]}
            >
              <Text style={[styles.optionText, active && styles.activeText]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
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
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  option: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  activeOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  optionText: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: typography.small,
    fontWeight: "600"
  },
  activeText: {
    color: colors.black
  }
});
