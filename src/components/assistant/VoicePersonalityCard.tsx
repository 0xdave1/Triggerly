import { StyleSheet, Text, View } from "react-native";
import { Select } from "@/components/ui/Select";
import { TerminalButton } from "@/components/ui/TerminalButton";
import type { VoicePersonality } from "@/features/assistant/types";
import { speakText } from "@/features/voice/speech";
import { defaultVoiceSettings } from "@/features/voice/types";
import { colors, spacing, typography } from "@/styles/theme";

const stylesList: VoicePersonality["style"][] = ["CALM", "PROFESSIONAL", "FRIENDLY_NIGERIAN", "STRICT_COACH", "MINIMAL", "ENERGETIC"];

export function VoicePersonalityCard({ value, onChange }: { value: VoicePersonality; onChange: (input: Partial<VoicePersonality>) => void }) {
  const preview = value.style === "STRICT_COACH"
    ? "You marked this important. It's time to act."
    : value.style === "FRIENDLY_NIGERIAN"
      ? "Quick one. You said you wanted to do this now."
      : "Here is a reminder you asked me to keep.";
  return (
    <View style={styles.card}>
      <Text style={styles.body}>Choose how Triggerly sounds. Sensitive details stay hidden unless you explicitly allow them.</Text>
      <Select label="Voice personality" value={value.style} onChange={(style: VoicePersonality["style"]) => onChange({ style })} options={stylesList.map((style) => ({ label: style.replace(/_/g, " ").toLowerCase(), value: style }))} />
      <View style={styles.actions}>
        <TerminalButton variant="secondary" onPress={() => speakText(preview, { ...defaultVoiceSettings, voiceNotificationsEnabled: true })}>Preview voice</TerminalButton>
        <TerminalButton variant={value.readSensitiveContent ? "danger" : "secondary"} onPress={() => onChange({ readSensitiveContent: !value.readSensitiveContent })}>
          Sensitive content: {value.readSensitiveContent ? "on" : "off"}
        </TerminalButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  body: { color: colors.textMuted, fontFamily: typography.sans, fontSize: typography.small, lineHeight: 20 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }
});
