import { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { IntentConfirmationCard } from "@/components/reminders/IntentConfirmationCard";
import { Select } from "@/components/ui/Select";
import { TerminalButton } from "@/components/ui/TerminalButton";
import { TerminalCard } from "@/components/ui/TerminalCard";
import { TerminalHeader } from "@/components/ui/TerminalHeader";
import { TerminalInput } from "@/components/ui/TerminalInput";
import { TerminalScreen } from "@/components/ui/TerminalScreen";
import { TerminalStatRow } from "@/components/ui/TerminalStatRow";
import { APP_CONFIG } from "@/constants/config";
import { useActionPromptActions } from "@/features/action-prompts/hooks";
import type { ActionPromptType } from "@/features/action-prompts/types";
import { useLiveContextActions } from "@/features/live-context/hooks";
import { useMemoryActions } from "@/features/memory/hooks";
import { consumeReminderApiWarning } from "@/features/reminders/api";
import { useCreateReminder } from "@/features/reminders/hooks";
import type { DeliveryMode, ReminderCreateInput, TriggerIntentType } from "@/features/reminders/types";
import { canConfirmIntent, getIntentGateMessage } from "@/features/trigger-intent/intentConfirmation";
import { useParseIntent } from "@/features/trigger-intent/hooks";
import { parseTriggerIntent } from "@/features/trigger-intent/parser";
import type { ParsedIntent } from "@/features/trigger-intent/types";
import { getFriendlyApiError } from "@/lib/apiClient";
import { colors, spacing, typography } from "@/styles/theme";

const triggerOptions: Array<{ label: string; value: TriggerIntentType }> = [
  { label: "time", value: "time" },
  { label: "location_arrival", value: "location_arrival" },
  { label: "location_departure", value: "location_departure" },
  { label: "habit", value: "habit" },
  { label: "weather", value: "weather" },
  { label: "exchange_rate", value: "exchange_rate" },
  { label: "price", value: "price" },
  { label: "travel", value: "travel" },
  { label: "action_confirmation", value: "action_confirmation" },
  { label: "contact", value: "contact" },
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
  const input = params.input ?? "";
  const localIntent = useMemo(() => parseTriggerIntent(input), [input]);
  const parseIntent = useParseIntent();
  const createReminder = useCreateReminder();
  const memoryActions = useMemoryActions();
  const actionPrompts = useActionPromptActions();
  const liveContext = useLiveContextActions();
  const [parsed, setParsed] = useState<ParsedIntent>();
  const [source, setSource] = useState<"backend" | "local_fallback">("local_fallback");
  const [taskTitle, setTaskTitle] = useState(localIntent.taskTitle);
  const [triggerType, setTriggerType] = useState<TriggerIntentType>(localIntent.triggerType);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>(localIntent.suggestedDeliveryMode);
  const [voiceScript, setVoiceScript] = useState(localIntent.suggestedVoiceScript);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!input.trim()) return;
    parseIntent.mutate(input, {
      onSuccess: ({ parsed: next, source: nextSource }) => {
        setParsed(next);
        setSource(nextSource);
        setTaskTitle(next.taskTitle ?? localIntent.taskTitle);
        setTriggerType((next.triggerType as TriggerIntentType | undefined) ?? localIntent.triggerType);
        setDeliveryMode((String(next.suggestedDeliveryMode ?? localIntent.suggestedDeliveryMode).toLowerCase() as DeliveryMode) ?? "push");
        setVoiceScript(next.suggestedVoiceScript ?? localIntent.suggestedVoiceScript);
      },
      onError: (caught) => setError(getFriendlyApiError(caught))
    });
  }, [input]);

  const confirm = async () => {
    if (!parsed) return;
    setError(undefined);
    try {
      if (parsed.intentType === "memory" || parsed.intentType === "price_log" || parsed.intentType === "debt_memory" || parsed.intentType === "promise_memory") {
        await memoryActions.confirmFromIntent.mutateAsync({
          parsedIntent: { ...parsed, taskTitle: taskTitle || parsed.taskTitle },
          overrides: {
            title: taskTitle || parsed.taskTitle || "User-approved memory",
            body: taskTitle || parsed.taskTitle || "Confirmed from Triggerly intent"
          }
        });
      } else if (parsed.intentType === "action_prompt" && parsed.actionCandidate) {
        await actionPrompts.create.mutateAsync({
          actionType: parsed.actionCandidate.actionType.toLowerCase() as ActionPromptType,
          payload: parsed.actionCandidate.payload
        });
      } else if (parsed.triggerType === "weather") {
        await liveContext.createWeatherTrigger.mutateAsync({
          confirmed: true,
          location: String(parsed.weatherCandidate?.location ?? parsed.locationCandidate?.placeName ?? "Lagos")
        });
      } else if (parsed.triggerType === "exchange_rate") {
        await liveContext.createExchangeRateTrigger.mutateAsync({
          confirmed: true,
          base: String(parsed.exchangeRateCandidate?.base ?? "USD"),
          quote: String(parsed.exchangeRateCandidate?.quote ?? "NGN"),
          targetRate: Number(parsed.exchangeRateCandidate?.targetRate ?? 0) || undefined
        });
      } else {
        await createReminder.mutateAsync(buildReminderInput(parsed, taskTitle, triggerType, deliveryMode, voiceScript));
        const warning = consumeReminderApiWarning();
        if (warning) Alert.alert("Saved with warning", warning);
      }
      router.replace("/");
    } catch (caught) {
      setError(getFriendlyApiError(caught));
    }
  };

  const gateMessage = getIntentGateMessage(parsed);

  return (
    <TerminalScreen>
      <TerminalHeader title="ai_trigger_engine" subtitle="intent_parsed · confirmation_required" status="action_locked" />
      <IntentConfirmationCard intent={parsed} source={source} />
      {parseIntent.isPending ? <Text style={styles.help}>parsing_intent...</Text> : null}
      {gateMessage ? <Text style={styles.warning}>{gateMessage}</Text> : null}

      {parsed?.memoryCandidate || parsed?.intentType === "price_log" || parsed?.intentType === "debt_memory" || parsed?.intentType === "promise_memory" ? (
        <TerminalCard title="memory_confirmation" tone="cyan">
          <Text style={styles.help}>Triggerly found something worth remembering. It will only be saved if you confirm.</Text>
          <TerminalStatRow label="save_mode" value="user_approved_only" tone="green" />
        </TerminalCard>
      ) : null}

      <TerminalCard title="editable_confirmation" active>
        <TerminalInput label="task_title" value={taskTitle} onChangeText={setTaskTitle} />
        <Select label="trigger_type" value={triggerType} options={triggerOptions} onChange={setTriggerType} />
        <Select label="delivery_mode" value={deliveryMode} options={deliveryOptions} onChange={setDeliveryMode} />
        <TerminalInput label="voice_script" value={voiceScript} onChangeText={setVoiceScript} multiline />
      </TerminalCard>

      {parsed?.actionCandidate ? (
        <TerminalCard title="action_prompt" tone="amber">
          <TerminalStatRow label="action_type" value={parsed.actionCandidate.actionType.toLowerCase()} tone="amber" />
          <TerminalStatRow label="auto_execute" value="disabled" tone="green" />
          <Text style={styles.help}>No payment, email, or message is sent automatically.</Text>
        </TerminalCard>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.row}>
        <TerminalButton loading={createReminder.isPending || memoryActions.confirmFromIntent.isPending || actionPrompts.create.isPending} disabled={!canConfirmIntent(parsed)} onPress={confirm}>
          CONFIRM
        </TerminalButton>
        <TerminalButton variant="secondary" onPress={() => router.back()}>
          EDIT
        </TerminalButton>
        <TerminalButton variant="ghost" onPress={() => Alert.alert("clarification", parsed?.clarificationQuestion ?? "What should Triggerly do with this?")}>
          ASK_CLARIFICATION
        </TerminalButton>
        <TerminalButton variant="danger" onPress={() => router.replace("/")}>
          DISCARD
        </TerminalButton>
      </View>
    </TerminalScreen>
  );
}

