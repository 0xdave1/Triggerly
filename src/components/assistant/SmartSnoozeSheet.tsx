import { Modal, StyleSheet, Text, View } from "react-native";
import { TerminalButton } from "@/components/ui/TerminalButton";
import { colors, radii, spacing, typography } from "@/styles/theme";

const options = [
  ["10 minutes", "10_minutes"],
  ["1 hour", "1_hour"],
  ["Tonight", "tonight"],
  ["Tomorrow morning", "tomorrow_morning"],
  ["When I arrive", "arrival"],
  ["When I leave", "departure"],
  ["When I talk to someone", "person"],
  ["Custom", "custom"]
] as const;

export function SmartSnoozeSheet({ visible, onClose, onSelect }: { visible: boolean; onClose: () => void; onSelect: (mode: string) => void }) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Remind me again</Text>
          <Text style={styles.body}>Location and person options may need more details and explicit permission.</Text>
          <View style={styles.options}>
            {options.map(([label, value]) => <TerminalButton key={value} variant="secondary" onPress={() => onSelect(value)}>{label}</TerminalButton>)}
          </View>
          <TerminalButton variant="ghost" onPress={onClose}>Cancel</TerminalButton>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: "rgba(0,0,0,0.76)", flex: 1, justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.backgroundAlt, borderColor: colors.border, borderRadius: radii.lg, borderWidth: 1, gap: spacing.md, padding: spacing.xl },
  title: { color: colors.text, fontFamily: typography.sans, fontSize: 20, fontWeight: "800" },
  body: { color: colors.textMuted, fontFamily: typography.sans, fontSize: typography.small, lineHeight: 20 },
  options: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }
});
