import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Select } from "@/components/ui/Select";
import { TerminalButton } from "@/components/ui/TerminalButton";
import { TerminalCard } from "@/components/ui/TerminalCard";
import { TerminalHeader } from "@/components/ui/TerminalHeader";
import { TerminalInput } from "@/components/ui/TerminalInput";
import { TerminalScreen } from "@/components/ui/TerminalScreen";
import { TerminalStatRow } from "@/components/ui/TerminalStatRow";
import { APP_CONFIG } from "@/constants/config";
import { getCurrentCoordinates } from "@/features/location/permissions";
import { useReminderStore } from "@/features/reminders/store";
import type { LocationTriggerType } from "@/features/reminders/types";
import { colors, spacing, typography } from "@/styles/theme";

export default function LocationPickerScreen() {
  const setLocationDraft = useReminderStore((state) => state.setLocationDraft);
  const currentDraft = useReminderStore((state) => state.locationDraft);
  const [placeName, setPlaceName] = useState(currentDraft?.placeName ?? "");
  const [latitude, setLatitude] = useState(currentDraft?.latitude?.toString() ?? "");
  const [longitude, setLongitude] = useState(currentDraft?.longitude?.toString() ?? "");
  const [radiusMeters, setRadiusMeters] = useState(currentDraft?.radiusMeters ?? 250);
  const [triggerType, setTriggerType] = useState<LocationTriggerType>(currentDraft?.triggerType ?? "arrival");

  const useCurrentLocation = async () => {
    try {
      const coords = await getCurrentCoordinates();
      setLatitude(String(coords.latitude));
      setLongitude(String(coords.longitude));
    } catch (error) {
      Alert.alert("Location unavailable", error instanceof Error ? error.message : "Could not get your current location.");
    }
  };

  const save = () => {
    setLocationDraft({
      placeName,
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,
      radiusMeters,
      triggerType
    });
    router.back();
  };

  return (
    <TerminalScreen>
      <TerminalHeader title="Choose a place" subtitle="Location is requested only for reminders you create." status="ask when needed" />
      <TerminalCard title="Location details" tone="cyan" active>
        <Text style={styles.body}>manual_search_mvp · current_signal_available</Text>
        <TerminalInput label="place_name" value={placeName} onChangeText={setPlaceName} placeholder="Shoprite, home, office" />
        <TerminalButton variant="secondary" onPress={useCurrentLocation}>
          Use current location
        </TerminalButton>
      </TerminalCard>

      <TerminalCard title="coordinates">
        <TerminalStatRow label="latitude" value={latitude || "not_selected"} tone="cyan" />
        <TerminalStatRow label="longitude" value={longitude || "not_selected"} tone="cyan" />
        <TerminalInput label="latitude" value={latitude} onChangeText={setLatitude} keyboardType="numeric" />
        <TerminalInput label="longitude" value={longitude} onChangeText={setLongitude} keyboardType="numeric" />
        <Select
          label="radius"
          value={radiusMeters}
          onChange={setRadiusMeters}
          options={APP_CONFIG.locationRadiusOptions.map((radius) => ({ label: radius === 1000 ? "1km" : `${radius}m`, value: radius }))}
        />
        <Select
          label="When to remind me"
          value={triggerType}
          onChange={setTriggerType}
          options={[
            { label: "arrival_signal", value: "arrival" },
            { label: "departure_signal", value: "departure" }
          ]}
        />
      </TerminalCard>

      <View style={styles.row}>
        <TerminalButton onPress={save}>Use this location</TerminalButton>
        <TerminalButton variant="secondary" onPress={() => router.back()}>Cancel</TerminalButton>
      </View>
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
