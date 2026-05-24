import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Select } from "@/components/ui/Select";
import { TerminalButton } from "@/components/ui/TerminalButton";
import { TerminalCard } from "@/components/ui/TerminalCard";
import { TerminalHeader } from "@/components/ui/TerminalHeader";
import { TerminalScreen } from "@/components/ui/TerminalScreen";
import { TerminalStatRow } from "@/components/ui/TerminalStatRow";
import { PRIVACY_COPY } from "@/constants/copy";
import { useAuth } from "@/features/auth/AuthProvider";
import { getLocationPermissionStatus } from "@/features/location/permissions";
import type { PermissionState } from "@/features/location/types";
import { getNotificationPermissionStatus, requestNotificationPermission } from "@/features/notifications/permissions";
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
      <TerminalHeader title="privacy.config" subtitle="privacy is a feature, not a footnote" status="privacy_mode: on" />
      <TerminalCard title="permissions">
        <TerminalStatRow label="signed_in_as" value={user?.email ?? "unknown"} tone="cyan" />
        <TerminalStatRow label="notifications" value={notificationStatus} tone={notificationStatus === "granted" ? "green" : "amber"} />
        <TerminalStatRow label="location" value={locationStatus === "granted" ? "enabled when used" : "ask when needed"} tone={locationStatus === "granted" ? "cyan" : "amber"} />
        <TerminalStatRow label="microphone" value="tap-to-record only" tone="muted" />
        <TerminalStatRow label="background_audio" value="disabled" tone="green" />
        <TerminalStatRow label="voice_input" value="tap_to_record_only" tone="green" />
        <TerminalStatRow label="voice_notifications" value="user_selected" tone="cyan" />
        <TerminalStatRow label="auto_transactions" value="disabled" tone="green" />
        <TerminalStatRow label="auto_payments" value="disabled" tone="green" />
        <TerminalStatRow label="auto_email_send" value="disabled" tone="green" />
        <TerminalStatRow label="confirmation_required" value="enabled" tone="amber" />
        <TerminalStatRow label="data_export" value="available later" tone="muted" />
        <TerminalStatRow label="delete_data" value="available" tone="amber" />
        <TerminalButton variant="secondary" onPress={enableNotifications}>
          REQUEST_NOTIFICATIONS
        </TerminalButton>
      </TerminalCard>

      <TerminalCard title="voice.config" tone="cyan">
        <TerminalStatRow label="voice_notifications" value={voiceSettings.voiceNotificationsEnabled ? "enabled" : "disabled"} tone={voiceSettings.voiceNotificationsEnabled ? "green" : "muted"} />
        <TerminalStatRow label="voice_style" value={voiceSettings.selectedVoiceStyle} tone="cyan" />
        <TerminalStatRow label="read_context" value={voiceSettings.readLocationContext ? "enabled" : "disabled"} tone="amber" />
        <Select
          label="voice_style"
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
            {voiceSettings.voiceNotificationsEnabled ? "DISABLE_VOICE" : "ENABLE_VOICE"}
          </TerminalButton>
          <TerminalButton
            variant="secondary"
            onPress={() => speakReminder("You're near Shoprite. You asked me to buy cookies.", { ...voiceSettings, voiceNotificationsEnabled: true })}
          >
            PREVIEW_VOICE
          </TerminalButton>
        </View>
      </TerminalCard>

      <TerminalCard title="privacy_mode_enabled" active>
        <Text style={styles.body}>{PRIVACY_COPY.boundaries}</Text>
        <Text style={styles.body}>{PRIVACY_COPY.location}</Text>
        <Text style={styles.body}>{PRIVACY_COPY.microphone}</Text>
        <Text style={styles.body}>signal: listening? NO - waiting for user-defined triggers</Text>
      </TerminalCard>

      <View style={styles.row}>
        <TerminalButton variant="secondary" onPress={logout}>
          LOGOUT
        </TerminalButton>
        <TerminalButton variant="danger" onPress={deleteLocalData}>
          DELETE_LOCAL_DATA
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
