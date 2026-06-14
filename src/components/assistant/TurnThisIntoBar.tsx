import { ScrollView, StyleSheet, Text, View } from "react-native";
import { TerminalButton } from "@/components/ui/TerminalButton";
import { spacing, colors, typography } from "@/styles/theme";

const options = [
  ["Reminder", "reminder"],
  ["Checklist", "checklist"],
  ["Habit", "habit"],
  ["Memory", "memory"],
  ["Email draft", "email_draft"],
  ["Travel plan", "travel_plan"],
  ["Weather alert", "weather_alert"],
  ["Price memory", "price_memory"]
] as const;

export function TurnThisIntoBar({ busy, onSelect }: { busy?: boolean; onSelect: (targetType: string) => void }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Turn this into</Text>
      <ScrollView horizontal contentContainerStyle={styles.row} showsHorizontalScrollIndicator={false}>
        {options.map(([label, value]) => (
          <TerminalButton key={value} loading={busy} variant="secondary" onPress={() => onSelect(value)}>
            {label}
          </TerminalButton>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, marginLeft: spacing.sm },
  row: { gap: spacing.sm, paddingRight: spacing.md },
  label: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 12, fontWeight: "700" }
});
