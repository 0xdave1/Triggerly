import { StyleSheet, View } from "react-native";
import { TerminalButton } from "@/components/ui/TerminalButton";
import { TerminalInput } from "@/components/ui/TerminalInput";
import { spacing } from "@/styles/theme";

type QuickTriggerInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
};

export function QuickTriggerInput({ value, onChangeText, onSubmit }: QuickTriggerInputProps) {
  return (
    <View style={styles.container}>
      <TerminalInput
        command
        label="What should Triggerly remember?"
        value={value}
        onChangeText={onChangeText}
        placeholder="Remind me to buy cookies when I get to Shoprite"
        multiline
      />
      <View style={styles.row}>
        <TerminalButton disabled={!value.trim()} onPress={onSubmit}>
          Continue
        </TerminalButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md
  },
  row: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm
  }
});
