import { ActionType, DeliveryMode } from "@/common/enums";

export type IntentType =
  | "reminder"
  | "habit"
  | "memory"
  | "price_log"
  | "debt_memory"
  | "promise_memory"
  | "travel_plan"
  | "weather_trigger"
  | "exchange_rate_trigger"
  | "action_prompt"
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

export type SensitiveActionCategory =
  | "payment"
  | "email_sending"
  | "message_sending"
  | "contact_access"
  | "location_tracking";

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
    actionType: ActionType;
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
  suggestedDeliveryMode?: DeliveryMode;
  confidence: number;
  requiresConfirmation: true;
  sensitive?: boolean;
  sensitiveCategories?: SensitiveActionCategory[];
  executionAllowed?: false;
  clarificationQuestion?: string;
  suggestedVoiceScript?: string;
};

export type IntentParserContext = {
  userId: string;
};

export interface IntentParserProvider {
  parse(input: string, context: IntentParserContext): Promise<ParsedIntent>;
}
