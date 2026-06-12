import { StyleSheet, Text } from "react-native";
import { TerminalCard } from "@/components/ui/TerminalCard";
import { TerminalStatRow } from "@/components/ui/TerminalStatRow";
import type { LiveContextPlaceholder } from "@/features/live-context/types";
import { colors, typography } from "@/styles/theme";

export function LiveContextCard({ result, title }: { title: string; result?: LiveContextPlaceholder }) {
  return (
    <TerminalCard title={title} tone="cyan">
      <TerminalStatRow label="status" value={result?.status ?? "ready"} tone={result?.status === "provider_not_configured" ? "amber" : "cyan"} />
      <Text style={styles.body}>{result?.message ?? "Live provider not configured yet."}</Text>
    </TerminalCard>
  );
}

const styles = StyleSheet.create({
  body: {
    color: colors.textMuted,
    fontFamily: typography.mono,
    fontSize: typography.small,
    lineHeight: 20
  }
});
