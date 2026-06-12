import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Select } from "@/components/ui/Select";
import { TerminalButton } from "@/components/ui/TerminalButton";
import { TerminalCard } from "@/components/ui/TerminalCard";
import { TerminalHeader } from "@/components/ui/TerminalHeader";
import { TerminalScreen } from "@/components/ui/TerminalScreen";
import { TerminalStatRow } from "@/components/ui/TerminalStatRow";
import { PrivacyToggleRow } from "@/components/ui/PrivacyToggleRow";
import { PRIVACY_COPY } from "@/constants/copy";
import { useAuth } from "@/features/auth/AuthProvider";
import { getLocationPermissionStatus } from "@/features/location/permissions";
import type { PermissionState } from "@/features/location/types";
import { getNotificationPermissionStatus, requestNotificationPermission } from "@/features/notifications/permissions";
import { usePrivacySettings, useUpdatePrivacySettings } from "@/features/privacy/hooks";
import type { PrivacySettingKey } from "@/features/privacy/types";
import { PRIVACY_SETTINGS_ROWS } from "@/features/settings/privacyCopy";
import { useReminderActions } from "@/features/reminders/hooks";
import type { VoiceStyle } from "@/features/reminders/types";
import { loadVoiceSettings, saveVoiceSettings } from "@/features/voice/settings";
import { speakReminder } from "@/features/voice/speech";
import { defaultVoiceSettings, type VoiceSettings } from "@/features/voice/types";
import { colors, spacing, typography } from "@/styles/theme";

export default function SettingsScreen() {
  const [notificationStatus, setNotificationStatus] = useState<PermissionState>("undetermined");
  const [locationStatus, setLocationStatus] = useState<PermissionState>("undetermined");
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(defaultVoiceSettings);
  const actions = useReminderActions();
  const { user, logout } = useAuth();
  const privacySettings = usePrivacySettings();
  const updatePrivacy = useUpdatePrivacySettings();

  const refresh = async () => {
    setNotificationStatus(await getNotificationPermissionStatus());
    setLocationStatus(await getLocationPermissionStatus());
  };

  useEffect(() => {
    refresh();
    loadVoiceSettings().then(setVoiceSettings).catch(() => undefined);
  }, []);

  const updateVoiceSettings = async (next: VoiceSettings) => {
    setVoiceSettings(next);
    await saveVoiceSettings(next);
  };

  const enableNotifications = async () => {
    const status = await requestNotificationPermission();
    setNotificationStatus(status);
    if (status !== "granted") {
      Alert.alert("Notifications denied", "You can enable notifications later in system settings.");
    }
  };

  const deleteLocalData = () => {
    Alert.alert("Delete local data?", "This removes reminders stored on this device.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => actions.clearLocalData.mutate()
      }
    ]);
  };

  return (
    <TerminalScreen>
      <TerminalHeader title="Control" subtitle="Privacy, permissions, voice, and account settings." status="private by design" />
      <TerminalCard title="Permissions">
        <TerminalStatRow label="Signed in as" value={user?.email ?? "unknown"} tone="cyan" />
        <TerminalStatRow label="Notifications" value={notificationStatus} tone={notificationStatus === "granted" ? "green" : "amber"} />
        <TerminalStatRow label="Location" value={locationStatus === "granted" ? "enabled when used" : "ask when needed"} tone={locationStatus === "granted" ? "cyan" : "amber"} />
        <TerminalStatRow label="Microphone" value="tap to use only" tone="muted" />
        <TerminalStatRow label="Background audio" value="disabled" tone="green" />
        <TerminalStatRow label="Automatic payments" value="disabled" tone="green" />
        <TerminalStatRow label="Automatic email sending" value="disabled" tone="green" />
        <TerminalStatRow label="Confirmation" value="required" tone="amber" />
        {PRIVACY_SETTINGS_ROWS.map(([label, value]) => (
          <TerminalStatRow key={label} label={label} value={value} tone="muted" />
        ))}
        <TerminalStatRow label="data_export" value="available later" tone="muted" />
        <TerminalStatRow label="delete_data" value="available" tone="amber" />
        <TerminalButton variant="secondary" onPress={enableNotifications}>
          Enable notifications
        </TerminalButton>
      </TerminalCard>

      <TerminalCard title="Privacy controls" active>
        {privacyRows.map((row) => (
          <PrivacyToggleRow
            key={row.key}
            label={row.key}
            value={Boolean(privacySettings.data?.[row.key])}
            description={row.description}
            onToggle={() => updatePrivacy.mutate({ [row.key]: !privacySettings.data?.[row.key] })}
          />
        ))}
      </TerminalCard>

      <TerminalCard title="Voice" tone="cyan">
        <TerminalStatRow label="Voice notifications" value={voiceSettings.voiceNotificationsEnabled ? "enabled" : "disabled"} tone={voiceSettings.voiceNotificationsEnabled ? "green" : "muted"} />
        <TerminalStatRow label="Voice style" value={voiceSettings.selectedVoiceStyle} tone="cyan" />
        <TerminalStatRow label="Read context" value={voiceSettings.readLocationContext ? "enabled" : "disabled"} tone="amber" />
        <Select
          label="Voice style"
          value={voiceSettings.selectedVoiceStyle}
          onChange={(selectedVoiceStyle: VoiceStyle) => updateVoiceSettings({ ...voiceSettings, selectedVoiceStyle })}
          options={[
            { label: "calm", value: "calm" },
            { label: "energetic", value: "energetic" },
            { label: "professional", value: "professional" },
            { label: "friendly", value: "friendly" },
            { label: "minimal", value: "minimal" }
          ]}
        />
        <View style={styles.row}>
          <TerminalButton
            variant={voiceSettings.voiceNotificationsEnabled ? "secondary" : "primary"}
            onPress={() => updateVoiceSettings({ ...voiceSettings, voiceNotificationsEnabled: !voiceSettings.voiceNotificationsEnabled })}
          >
            {voiceSettings.voiceNotificationsEnabled ? "Disable voice" : "Enable voice"}
          </TerminalButton>
          <TerminalButton
            variant="secondary"
            onPress={() => speakReminder("You're near Shoprite. You asked me to buy cookies.", { ...voiceSettings, voiceNotificationsEnabled: true })}
          >
            Preview voice
          </TerminalButton>
          <TerminalButton variant="ghost" onPress={() => router.push("/voice" as never)}>
            Voice settings
          </TerminalButton>
        </View>
      </TerminalCard>

      <TerminalCard title="Your privacy boundaries" active>
        <Text style={styles.body}>{PRIVACY_COPY.boundaries}</Text>
        <Text style={styles.body}>{PRIVACY_COPY.location}</Text>
        <Text style={styles.body}>{PRIVACY_COPY.microphone}</Text>
        <Text style={styles.body}>Triggerly waits for instructions you choose to give. It does not listen in the background.</Text>
      </TerminalCard>

      <View style={styles.row}>
        <TerminalButton variant="secondary" onPress={logout}>
          Log out
        </TerminalButton>
        <TerminalButton variant="danger" onPress={deleteLocalData}>
          Delete local data
        </TerminalButton>
      </View>
    </TerminalScreen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  body: {
    color: colors.textMuted,
    fontFamily: typography.mono,
    fontSize: typography.body,
    lineHeight: 23
  }
});

