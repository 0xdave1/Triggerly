import { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { ZodError } from "zod";
import { Select } from "@/components/ui/Select";
import { TerminalButton } from "@/components/ui/TerminalButton";
import { TerminalCard } from "@/components/ui/TerminalCard";
import { TerminalInput } from "@/components/ui/TerminalInput";
import { TerminalStatRow } from "@/components/ui/TerminalStatRow";
import { APP_CONFIG } from "@/constants/config";
import { getCurrentCoordinates } from "@/features/location/permissions";
import { reminderCreateSchema } from "@/features/reminders/schema";
import { useReminderStore } from "@/features/reminders/store";
import type { HabitFrequencyType, ReminderCreateInput, ReminderType, ReminderWithTriggers } from "@/features/reminders/types";
import { parseReminderInput } from "@/features/reminders/utils";
import { TriggerTypeSelector } from "./TriggerTypeSelector";
import { colors, spacing, typography } from "@/styles/theme";

type ReminderFormProps = {
  initialReminder?: ReminderWithTriggers;
  initialQuickInput?: string;
  onSubmit: (input: ReminderCreateInput) => Promise<void>;
  loading?: boolean;
};

export function ReminderForm({ initialReminder, initialQuickInput = "", onSubmit, loading }: ReminderFormProps) {
  const locationDraft = useReminderStore((state) => state.locationDraft);
  const setLocationDraft = useReminderStore((state) => state.setLocationDraft);
  const [quickInput, setQuickInput] = useState(initialQuickInput);
  const [title, setTitle] = useState(initialReminder?.title ?? "");
  const [notes, setNotes] = useState(initialReminder?.notes ?? "");
  const [type, setType] = useState<ReminderType>(initialReminder?.type ?? "time");
  const [triggerDateTime, setTriggerDateTime] = useState(initialReminder?.timeTrigger?.triggerDateTime ?? new Date(Date.now() + 3600000).toISOString());
  const [placeName, setPlaceName] = useState(initialReminder?.locationTrigger?.placeName ?? "");
  const [latitude, setLatitude] = useState(initialReminder?.locationTrigger?.latitude?.toString() ?? "");
  const [longitude, setLongitude] = useState(initialReminder?.locationTrigger?.longitude?.toString() ?? "");
  const [radiusMeters, setRadiusMeters] = useState(initialReminder?.locationTrigger?.radiusMeters ?? 250);
  const [locationTriggerType, setLocationTriggerType] = useState(initialReminder?.locationTrigger?.triggerType ?? "arrival");
  const [frequencyType, setFrequencyType] = useState<HabitFrequencyType>(initialReminder?.habit?.frequencyType ?? "daily");
  const [frequencyCount, setFrequencyCount] = useState(String(initialReminder?.habit?.frequencyCount ?? 1));
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!locationDraft) return;
    setPlaceName(locationDraft.placeName);
    if (typeof locationDraft.latitude === "number") setLatitude(String(locationDraft.latitude));
    if (typeof locationDraft.longitude === "number") setLongitude(String(locationDraft.longitude));
    setRadiusMeters(locationDraft.radiusMeters);
    setLocationTriggerType(locationDraft.triggerType);
  }, [locationDraft]);

  const parsedQuickInput = useMemo(() => (quickInput ? parseReminderInput(quickInput) : undefined), [quickInput]);

  useEffect(() => {
    if (!initialQuickInput) return;
    const parsed = parseReminderInput(initialQuickInput);
    setTitle(parsed.title);
    setType(parsed.triggerType);
    if (parsed.possibleLocationPhrase) setPlaceName(parsed.possibleLocationPhrase);
  }, [initialQuickInput]);

  const applyQuickInput = () => {
    if (!parsedQuickInput) return;
    setTitle(parsedQuickInput.title);
    setType(parsedQuickInput.triggerType);
    if (parsedQuickInput.possibleLocationPhrase) setPlaceName(parsedQuickInput.possibleLocationPhrase);
  };

  const submit = async () => {
    setError(undefined);
    const input: ReminderCreateInput = {
      title,
      notes,
      type,
      timeTrigger:
        type === "time" || type === "hybrid"
          ? { triggerDateTime, timezone: APP_CONFIG.defaultTimezone }
          : undefined,
      locationTrigger:
        type === "location" || type === "hybrid"
          ? {
              placeName,
              latitude: Number(latitude),
              longitude: Number(longitude),
              radiusMeters,
              triggerType: locationTriggerType
            }
          : undefined,
      habit:
        type === "habit"
          ? {
              frequencyType,
              frequencyCount: Number(frequencyCount)
            }
          : undefined
    };

    try {
      reminderCreateSchema.parse(input);
      await onSubmit(input);
      setLocationDraft(undefined);
    } catch (caught) {
      const message = caught instanceof ZodError ? caught.issues[0]?.message : caught instanceof Error ? caught.message : "Failed to save reminder.";
      setError(message);
    }
  };

  const fillCurrentLocation = async () => {
    try {
      const coords = await getCurrentCoordinates();
      setLatitude(String(coords.latitude));
      setLongitude(String(coords.longitude));
    } catch (caught) {
      Alert.alert("Location unavailable", caught instanceof Error ? caught.message : "Could not get your current location.");
    }
  };

  return (
    <View style={styles.stack}>
      <TerminalCard title="parse_reminder.local" tone="cyan">
        <TerminalInput command label="command_input" value={quickInput} onChangeText={setQuickInput} placeholder="remind me to call Ada tomorrow" />
        {parsedQuickInput ? (
          <View style={styles.parseBox}>
            <TerminalStatRow label="suggested_type" value={parsedQuickInput.triggerType} tone="cyan" />
            <TerminalStatRow label="confidence" value={`${Math.round(parsedQuickInput.confidence * 100)}%`} tone="green" />
            <TerminalButton variant="secondary" onPress={applyQuickInput}>
              USE_SUGGESTION
            </TerminalButton>
          </View>
        ) : null}
      </TerminalCard>

      <TerminalCard title="new_trigger.config" active>
        <TerminalInput label="task_name" value={title} onChangeText={setTitle} placeholder="pick up laundry" />
        <TerminalInput label="notes" value={notes} onChangeText={setNotes} placeholder="optional context" multiline />
        <TriggerTypeSelector value={type} onChange={setType} />
      </TerminalCard>

      {type === "time" ? (
        <TerminalCard title="time_trigger.config">
          <TerminalInput label="trigger_datetime" value={triggerDateTime} onChangeText={setTriggerDateTime} placeholder="2026-05-22T15:30:00.000Z" />
          <Text style={styles.help}>iso_datetime_required · native_picker_pending</Text>
        </TerminalCard>
      ) : null}

      {type === "location" ? (
        <TerminalCard title="location_trigger.config" tone="cyan">
          <TerminalInput label="place_name" value={placeName} onChangeText={setPlaceName} placeholder="home, office, Shoprite" />
          <View style={styles.row}>
            <TerminalButton variant="secondary" onPress={() => router.push("/reminders/location")}>
              OPEN_LOCATION_PICKER
            </TerminalButton>
            <TerminalButton variant="ghost" onPress={fillCurrentLocation}>
              USE_CURRENT_SIGNAL
            </TerminalButton>
          </View>
          <TerminalInput label="latitude" value={latitude} onChangeText={setLatitude} keyboardType="numeric" />
          <TerminalInput label="longitude" value={longitude} onChangeText={setLongitude} keyboardType="numeric" />
          <Select
            label="radius"
            value={radiusMeters}
            onChange={setRadiusMeters}
            options={APP_CONFIG.locationRadiusOptions.map((radius) => ({ label: radius === 1000 ? "1km" : `${radius}m`, value: radius }))}
          />
          <Select
            label="trigger_condition"
            value={locationTriggerType}
            onChange={setLocationTriggerType}
            options={[
              { label: "arrival_signal", value: "arrival" },
              { label: "departure_signal", value: "departure" }
            ]}
          />
        </TerminalCard>
      ) : null}

      {type === "habit" ? (
        <TerminalCard title="habit_loop.config" tone="amber">
          <Select
            label="habit_frequency"
            value={frequencyType}
            onChange={setFrequencyType}
            options={[
              { label: "daily", value: "daily" },
              { label: "weekly", value: "weekly" },
              { label: "monthly", value: "monthly" },
              { label: "custom", value: "custom" }
            ]}
          />
          <TerminalInput label="frequency_count" value={frequencyCount} onChangeText={setFrequencyCount} keyboardType="number-pad" />
        </TerminalCard>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.row}>
        <TerminalButton loading={loading} onPress={submit}>
          ARM_TRIGGER
        </TerminalButton>
        <TerminalButton variant="secondary" onPress={() => router.back()}>
          DISCARD
        </TerminalButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.lg
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  parseBox: {
    gap: spacing.sm
  },
  parseText: {
    color: colors.textMuted,
    fontFamily: typography.mono,
    fontSize: typography.small
  },
  help: {
    color: colors.textMuted,
    fontFamily: typography.mono,
    fontSize: typography.small,
    lineHeight: 18
  },
  error: {
    color: colors.danger,
    fontFamily: typography.mono,
    fontSize: typography.body,
    fontWeight: "700"
  }
});
