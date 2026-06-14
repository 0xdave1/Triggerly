import { apiClient } from "@/lib/apiClient";
import type {
  AccountabilityGoal,
  Briefing,
  BriefingPreference,
  DebtItem,
  FollowUpSuggestion,
  PriceItem,
  PromiseItem,
  ShareCapture,
  TravelPlan,
  VoicePersonality,
  WidgetPreference,
  WidgetSummary
} from "./types";
import type { AgentPlan } from "@/features/chat/types";

export const assistantApi = {
  briefing: () => apiClient<Briefing>({ method: "GET", path: "/briefings/today" }),
  generateBriefing: (type: Briefing["type"] = "MORNING") =>
    apiClient<Briefing>({ method: "POST", path: "/briefings/generate", body: { type } }),
  briefingPreferences: () => apiClient<BriefingPreference>({ method: "GET", path: "/briefings/preferences" }),
  updateBriefingPreferences: (input: Partial<BriefingPreference>) =>
    apiClient<BriefingPreference>({ method: "PATCH", path: "/briefings/preferences", body: input }),
  turnThisInto: (input: { sourceMessageId: string; targetType: string }) =>
    apiClient<{ agentRunId: string; plan: AgentPlan }>({ method: "POST", path: "/agent/turn-this-into", body: input }),
  promises: () => apiClient<PromiseItem[]>({ method: "GET", path: "/promises" }),
  completePromise: (id: string) => apiClient<PromiseItem>({ method: "POST", path: `/promises/${id}/complete` }),
  debts: () => apiClient<DebtItem[]>({ method: "GET", path: "/debts" }),
  settleDebt: (id: string) => apiClient<DebtItem>({ method: "POST", path: `/debts/${id}/settle` }),
  prices: () => apiClient<PriceItem[]>({ method: "GET", path: "/prices" }),
  travels: () => apiClient<TravelPlan[]>({ method: "GET", path: "/travel-plans" }),
  generateTravelChecklist: (id: string) => apiClient<TravelPlan>({ method: "POST", path: `/travel-plans/${id}/generate-checklist` }),
  accountability: () => apiClient<AccountabilityGoal[]>({ method: "GET", path: "/accountability/goals" }),
  checkIn: (id: string, status: "DONE" | "MISSED" | "SNOOZED") =>
    apiClient({ method: "POST", path: `/accountability/goals/${id}/check-in`, body: { status } }),
  followUps: () => apiClient<FollowUpSuggestion[]>({ method: "GET", path: "/follow-up/suggestions" }),
  acceptFollowUp: (id: string) => apiClient<{ plan: AgentPlan }>({ method: "POST", path: `/follow-up/suggestions/${id}/accept` }),
  dismissFollowUp: (id: string) => apiClient({ method: "POST", path: `/follow-up/suggestions/${id}/dismiss` }),
  widgetSummary: () => apiClient<WidgetSummary>({ method: "GET", path: "/widgets/summary" }),
  widgetPreferences: () => apiClient<WidgetPreference>({ method: "GET", path: "/widgets/preferences" }),
  updateWidgetPreferences: (input: Partial<WidgetPreference>) =>
    apiClient<WidgetPreference>({ method: "PATCH", path: "/widgets/preferences", body: input }),
  voicePersonality: () => apiClient<VoicePersonality>({ method: "GET", path: "/voice/personality" }),
  updateVoicePersonality: (input: Partial<VoicePersonality>) =>
    apiClient<VoicePersonality>({ method: "PATCH", path: "/voice/personality", body: input }),
  createShareCapture: (rawText: string) =>
    apiClient<ShareCapture>({ method: "POST", path: "/share-capture", body: { contentType: "TEXT", rawText } }),
  parseShareCapture: (id: string) =>
    apiClient<{ captureId: string; plan: AgentPlan }>({ method: "POST", path: `/share-capture/${id}/parse` }),
  confirmShareCapture: (id: string) =>
    apiClient<{ agentRunId: string; plan: AgentPlan; result: { message: string } }>({ method: "POST", path: `/share-capture/${id}/confirm` }),
  smartSnooze: (input: { id: string; mode: string }) =>
    apiClient({ method: "POST", path: `/triggers/${input.id}/snooze-smart`, body: { mode: input.mode } })
};
