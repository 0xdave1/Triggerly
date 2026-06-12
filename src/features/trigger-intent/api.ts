import { apiClient, isBackendUnavailable } from "@/lib/apiClient";
import { parseTriggerIntent } from "./parser";
import type { ParsedIntent } from "./types";

export async function parseIntent(input: string): Promise<{ parsed: ParsedIntent; source: "backend" | "local_fallback" }> {
  try {
    const parsed = await apiClient<ParsedIntent>({
      method: "POST",
      path: "/ai/parse-intent",
      body: { input }
    });
    return { parsed, source: "backend" };
  } catch (error) {
    if (!isBackendUnavailable(error)) throw error;
    return { parsed: localFallback(input), source: "local_fallback" };
  }
}

function localFallback(input: string): ParsedIntent {
  const local = parseTriggerIntent(input);
  return {
    intentType: local.triggerType === "action_prompt" ? "action_prompt" : local.triggerType === "habit" ? "habit" : "reminder",
    taskTitle: local.taskTitle,
    triggerType: local.triggerType === "errand_group" || local.triggerType === "action_prompt" ? undefined : local.triggerType,
    locationCandidate: local.locationCandidate ? { placeName: local.locationCandidate } : undefined,
    timeCandidate: local.timeCandidate ? { phrase: local.timeCandidate } : undefined,
    habitCandidate: local.habitCandidate ? { phrase: local.habitCandidate } : undefined,
    contactCandidate: local.contactCandidate ? { name: local.contactCandidate } : undefined,
    actionCandidate: local.actionType ? { actionType: local.actionType, payload: { safety: "confirmation_required" } } : undefined,
    suggestedDeliveryMode: local.suggestedDeliveryMode,
    confidence: local.confidence,
    requiresConfirmation: true,
    suggestedVoiceScript: local.suggestedVoiceScript
  };
}
