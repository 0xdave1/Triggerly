import { useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Select } from "@/components/ui/Select";
import { TerminalButton } from "@/components/ui/TerminalButton";
import { TerminalCard } from "@/components/ui/TerminalCard";
import { TerminalHeader } from "@/components/ui/TerminalHeader";
import { TerminalInput } from "@/components/ui/TerminalInput";
import { TerminalScreen } from "@/components/ui/TerminalScreen";
import { TerminalStatRow } from "@/components/ui/TerminalStatRow";
import { APP_CONFIG } from "@/constants/config";
import { parseTriggerIntent } from "@/features/aiTrigger/parser";
import { consumeReminderApiWarning } from "@/features/reminders/api";
import { useCreateReminder } from "@/features/reminders/hooks";
import type { DeliveryMode, ReminderCreateInput, TriggerIntentType } from "@/features/reminders/types";
import { getFriendlyApiError } from "@/lib/apiClient";
import { colors, spacing, typography } from "@/styles/theme";

const triggerOptions: Array<{ label: string; value: TriggerIntentType }> = [
  { label: "time", value: "time" },
  { label: "location_arrival", value: "location_arrival" },
  { label: "location_departure", value: "location_departure" },
  { label: "habit", value: "habit" },
  { label: "contact", value: "contact" },
  { label: "errand_group", value: "errand_group" },
  { label: "action_prompt", value: "action_prompt" }
];

const deliveryOptions: Array<{ label: string; value: DeliveryMode }> = [
  { label: "push", value: "push" },
  { label: "voice", value: "voice" },
  { label: "voice_and_push", value: "voice_and_push" },
  { label: "silent", value: "silent" },
  { label: "urgent", value: "urgent" }
];

export default function TriggerConfirmationScreen() {
  const params = useLocalSearchParams<{ input?: string }>();
  const initialIntent = useMemo(() => parseTriggerIntent(params.input ?? ""), [params.input]);
  const createReminder = useCreateReminder();
  const [taskTitle, setTaskTitle] = useState(initialIntent.taskTitle);
  const [triggerType, setTriggerType] = useState<TriggerIntentType>(initialIntent.triggerType);
  const [locationCandidate, setLocationCandidate] = useState(initialIntent.locationCandidate ?? "");
  const [timeCandidate, setTimeCandidate] = useState(initialIntent.timeCandidate ?? new Date(Date.now() + 3600000).toISOString());
  const [contactCandidate, setContactCandidate] = useState(initialIntent.contactCandidate ?? "");
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>(initialIntent.suggestedDeliveryMode);
  const [voiceScript, setVoiceScript] = useState(initialIntent.suggestedVoiceScript);
  const [error, setError] = useState<string>();

  const save = async () => {
    setError(undefined);
    const input = buildReminderInput();
    try {
      await createReminder.mutateAsync(input);
      const warning = consumeReminderApiWarning();
      if (warning) Alert.alert("Saved with warning", warning);
      router.replace("/");
    } catch (caught) {
      setError(getFriendlyApiError(caught));
    }
  };

  const buildReminderInput = (): ReminderCreateInput => {
    const base = {
      title: taskTitle,
      deliveryMode,
      voiceScript,
      voiceEnabled: deliveryMode === "voice" || deliveryMode === "voice_and_push",
      contactName: contactCandidate || undefined,
      actionType: initialIntent.actionType
    };

    if (triggerType === "location_arrival" || triggerType === "location_departure" || triggerType === "errand_group") {
      return {
        ...base,
        type: "location",
        locationTrigger: {
          placeName: locationCandidate || "Selected place",
          latitude: 0,
          longitude: 0,
          radiusMeters: 250,
          triggerType: triggerType === "location_departure" ? "departure" : "arrival"
        }
      };
    }

    if (triggerType === "habit") {
      return {
        ...base,
        type: "habit",
        habit: {
          frequencyType: initialIntent.frequency ?? "weekly",
          frequencyCount: 1
        }
      };
    }

    return {
      ...base,
      type: "time",
      timeTrigger: {
        triggerDateTime: normalizeTimeCandidate(timeCandidate),
        timezone: APP_CONFIG.defaultTimezone
      }
    };
  };

  return (
    <TerminalScreen>
      <TerminalHeader title="ai_trigger_engine" subtitle="intent_parsed · confirmation_required" status="action_locked" />
      <TerminalCard title="intent_parsed" active>
        <TerminalStatRow label="confidence" value={`${Math.round(initialIntent.confidence * 100)}%`} tone="green" />
        <TerminalStatRow label="requires_confirmation" value="enabled" tone="amber" />
        <TerminalInput label="task_title" value={taskTitle} onChangeText={setTaskTitle} />
        <Select label="trigger_type" value={triggerType} options={triggerOptions} onChange={setTriggerType} />
        <Select label="delivery_mode" value={deliveryMode} options={deliveryOptions} onChange={setDeliveryMode} />
      </TerminalCard>

      {(triggerType === "location_arrival" || triggerType === "location_departure" || triggerType === "errand_group") ? (
        <TerminalCard title="location_candidate" tone="cyan">
          <TerminalInput label="place" value={locationCandidate} onChangeText={setLocationCandidate} placeholder="Shoprite" />
          <Text style={styles.help}>coordinates_required_later · open full location picker after saving if needed</Text>
        </TerminalCard>
      ) : null}

      {triggerType === "time" ? (
        <TerminalCard title="time_candidate">
          <TerminalInput label="time" value={timeCandidate} onChangeText={setTimeCandidate} />
        </TerminalCard>
      ) : null}

      {triggerType === "contact" ? (
        <TerminalCard title="contact_placeholder">
          <TerminalInput label="contact_name" value={contactCandidate} onChangeText={setContactCandidate} placeholder="David" />
          <Text style={styles.help}>contacts_permission_requested_only_when_contact_picker_is_used</Text>
        </TerminalCard>
      ) : null}

      {triggerType === "action_prompt" ? (
        <TerminalCard title="user_approval_required" tone="amber">
          <TerminalStatRow label="action_type" value={initialIntent.actionType ?? "manual_confirmation"} tone="amber" />
          <Text style={styles.help}>Triggerly can prepare actions, but will not send money or emails automatically.</Text>
        </TerminalCard>
      ) : null}

      <TerminalCard title="voice_nudge_ready">
        <TerminalInput label="voice_script" value={voiceScript} onChangeText={setVoiceScript} multiline />
      </TerminalCard>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.row}>
        <TerminalButton loading={createReminder.isPending} disabled={!taskTitle.trim()} onPress={save}>
          ARM_TRIGGER
        </TerminalButton>
        <TerminalButton variant="secondary" onPress={() => router.back()}>
          EDIT_TRIGGER
        </TerminalButton>
      </View>
    </TerminalScreen>
  );
}

function normalizeTimeCandidate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(Date.now() + 3600000).toISOString() : date.toISOString();
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  help: {
    color: colors.textMuted,
    fontFamily: typography.mono,
    fontSize: typography.small,
    lineHeight: 20
  },
  error: {
    color: colors.danger,
    fontFamily: typography.mono,
    fontSize: typography.small,
    lineHeight: 20
  }
});
