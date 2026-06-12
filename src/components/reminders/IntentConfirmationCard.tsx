import { StyleSheet, Text } from "react-native";
import { TerminalCard } from "@/components/ui/TerminalCard";
import { TerminalStatRow } from "@/components/ui/TerminalStatRow";
import { describeCandidate } from "@/features/trigger-intent/intentConfirmation";
import type { ParsedIntent } from "@/features/trigger-intent/types";
import { colors, typography } from "@/styles/theme";

export function IntentConfirmationCard({ intent, source }: { intent?: ParsedIntent; source?: string }) {
  return (
    <TerminalCard title="What Triggerly understood" active={Boolean(intent)}>
      <TerminalStatRow label="source" value={source ?? "pending"} tone={source === "local_fallback" ? "amber" : "cyan"} />
      <TerminalStatRow label="intent_type" value={intent?.intentType ?? "unknown"} tone="green" />
      <TerminalStatRow label="Trigger type" value={intent?.triggerType?.replace(/_/g, " ") ?? "none"} tone="cyan" />
      <TerminalStatRow label="confidence" value={intent ? `${Math.round(intent.confidence * 100)}%` : "0%"} tone="amber" />
      <Text style={styles.body}>task: {intent?.taskTitle ?? "none"}</Text>
      <Text style={styles.body}>time: {describeCandidate(intent?.timeCandidate)}</Text>
      <Text style={styles.body}>location: {describeCandidate(intent?.locationCandidate)}</Text>
      <Text style={styles.body}>weather: {describeCandidate(intent?.weatherCandidate)}</Text>
      <Text style={styles.body}>exchange: {describeCandidate(intent?.exchangeRateCandidate)}</Text>
      <Text style={styles.body}>price: {describeCandidate(intent?.priceCandidate)}</Text>
      <Text style={styles.body}>memory: {describeCandidate(intent?.memoryCandidate)}</Text>
      <Text style={styles.script}>{intent?.suggestedVoiceScript ?? "voice_script_pending"}</Text>
    </TerminalCard>
  );
}

const styles = StyleSheet.create({
  body: {
    color: colors.textMuted,
    fontFamily: typography.mono,
    fontSize: typography.small,
    lineHeight: 20
  },
  script: {
    color: colors.primary,
    fontFamily: typography.mono,
    fontSize: typography.small,
    lineHeight: 20
  }
});
