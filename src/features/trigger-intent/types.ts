import type { ActionPromptType, DeliveryMode, HabitFrequencyType, TriggerIntent, TriggerIntentType } from "@/features/reminders/types";

export type { ActionPromptType, DeliveryMode, HabitFrequencyType, TriggerIntent, TriggerIntentType };

export type IntentType =
  | "reminder"
  | "memory"
  | "action_prompt"
  | "habit"
  | "price_log"
  | "debt_memory"
  | "promise_memory"
  | "travel_plan"
  | "weather_trigger"
  | "exchange_rate_trigger"
  | "daily_briefing_request"
  | "unknown";

export type AiTriggerType =
  | "time"
  | "location_arrival"
  | "location_departure"
  | "habit"
  | "weather"
  | "exchange_rate"
  | "price"
  | "contact"
  | "travel"
  | "action_confirmation";

export type ParsedIntent = {
  intentType: IntentType;
  taskTitle?: string;
  triggerType?: AiTriggerType;
  timeCandidate?: Record<string, unknown>;
  locationCandidate?: Record<string, unknown>;
  habitCandidate?: Record<string, unknown>;
  weatherCandidate?: Record<string, unknown>;
  exchangeRateCandidate?: Record<string, unknown>;
  priceCandidate?: Record<string, unknown>;
  contactCandidate?: Record<string, unknown>;
  actionCandidate?: {
    actionType: string;
    payload: Record<string, unknown>;
  };
  memoryCandidate?: Record<string, unknown>;
  destination?: string;
  baseCurrency?: string;
  quoteCurrency?: string;
  targetRate?: number;
  condition?: string;
  item?: string;
  price?: number;
  currency?: string;
  place?: string;
  person?: string;
  amount?: number;
  direction?: "receivable" | "payable";
  deadline?: string;
  actionType?: string;
  recipientCandidate?: string;
  topic?: string;
  frequency?: string;
  dayOfWeek?: string;
  timeOfDay?: string;
  suggestedDeliveryMode?: string;
  confidence: number;
  requiresConfirmation: true;
  sensitive?: boolean;
  sensitiveCategories?: string[];
  executionAllowed?: false;
  clarificationQuestion?: string;
  suggestedVoiceScript?: string;
};

export type IntentConfirmationState = {
  input: string;
  parsed?: ParsedIntent;
  source: "backend" | "local_fallback";
};
