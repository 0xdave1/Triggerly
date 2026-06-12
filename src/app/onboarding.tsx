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
      <TerminalHeader title="Remember what matters." subtitle="Private reminders for the right time, place, or routine." status="privacy protected" />
      <TerminalCard title="Built around your consent" active>
        <Text style={styles.title}>Private from the start. Useful when it matters.</Text>
        <Text style={styles.body}>{PRIVACY_COPY.headline}</Text>
        <TerminalStatRow label="Reminders" value="user-defined only" tone="green" />
        <TerminalStatRow label="location" value="used only for reminders you create" tone="cyan" />
        <TerminalStatRow label="Background audio" value="always disabled" tone="green" />
      </TerminalCard>

      <TerminalCard title="Clear privacy boundaries">
        <Text style={styles.body}>{PRIVACY_COPY.microphone}</Text>
        <Text style={styles.body}>{PRIVACY_COPY.location}</Text>
        <Text style={styles.body}>{PRIVACY_COPY.boundaries}</Text>
      </TerminalCard>

      <View style={styles.row}>
        <TerminalButton loading={requesting} onPress={requestNotifications}>
          Enable notifications
        </TerminalButton>
        <TerminalButton variant="secondary" onPress={() => router.replace("/")}>
          Continue
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
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 36
  },
  body: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: typography.body,
    lineHeight: 24
  }
});