const privacyRows: Array<{ key: PrivacySettingKey; description: string }> = [
  { key: "locationTriggersEnabled", description: "Location is used only for reminders you create." },
  { key: "backgroundLocationEnabled", description: "No hidden tracking; native background behavior needs explicit approval." },
  { key: "microphoneInputEnabled", description: "Voice input is tap-to-record only." },
  { key: "voiceNotificationsEnabled", description: "Voice nudges are user-selected." },
  { key: "aiParsingEnabled", description: "Allow backend AI intent parsing." },
  { key: "cloudSyncEnabled", description: "Sync user-owned reminders and memory." },
  { key: "contactAccessEnabled", description: "Contacts are requested only for contact reminders." },
  { key: "emailDraftingEnabled", description: "Drafting only; no automatic email sending." },
  { key: "messageDraftingEnabled", description: "Message drafts only; no automatic sending." },
  { key: "paymentRemindersEnabled", description: "Payment reminders only." },
  { key: "paymentActionsEnabled", description: "Opening/preparing payment flow requires confirmation." },
  { key: "calendarIntegrationEnabled", description: "Calendar actions require explicit confirmation." },
  { key: "screenshotReceiptScanningEnabled", description: "Disabled unless explicitly enabled later." },
  { key: "smartSuggestionsEnabled", description: "Show optional suggestions from confirmed data." },
  { key: "habitLearningEnabled", description: "No passive habit learning unless enabled." },
  { key: "weatherTriggersEnabled", description: "Allow weather trigger creation." },
  { key: "exchangeRateTriggersEnabled", description: "Allow exchange rate trigger creation." },
  { key: "priceMemoryEnabled", description: "Allow manual price memory logs." },
  { key: "travelContextEnabled", description: "Allow travel context prompts." },
  { key: "analyticsEnabled", description: "No hidden analytics." },
  { key: "crashReportsEnabled", description: "No reminder content in crash reports." },
  { key: "dataExportEnabled", description: "Allow privacy export." }
];
