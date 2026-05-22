import { StyleSheet, View } from "react-native";
import { TerminalButton } from "@/components/ui/TerminalButton";
import { TerminalCard } from "@/components/ui/TerminalCard";
import { TerminalInput } from "@/components/ui/TerminalInput";
import { spacing } from "@/styles/theme";

type QuickTriggerInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
};

export function QuickTriggerInput({ value, onChangeText, onSubmit }: QuickTriggerInputProps) {
  return (
    <TerminalCard title="quick_trigger.command">
      <TerminalInput
        command
        label="command_input"
        value={value}
        onChangeText={onChangeText}
        placeholder="remind me to buy cookies when I get to Shoprite"
      />
      <View style={styles.row}>
        <TerminalButton disabled={!value.trim()} onPress={onSubmit}>
          ARM_TRIGGER
        </TerminalButton>
      </View>
    </TerminalCard>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm
  }
});
