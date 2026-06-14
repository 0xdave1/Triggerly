import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assistantApi } from "./api";
import type { BriefingPreference, VoicePersonality, WidgetPreference } from "./types";

export const assistantKeys = {
  all: ["assistant"] as const,
  briefing: ["assistant", "briefing"] as const,
  promises: ["assistant", "promises"] as const,
  debts: ["assistant", "debts"] as const,
  prices: ["assistant", "prices"] as const,
  travel: ["assistant", "travel"] as const,
  accountability: ["assistant", "accountability"] as const,
  followUps: ["assistant", "follow-ups"] as const,
  widgets: ["assistant", "widgets"] as const,
  voice: ["assistant", "voice-personality"] as const
};

export const useDailyBriefing = () => useQuery({ queryKey: assistantKeys.briefing, queryFn: assistantApi.briefing });
export const usePromises = () => useQuery({ queryKey: assistantKeys.promises, queryFn: assistantApi.promises });
export const useDebts = () => useQuery({ queryKey: assistantKeys.debts, queryFn: assistantApi.debts });
export const usePrices = () => useQuery({ queryKey: assistantKeys.prices, queryFn: assistantApi.prices });
export const useTravelPlans = () => useQuery({ queryKey: assistantKeys.travel, queryFn: assistantApi.travels });
export const useAccountabilityGoals = () => useQuery({ queryKey: assistantKeys.accountability, queryFn: assistantApi.accountability });
export const useFollowUps = () => useQuery({ queryKey: assistantKeys.followUps, queryFn: assistantApi.followUps });
export const useWidgetSummary = () => useQuery({ queryKey: assistantKeys.widgets, queryFn: assistantApi.widgetSummary });
export const useWidgetPreferences = () => useQuery({ queryKey: [...assistantKeys.widgets, "preferences"], queryFn: assistantApi.widgetPreferences });
export const useVoicePersonality = () => useQuery({ queryKey: assistantKeys.voice, queryFn: assistantApi.voicePersonality });
export const useBriefingPreferences = () => useQuery({ queryKey: [...assistantKeys.briefing, "preferences"], queryFn: assistantApi.briefingPreferences });

export function useAssistantActions() {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: assistantKeys.all });
  return {
    generateBriefing: useMutation({ mutationFn: assistantApi.generateBriefing, onSuccess: refresh }),
    turnThisInto: useMutation({ mutationFn: assistantApi.turnThisInto }),
    completePromise: useMutation({ mutationFn: assistantApi.completePromise, onSuccess: refresh }),
    settleDebt: useMutation({ mutationFn: assistantApi.settleDebt, onSuccess: refresh }),
    travelChecklist: useMutation({ mutationFn: assistantApi.generateTravelChecklist, onSuccess: refresh }),
    checkIn: useMutation({ mutationFn: ({ id, status }: { id: string; status: "DONE" | "MISSED" | "SNOOZED" }) => assistantApi.checkIn(id, status), onSuccess: refresh }),
    acceptFollowUp: useMutation({ mutationFn: assistantApi.acceptFollowUp, onSuccess: refresh }),
    dismissFollowUp: useMutation({ mutationFn: assistantApi.dismissFollowUp, onSuccess: refresh }),
    updateWidgets: useMutation({ mutationFn: (input: Partial<WidgetPreference>) => assistantApi.updateWidgetPreferences(input), onSuccess: refresh }),
    updateVoice: useMutation({ mutationFn: (input: Partial<VoicePersonality>) => assistantApi.updateVoicePersonality(input), onSuccess: refresh }),
    updateBriefing: useMutation({ mutationFn: (input: Partial<BriefingPreference>) => assistantApi.updateBriefingPreferences(input), onSuccess: refresh }),
    createShare: useMutation({ mutationFn: assistantApi.createShareCapture }),
    parseShare: useMutation({ mutationFn: assistantApi.parseShareCapture }),
    confirmShare: useMutation({ mutationFn: assistantApi.confirmShareCapture, onSuccess: refresh }),
    smartSnooze: useMutation({ mutationFn: assistantApi.smartSnooze, onSuccess: refresh })
  };
}
