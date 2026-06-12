import { StyleSheet, Text } from "react-native";
import { TerminalCard } from "@/components/ui/TerminalCard";
import { TerminalStatRow } from "@/components/ui/TerminalStatRow";
import type { MemoryItem } from "@/features/memory/types";
import { colors, typography } from "@/styles/theme";

export function MemoryCard({ item }: { item: MemoryItem }) {
  return (
    <TerminalCard title={`memory.${item.type}`} tone={item.type === "debt" ? "amber" : "cyan"}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.body}>{item.body}</Text>
      <TerminalStatRow label="source" value={item.source ?? "user_confirmed"} tone="muted" />
      <TerminalStatRow label="confidence" value={item.confidence ? `${Math.round(item.confidence * 100)}%` : "manual"} tone="green" />
    </TerminalCard>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontFamily: typography.mono,
    fontSize: typography.body,
    fontWeight: "900"
  },
  body: {
    color: colors.textMuted,
    fontFamily: typography.mono,
    fontSize: typography.small,
    lineHeight: 20
  }
});
