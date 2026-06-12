import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing, typography } from "@/styles/theme";
import type { ReminderType } from "@/features/reminders/types";

type TriggerTypeSelectorProps = {
  value: ReminderType;
  onChange: (value: ReminderType) => void;
};

const options: Array<{ label: string; value: ReminderType }> = [
  { label: "TIME", value: "time" },
  { label: "LOCATION", value: "location" },
  { label: "HABIT", value: "habit" }
];

export function TriggerTypeSelector({ value, onChange }: TriggerTypeSelectorProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Reminder type</Text>
      <View style={styles.row}>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <Pressable key={option.value} onPress={() => onChange(option.value)} style={[styles.option, active && styles.active]}>
              <Text style={[styles.text, active && styles.activeText]}>[ {option.label} ]</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm
  },
  label: {
    color: colors.textMuted,
    fontFamily: typography.mono,
    fontSize: 12,
    fontWeight: "900"
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  option: {
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  active: {
    borderColor: colors.primary,
    backgroundColor: "rgba(0,255,102,0.06)"
  },
  text: {
    color: colors.textMuted,
    fontFamily: typography.mono,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1
  },
  activeText: {
    color: colors.primary
  }
});
