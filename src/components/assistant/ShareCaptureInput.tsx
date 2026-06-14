import { StyleSheet, Text, View } from "react-native";
import { TerminalButton } from "@/components/ui/TerminalButton";
import { TerminalInput } from "@/components/ui/TerminalInput";
import { colors, spacing, typography } from "@/styles/theme";

export function ShareCaptureInput({ value, busy, onChange, onParse }: { value: string; busy?: boolean; onChange: (value: string) => void; onParse: () => void }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.body}>Paste text from a message, email, note, URL, or receipt. Triggerly will propose a plan and wait for confirmation.</Text>
      <TerminalInput label="Shared content" multiline placeholder="Paste content here..." value={value} onChangeText={onChange} />
      <TerminalButton disabled={!value.trim()} loading={busy} onPress={onParse}>Parse shared text</TerminalButton>
      <Text style={styles.note}>Native OS share extensions and image OCR are not active in this Expo build.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  body: { color: colors.textMuted, fontFamily: typography.sans, fontSize: typography.small, lineHeight: 20 },
  note: { color: colors.warning, fontFamily: typography.sans, fontSize: 11, lineHeight: 17 }
});
