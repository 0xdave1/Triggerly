import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createExchangeRateTrigger,
  createPriceLog,
  createPriceTrigger,
  createWeatherTrigger,
  getExchangeRateContext,
  getTravelContext,
  getWeatherContext,
  listLiveContextTriggers,
  listPriceLogs
} from "./api";

export const liveContextKeys = {
  triggers: ["live-context", "triggers"] as const,
  priceLogs: ["live-context", "price-logs"] as const
};

export function useLiveContextTriggers() {
  return useQuery({ queryKey: liveContextKeys.triggers, queryFn: listLiveContextTriggers });
}

export function usePriceLogs() {
  return useQuery({ queryKey: liveContextKeys.priceLogs, queryFn: () => listPriceLogs() });
}

export function useLiveContextActions() {
  const queryClient = useQueryClient();
  const invalidateTriggers = () => queryClient.invalidateQueries({ queryKey: liveContextKeys.triggers });
  const invalidatePrices = () => queryClient.invalidateQueries({ queryKey: liveContextKeys.priceLogs });
  return {
    weather: useMutation({ mutationFn: getWeatherContext }),
    exchangeRate: useMutation({ mutationFn: getExchangeRateContext }),
    travel: useMutation({ mutationFn: getTravelContext }),
    createWeatherTrigger: useMutation({ mutationFn: createWeatherTrigger, onSuccess: invalidateTriggers }),
    createExchangeRateTrigger: useMutation({ mutationFn: createExchangeRateTrigger, onSuccess: invalidateTriggers }),
    createPriceTrigger: useMutation({ mutationFn: createPriceTrigger, onSuccess: invalidateTriggers }),
    createPriceLog: useMutation({ mutationFn: createPriceLog, onSuccess: invalidatePrices })
  };
}
