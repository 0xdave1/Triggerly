import { StyleSheet, View } from "react-native";
import { TerminalButton } from "@/components/ui/TerminalButton";
import { spacing } from "@/styles/theme";

export function ConfirmationActions({
  onConfirm,
  onReject,
  confirming,
  disabled
}: {
  onConfirm: () => void;
  onReject: () => void;
  confirming?: boolean;
  disabled?: boolean;
}) {
  return (
    <View style={styles.row}>
      <TerminalButton disabled={disabled} loading={confirming} onPress={onConfirm}>
        Confirm all
      </TerminalButton>
      <TerminalButton disabled={disabled} variant="secondary" onPress={onReject}>
        Discard
      </TerminalButton>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  }
});
