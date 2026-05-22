import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing, typography } from "@/styles/theme";
import type { ReminderFilter } from "@/features/reminders/utils";

const filters: Array<{ label: string; value: ReminderFilter }> = [
  { label: "All", value: "all" },
  { label: "Time", value: "time" },
  { label: "Location", value: "location" },
  { label: "Habit", value: "habit" }
];

type ReminderFiltersProps = {
  value: ReminderFilter;
  onChange: (value: ReminderFilter) => void;
};

export function ReminderFilters({ value, onChange }: ReminderFiltersProps) {
  return (
    <View style={styles.row}>
      {filters.map((filter) => {
        const active = filter.value === value;
        return (
          <Pressable key={filter.value} onPress={() => onChange(filter.value)} style={[styles.chip, active && styles.active]}>
            <Text style={[styles.text, active && styles.activeText]}>{filter.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  active: {
    backgroundColor: "rgba(0,255,102,0.08)",
    borderColor: colors.primary
  },
  text: {
    color: colors.textMuted,
    fontFamily: typography.mono,
    fontSize: typography.small,
    fontWeight: "900"
  },
  activeText: {
    color: colors.primary
  }
});
