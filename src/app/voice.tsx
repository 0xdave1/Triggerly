import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { VoicePreviewCard } from "@/components/reminders/VoicePreviewCard";
import { PrivacyToggleRow } from "@/components/ui/PrivacyToggleRow";
import { Select } from "@/components/ui/Select";
import { TerminalCard } from "@/components/ui/TerminalCard";
import { TerminalHeader } from "@/components/ui/TerminalHeader";
import { TerminalScreen } from "@/components/ui/TerminalScreen";
import { TerminalStatRow } from "@/components/ui/TerminalStatRow";
import { usePrivacySettings, useUpdatePrivacySettings } from "@/features/privacy/hooks";
import { previewVoiceScript } from "@/features/voice/api";
import { useUpdateVoiceSettings, useVoiceSettings } from "@/features/voice/hooks";
import { getAvailableVoices } from "@/features/voice/speech";
import {
  defaultVoiceSettings,
  type AvailableVoice,
  type VoiceSettings
} from "@/features/voice/types";
import type { VoiceStyle } from "@/features/reminders/types";
import { colors, typography } from "@/styles/theme";

const stylesList: VoiceStyle[] = ["calm", "energetic", "professional", "friendly", "minimal"];
const volumeOptions = [
  { label: "60%", value: 0.6 },
  { label: "80%", value: 0.8 },
  { label: "100%", value: 1 }
];

export default function VoiceSettingsScreen() {
  const voice = useVoiceSettings();
  const updateVoice = useUpdateVoiceSettings();
  const privacy = usePrivacySettings();
  const updatePrivacy = useUpdatePrivacySettings();
  const [voices, setVoices] = useState<AvailableVoice[]>([]);
  const [script, setScript] = useState("You're near Shoprite. You asked me to buy cookies.");
  const [message, setMessage] = useState<string>();
  const [generating, setGenerating] = useState(false);
  const settings = voice.data ?? defaultVoiceSettings;

  useEffect(() => {
    getAvailableVoices().then(setVoices).catch(() => undefined);
  }, []);

  const voiceOptions = useMemo(
    () =>
      voices
        .filter((item) => item.language.toLowerCase().startsWith("en"))
        .slice(0, 8)
        .map((item) => ({
          label: `${item.name} (${item.language})`,
          value: item.identifier
        })),
    [voices]
  );

  const update = async (input: Partial<VoiceSettings>) => {
    setMessage(undefined);
    try {
      await updateVoice.mutateAsync(input);
    } catch {
      setMessage("Voice settings could not sync. Your device copy is still available.");
    }
  };

  const toggleVoice = async () => {
    const enabled = !settings.voiceNotificationsEnabled;
    await update({ voiceNotificationsEnabled: enabled });
    try {
      await updatePrivacy.mutateAsync({ voiceNotificationsEnabled: enabled });
    } catch {
      setMessage("Voice preference saved, but the privacy setting could not sync.");
    }
  };

  const generatePreview = async () => {
    setGenerating(true);
    setMessage(undefined);
    try {
      const generated = await previewVoiceScript({
        intent: {
          taskTitle: "Buy cookies",
          triggerType: "location_arrival",
          locationCandidate: { placeName: "Shoprite" }
        }
      });
      setScript(generated.script);
    } catch {
      setMessage("Using the local sample because the voice service is unavailable.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <TerminalScreen>
      <TerminalHeader
        title="Choose how Triggerly speaks."
        subtitle="Voice is optional, private, and only plays after an interaction supported by your device."
        status="user controlled"
      />

      <TerminalCard title="Voice settings">
        <TerminalStatRow label="Background speech" value="Not guaranteed by iOS or Android" tone="amber" />
        <PrivacyToggleRow
          label="Voice notifications"
          value={settings.voiceNotificationsEnabled}
          description="Speak a reminder after you open its notification."
          onToggle={toggleVoice}
        />
        <Select
          label="Voice style"
          value={settings.selectedVoiceStyle}
          onChange={(selectedVoiceStyle) => update({ selectedVoiceStyle })}
          options={stylesList.map((value) => ({ label: value, value }))}
        />
        <Select
          label="Voice volume"
          value={settings.voiceVolume}
          onChange={(voiceVolume) => update({ voiceVolume })}
          options={volumeOptions}
        />
        {voiceOptions.length ? (
          <Select
            label="Device voice"
            value={settings.selectedVoiceId ?? ""}
            onChange={(selectedVoiceId) => update({ selectedVoiceId })}
            options={voiceOptions}
          />
        ) : (
          <Text style={styles.note}>Your device will use its default speech voice.</Text>
        )}
        <PrivacyToggleRow
          label="Read full reminder"
          value={settings.readFullReminder}
          description="Turn this off to hear a private generic prompt instead."
          onToggle={() => update({ readFullReminder: !settings.readFullReminder })}
        />
        <PrivacyToggleRow
          label="Read location context"
          value={settings.readLocationContext}
          onToggle={() => update({ readLocationContext: !settings.readLocationContext })}
        />
        <PrivacyToggleRow
          label="Read live context"
          value={settings.readLiveContext}
          onToggle={() => update({ readLiveContext: !settings.readLiveContext })}
        />
        <TerminalStatRow
          label="Privacy permission"
          value={privacy.data?.voiceNotificationsEnabled ? "Enabled" : "Disabled"}
          tone={privacy.data?.voiceNotificationsEnabled ? "green" : "muted"}
        />
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </TerminalCard>

      <VoicePreviewCard
        script={script}
        settings={settings}
        onGenerate={generatePreview}
        generating={generating}
      />
    </TerminalScreen>
  );
}

const styles = StyleSheet.create({
  note: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: typography.small,
    lineHeight: 20
  },
  message: {
    color: colors.warning,
    fontFamily: typography.sans,
    fontSize: typography.small,
    lineHeight: 20
  }
});
