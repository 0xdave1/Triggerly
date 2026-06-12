import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Select } from "@/components/ui/Select";
import { TerminalButton } from "@/components/ui/TerminalButton";
import { TerminalCard } from "@/components/ui/TerminalCard";
import { TerminalHeader } from "@/components/ui/TerminalHeader";
import { TerminalScreen } from "@/components/ui/TerminalScreen";
import { TerminalStatRow } from "@/components/ui/TerminalStatRow";
import { PrivacyToggleRow } from "@/components/ui/PrivacyToggleRow";
import { usePrivacySettings, useUpdatePrivacySettings } from "@/features/privacy/hooks";
import { generateVoiceScript } from "@/features/voice/api";
import { loadVoiceSettings, saveVoiceSettings } from "@/features/voice/settings";
import { speakReminder } from "@/features/voice/speech";
import { defaultVoiceSettings, type VoiceSettings } from "@/features/voice/types";
import { colors, spacing, typography } from "@/styles/theme";

const stylesList = ["calm", "energetic", "professional", "friendly", "minimal"] as const;

export default function VoiceScreen() {
  const [settings, setSettings] = useState<VoiceSettings>(defaultVoiceSettings);
  const [script, setScript] = useState("You're near Shoprite. You asked me to buy cookies.");
  const privacy = usePrivacySettings();
  const updatePrivacy = useUpdatePrivacySettings();

  useEffect(() => {
    loadVoiceSettings().then(setSettings).catch(() => undefined);
  }, []);

  const update = async (next: VoiceSettings) => {
    setSettings(next);
    await saveVoiceSettings(next);
  };

  return (
    <TerminalScreen>
      <TerminalHeader title="voice.config" subtitle="foreground preview · OS limits apply" status="voice_nudge_ready" />
      <TerminalCard title="voice_settings" active>
        <TerminalStatRow label="platform_limit" value="background voice not guaranteed" tone="amber" />
        <PrivacyToggleRow
          label="voiceNotificationsEnabled"
          value={settings.voiceNotificationsEnabled}
          description="Voice is user-selected and previewed in foreground."
          onToggle={() => update({ ...settings, voiceNotificationsEnabled: !settings.voiceNotificationsEnabled })}
        />
        <Select label="voice_style" value={settings.selectedVoiceStyle} onChange={(selectedVoiceStyle) => update({ ...settings, selectedVoiceStyle })} options={stylesList.map((value) => ({ label: value, value }))} />
        <PrivacyToggleRow label="readFullReminder" value={settings.readFullReminder} onToggle={() => update({ ...settings, readFullReminder: !settings.readFullReminder })} />
        <PrivacyToggleRow label="readLocationContext" value={settings.readLocationContext} onToggle={() => update({ ...settings, readLocationContext: !settings.readLocationContext })} />
      </TerminalCard>

      <TerminalCard title="preview_voice" tone="cyan">
        <Text style={styles.body}>{script}</Text>
        <View style={styles.row}>
          <TerminalButton
            variant="secondary"
            onPress={async () => {
              const generated = await generateVoiceScript({ intent: { taskTitle: "buy cookies", triggerType: "location_arrival", locationCandidate: { placeName: "Shoprite" } } }).catch(() => ({ script }));
              setScript(generated.script);
            }}
          >
            GENERATE_SCRIPT
          </TerminalButton>
          <TerminalButton onPress={() => speakReminder(script, settings)}>PREVIEW_VOICE</TerminalButton>
        </View>
      </TerminalCard>

      <TerminalCard title="privacy_link" tone="amber">
        <PrivacyToggleRow
          label="voiceNotificationsEnabled"
          value={Boolean(privacy.data?.voiceNotificationsEnabled)}
          description="Backend privacy gate for voice notification capability."
          onToggle={() => updatePrivacy.mutate({ voiceNotificationsEnabled: !privacy.data?.voiceNotificationsEnabled })}
        />
      </TerminalCard>
    </TerminalScreen>
  );
}

const styles = StyleSheet.create({
  body: {
    color: colors.textMuted,
    fontFamily: typography.mono,
    fontSize: typography.small,
    lineHeight: 20
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  }
});
