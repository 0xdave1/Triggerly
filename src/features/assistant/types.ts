import type { AgentPlan } from "@/features/chat/types";

export type Briefing = {
  id: string;
  type: "MORNING" | "EVENING" | "TRAVEL" | "CUSTOM";
  title: string;
  summary: string;
  items: Record<string, unknown>;
  generatedAt: string;
};

export type BriefingPreference = {
  morningBriefingEnabled: boolean;
  eveningBriefingEnabled: boolean;
  morningTime: string;
  eveningTime: string;
  includeWeather: boolean;
  includeActions: boolean;
  includeHabits: boolean;
  includeMemory: boolean;
  voiceEnabled: boolean;
};

export type PromiseItem = {
  id: string;
  personName: string;
  taskTitle: string;
  deadline?: string;
  status: "PENDING" | "COMPLETED" | "OVERDUE" | "CANCELLED";
};

export type DebtItem = {
  id: string;
  personName: string;
  amount: number | string;
  currency: string;
  direction: "OWED_TO_ME" | "I_OWE";
  status: "PENDING" | "PAID" | "CANCELLED";
};

export type PriceItem = {
  id: string;
  itemName: string;
  price: number;
  currency: string;
  placeName?: string;
  loggedAt: string;
};

export type TravelPlan = {
  id: string;
  destination: string;
  origin?: string;
  departureDate?: string;
  status: "PLANNED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  weatherAlertsEnabled: boolean;
  checklistItems: Array<{ id: string; title: string; completed: boolean }>;
};

export type AccountabilityGoal = {
  id: string;
  title: string;
  description?: string;
  frequencyType: "DAILY" | "WEEKLY" | "MONTHLY" | "CUSTOM";
  frequencyCount: number;
  strictness: "GENTLE" | "BALANCED" | "STRICT";
  status: "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";
};

export type FollowUpSuggestion = {
  id: string;
  title: string;
  description: string;
  suggestedActionType: string;
  status: "PENDING" | "ACCEPTED" | "DISMISSED" | "EXPIRED";
};

export type WidgetPreference = {
  nextTriggerEnabled: boolean;
  briefingEnabled: boolean;
  pendingActionsEnabled: boolean;
  weatherEnabled: boolean;
  habitsEnabled: boolean;
};

export type WidgetSummary = {
  generatedAt: string;
  nextTrigger?: { title: string } | null;
  briefing?: Briefing | null;
  pendingActions: number;
  accountabilityGoals: number;
  travel?: TravelPlan | null;
  weather?: { status: string } | null;
  nativeWidgetAvailable: false;
};

export type VoicePersonality = {
  style: "CALM" | "PROFESSIONAL" | "FRIENDLY_NIGERIAN" | "STRICT_COACH" | "MINIMAL" | "ENERGETIC";
  voiceNotificationsEnabled: boolean;
  readFullReminder: boolean;
  readSensitiveContent: boolean;
};

export type ShareCapture = {
  id: string;
  contentType: "TEXT" | "IMAGE" | "URL" | "FILE";
  rawText?: string;
  status: "RECEIVED" | "PARSED" | "CONFIRMED" | "DISCARDED";
  parsedPlan?: AgentPlan;
};
