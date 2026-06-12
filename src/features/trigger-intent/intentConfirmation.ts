import type { ParsedIntent } from "./types";

export function canConfirmIntent(intent?: ParsedIntent): boolean {
  if (!intent || !intent.requiresConfirmation) return false;
  if (intent.intentType === "unknown") return false;
  if (intent.actionCandidate?.actionType?.toLowerCase().includes("payment")) return true;
  return intent.confidence >= 0.35;
}

export function getIntentGateMessage(intent?: ParsedIntent): string | undefined {
  if (!intent) return "intent_not_parsed";
  if (intent.intentType === "unknown") return intent.clarificationQuestion ?? "Triggerly needs a little more detail.";
  if (intent.actionCandidate?.actionType === "OPEN_PAYMENT_APP") return "Payment actions require explicit permission and confirmation.";
  return undefined;
}

export function describeCandidate(value?: Record<string, unknown>): string {
  if (!value) return "none";
  return Object.entries(value)
    .filter(([, item]) => item !== undefined && item !== null && item !== "")
    .map(([key, item]) => `${key}:${String(item)}`)
    .join(" | ") || "none";
}
