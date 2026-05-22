import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { TerminalButton } from "@/components/ui/TerminalButton";
import { TerminalCard } from "@/components/ui/TerminalCard";
import { TerminalHeader } from "@/components/ui/TerminalHeader";
import { TerminalScreen } from "@/components/ui/TerminalScreen";
import { TerminalStatRow } from "@/components/ui/TerminalStatRow";
import { PRIVACY_COPY } from "@/constants/copy";
import { getLocationPermissionStatus } from "@/features/location/permissions";
import type { PermissionState } from "@/features/location/types";
import { getNotificationPermissionStatus, requestNotificationPermission } from "@/features/notifications/permissions";
import { useReminderActions } from "@/features/reminders/hooks";
import { colors, spacing, typography } from "@/styles/theme";

export default function SettingsScreen() {
  const [notificationStatus, setNotificationStatus] = useState<PermissionState>("undetermined");
  const [locationStatus, setLocationStatus] = useState<PermissionState>("undetermined");
  const actions = useReminderActions();

  const refresh = async () => {
    setNotificationStatus(await getNotificationPermissionStatus());
    setLocationStatus(await getLocationPermissionStatus());
  };

  useEffect(() => {
    refresh();
  }, []);

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
        <TerminalStatRow label="notifications" value={notificationStatus} tone={notificationStatus === "granted" ? "green" : "amber"} />
        <TerminalStatRow label="location" value={locationStatus === "granted" ? "enabled when used" : "ask when needed"} tone={locationStatus === "granted" ? "cyan" : "amber"} />
        <TerminalStatRow label="microphone" value="tap-to-record only" tone="muted" />
        <TerminalStatRow label="background_audio" value="disabled" tone="green" />
        <TerminalStatRow label="auto_transactions" value="disabled" tone="green" />
        <TerminalStatRow label="data_export" value="available later" tone="muted" />
        <TerminalStatRow label="delete_data" value="available" tone="amber" />
        <TerminalButton variant="secondary" onPress={enableNotifications}>
          REQUEST_NOTIFICATIONS
        </TerminalButton>
      </TerminalCard>

      <TerminalCard title="privacy_mode_enabled" active>
        <Text style={styles.body}>{PRIVACY_COPY.boundaries}</Text>
        <Text style={styles.body}>{PRIVACY_COPY.location}</Text>
        <Text style={styles.body}>{PRIVACY_COPY.microphone}</Text>
        <Text style={styles.body}>signal: listening? NO · waiting for user-defined triggers</Text>
      </TerminalCard>

      <View style={styles.row}>
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
