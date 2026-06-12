import { StyleSheet, Text } from "react-native";
import { TerminalCard } from "@/components/ui/TerminalCard";
import { colors, typography } from "@/styles/theme";

export function ClarificationCard({ question }: { question: string }) {
  return (
    <TerminalCard title="More detail needed" tone="cyan">
      <Text style={styles.text}>{question}</Text>
    </TerminalCard>
  );
}

const styles = StyleSheet.create({
  text: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: typography.body,
    lineHeight: 23
  }
});
