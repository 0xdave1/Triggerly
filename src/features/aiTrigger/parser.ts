import type { ActionPromptType, DeliveryMode, HabitFrequencyType, TriggerIntent, TriggerIntentType } from "@/features/reminders/types";
import { generateVoiceScript } from "@/features/voice/scripts";

export function parseTriggerIntent(input: string): TriggerIntent {
  const text = input.trim();
  const lower = text.toLowerCase();
  const locationCandidate = extractLocation(text);
  const contactCandidate = extractContact(text);
  const actionType = detectActionType(lower);
  const habit = detectHabit(lower);
  const timeCandidate = extractTime(text);
  const triggerType = detectTriggerType(lower, Boolean(locationCandidate), Boolean(contactCandidate), Boolean(actionType), Boolean(habit));
  const taskTitle = cleanTaskTitle(text, triggerType, locationCandidate, contactCandidate);
  const suggestedDeliveryMode = selectDeliveryMode(triggerType);

  const intent: TriggerIntent = {
    taskTitle,
    triggerType,
    locationCandidate,
    timeCandidate,
    habitCandidate: habit?.phrase,
    contactCandidate,
    suggestedDeliveryMode,
    suggestedVoiceScript: "",
    confidence: confidenceFor(triggerType, { locationCandidate, timeCandidate, habitCandidate: habit?.phrase, contactCandidate, actionType }),
    requiresConfirmation: true,
    frequency: habit?.frequency,
    dayOfWeek: habit?.dayOfWeek,
    timeOfDay: habit?.timeOfDay,
    actionType
  };

  return {
    ...intent,
    suggestedVoiceScript: generateVoiceScript(
      {
        taskTitle: intent.taskTitle,
        triggerType: intent.triggerType,
        place: intent.locationCandidate,
        habit: intent.habitCandidate,
        action: intent.actionType
      },
      {}
    )
  };
}

export function selectDeliveryMode(triggerType: TriggerIntentType): DeliveryMode {
  if (triggerType === "location_arrival" || triggerType === "location_departure" || triggerType === "errand_group") return "voice_and_push";
  if (triggerType === "action_prompt") return "push";
  return "push";
}

function detectTriggerType(
  lower: string,
  hasLocation: boolean,
  hasContact: boolean,
  hasAction: boolean,
  hasHabit: boolean
): TriggerIntentType {
  if (hasAction) return "action_prompt";
  if (hasHabit) return "habit";
  if (hasContact) return "contact";
  if (lower.includes("when i leave") || lower.includes("leave home") || lower.includes("leaving")) return "location_departure";
  if (hasLocation || lower.includes("when i get to") || lower.includes("when i arrive")) return "location_arrival";
  return "time";
}

function extractLocation(input: string): string | undefined {
  const match = input.match(/(?:when i get to|when i arrive at|when i leave|leaving|at)\s+([A-Za-z0-9 .'-]+?)(?:\.|,|$)/i);
  return match?.[1]?.replace(/^home$/i, "home").trim();
}

function extractContact(input: string): string | undefined {
  const match = input.match(/\b(?:call|text|message|email)\s+([A-Z][A-Za-z .'-]+)/);
  return match?.[1]?.trim();
}

function extractTime(input: string): string | undefined {
  const match = input.match(/\b(at\s+\d{1,2}(:\d{2})?\s?(am|pm)?|by\s+.+|tomorrow|tonight|today|evening|morning|afternoon|\d{1,2}:\d{2})\b/i);
  return match?.[0]?.trim();
}

function detectHabit(lower: string): { phrase: string; frequency: HabitFrequencyType; dayOfWeek?: string; timeOfDay?: string } | undefined {
  const day = lower.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/)?.[1];
  const timeOfDay = lower.match(/\b(morning|afternoon|evening|night)\b/)?.[1];
  if (lower.includes("every day") || lower.includes("daily")) return { phrase: "daily", frequency: "daily", timeOfDay };
  if (lower.includes("every week") || lower.includes("weekly") || day) {
    return { phrase: day ? `every ${day}` : "weekly", frequency: "weekly", dayOfWeek: capitalize(day), timeOfDay };
  }
  if (lower.includes("every month") || lower.includes("monthly")) return { phrase: "monthly", frequency: "monthly", timeOfDay };
  return undefined;
}

function detectActionType(lower: string): ActionPromptType | undefined {
  if (lower.includes("draft email") || lower.includes("write an email")) return "draft_email";
  if (lower.includes("pay ") || lower.includes("payment")) return "open_payment_app";
  if (lower.includes("call ")) return "call_contact";
  if (lower.includes("open maps") || lower.includes("directions")) return "open_maps";
  if (lower.includes("open url") || lower.includes("website")) return "open_url";
  return undefined;
}

function cleanTaskTitle(input: string, triggerType: TriggerIntentType, location?: string, contact?: string): string {
  let cleaned = input
    .replace(/^remind me to\s+/i, "")
    .replace(/^when i leave [^,]+,\s*remind me to\s+/i, "")
    .replace(/^when i get to [^,]+,\s*remind me to\s+/i, "")
    .replace(/\s+when i get to .+$/i, "")
    .replace(/\s+when i arrive at .+$/i, "")
    .replace(/\s+when i leave .+$/i, "")
    .replace(/^every\s+\w+\s+(morning|afternoon|evening|night)?\s*remind me to\s+/i, "")
    .replace(/\.$/, "")
    .trim();

  if (triggerType === "location_departure") cleaned = cleaned.replace(/^take /i, "take ");
  if (triggerType === "contact" && contact) cleaned = cleaned.replace(new RegExp(contact, "i"), contact);
  if (!cleaned || cleaned.toLowerCase() === location?.toLowerCase()) cleaned = input.trim();
  return sentenceCase(cleaned);
}

function confidenceFor(_type: TriggerIntentType, signals: Record<string, unknown>): number {
  const signalCount = Object.values(signals).filter(Boolean).length;
  return Math.min(0.95, 0.55 + signalCount * 0.12);
}

function sentenceCase(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function capitalize(value?: string): string | undefined {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : undefined;
}