function buildReminderInput(intent: ParsedIntent, title: string, triggerType: TriggerIntentType, deliveryMode: DeliveryMode, voiceScript: string): ReminderCreateInput {
  const base = {
    title: title || intent.taskTitle || "Untitled trigger",
    deliveryMode,
    voiceScript,
    voiceEnabled: deliveryMode === "voice" || deliveryMode === "voice_and_push"
  };

  if (triggerType === "location_arrival" || triggerType === "location_departure") {
    return {
      ...base,
      type: "location",
      locationTrigger: {
        placeName: String(intent.locationCandidate?.placeName ?? "Selected place"),
        latitude: Number(intent.locationCandidate?.latitude ?? 0),
        longitude: Number(intent.locationCandidate?.longitude ?? 0),
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
        frequencyType: frequencyFrom(intent),
        frequencyCount: Number(intent.habitCandidate?.frequencyCount ?? 1)
      }
    };
  }

  return {
    ...base,
    type: "time",
    timeTrigger: {
      triggerDateTime: normalizeTimeCandidate(String(intent.timeCandidate?.phrase ?? new Date(Date.now() + 3600000).toISOString())),
      timezone: APP_CONFIG.defaultTimezone
    }
  };
}

function frequencyFrom(intent: ParsedIntent) {
  const frequency = String(intent.habitCandidate?.frequency ?? "weekly").toLowerCase();
  if (frequency === "daily" || frequency === "weekly" || frequency === "monthly") return frequency;
  return "custom";
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
  warning: {
    color: colors.warning,
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
