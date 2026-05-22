import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { TerminalButton } from "@/components/ui/TerminalButton";
import { TerminalCard } from "@/components/ui/TerminalCard";
import { TerminalHeader } from "@/components/ui/TerminalHeader";
import { TerminalScreen } from "@/components/ui/TerminalScreen";
import { TerminalStatRow } from "@/components/ui/TerminalStatRow";
import { PRIVACY_COPY } from "@/constants/copy";
import { requestNotificationPermission } from "@/features/notifications/permissions";
import { colors, spacing, typography } from "@/styles/theme";

export default function OnboardingScreen() {
  const [requesting, setRequesting] = useState(false);

  const requestNotifications = async () => {
    setRequesting(true);
    const status = await requestNotificationPermission();
    setRequesting(false);
    if (status !== "granted") {
      Alert.alert("Notifications disabled", "You can still create reminders, but time reminders need notifications to alert you.");
    }
  };

  return (
    <TerminalScreen>
      <TerminalHeader title="triggerly.sh" subtitle="memory_trigger_engine" status="privacy_mode: on" />
      <TerminalCard title="boot_sequence" active>
        <Text style={styles.title}>PERSONAL REMINDER TERMINAL</Text>
        <Text style={styles.body}>{PRIVACY_COPY.headline}</Text>
        <TerminalStatRow label="mode" value="user-defined triggers only" tone="green" />
        <TerminalStatRow label="location" value="used only for reminders you create" tone="cyan" />
        <TerminalStatRow label="background_audio" value="disabled" tone="green" />
      </TerminalCard>

      <TerminalCard title="privacy_boundaries">
        <Text style={styles.body}>{PRIVACY_COPY.microphone}</Text>
        <Text style={styles.body}>{PRIVACY_COPY.location}</Text>
        <Text style={styles.body}>{PRIVACY_COPY.boundaries}</Text>
      </TerminalCard>

      <View style={styles.row}>
        <TerminalButton loading={requesting} onPress={requestNotifications}>
          ENABLE_NOTIFICATIONS
        </TerminalButton>
        <TerminalButton variant="secondary" onPress={() => router.replace("/")}>
          CONTINUE
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
  title: {
    color: colors.primary,
    fontFamily: typography.mono,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: typography.letterSpacing,
    lineHeight: 32
  },
  body: {
    color: colors.textMuted,
    fontFamily: typography.mono,
    fontSize: typography.body,
    lineHeight: 24
  }
});
