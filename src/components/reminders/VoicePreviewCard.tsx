import { StyleSheet, Text, View } from "react-native";
import { TerminalButton } from "@/components/ui/TerminalButton";
import { TerminalCard } from "@/components/ui/TerminalCard";
import type { VoiceSettings } from "@/features/voice/types";
import { speakText, stopSpeaking } from "@/features/voice/speech";
import { colors, spacing, typography } from "@/styles/theme";

export function VoicePreviewCard({ script, settings, onGenerate, generating }: { script: string; settings: VoiceSettings; onGenerate?: () => void; generating?: boolean }) {
  return (
    <TerminalCard title="Voice preview">
      <Text style={styles.script}>{script}</Text>
      <Text style={styles.note}>Preview plays only after you tap. Background speech is not guaranteed by iOS or Android.</Text>
      <View style={styles.actions}>
        {onGenerate ? (
          <TerminalButton variant="secondary" loading={generating} onPress={onGenerate}>
            Generate sample
          </TerminalButton>
        ) : null}
        <TerminalButton onPress={() => speakText(script, settings, { allowWhenDisabled: true })}>Preview voice</TerminalButton>
        <TerminalButton variant="ghost" onPress={stopSpeaking}>Stop</TerminalButton>
      </View>
    </TerminalCard>
  );
}

const styles = StyleSheet.create({
  script: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: typography.body,
    lineHeight: 24
  },
  note: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: typography.small,
    lineHeight: 19
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  }
});
