import { apiClient } from "@/lib/apiClient";
import type {
  CreateExchangeRateTriggerInput,
  CreatePriceLogInput,
  CreatePriceTriggerInput,
  CreateWeatherTriggerInput,
  ExchangeRateContextInput,
  ExchangeRateTriggerInput,
  LiveContextPlaceholder,
  LiveContextTrigger,
  PriceLog,
  TravelContextInput,
  WeatherContextInput,
  WeatherTriggerInput
} from "./types";

export function getWeatherContext(input: WeatherContextInput): Promise<LiveContextPlaceholder> {
  const query = new URLSearchParams({ location: input.location }).toString();
  return apiClient<LiveContextPlaceholder>({ method: "GET", path: `/live-context/weather?${query}` });
}

export function getExchangeRateContext(input: ExchangeRateContextInput): Promise<LiveContextPlaceholder> {
  const query = new URLSearchParams({ base: input.base, quote: input.quote }).toString();
  return apiClient<LiveContextPlaceholder>({ method: "GET", path: `/live-context/exchange-rate?${query}` });
}

export function getTravelContext(input: TravelContextInput): Promise<LiveContextPlaceholder> {
  return apiClient<LiveContextPlaceholder>({ method: "POST", path: "/live-context/travel", body: input });
}

export function createWeatherTrigger(input: CreateWeatherTriggerInput | WeatherTriggerInput): Promise<LiveContextTrigger> {
  const body =
    "confirmed" in input
      ? { title: `Weather alert for ${input.location}`, location: input.location, event: input.condition ?? "rain_probability_above", threshold: 50 }
      : input;
  return apiClient<LiveContextTrigger>({ method: "POST", path: "/live-context/weather-triggers", body });
}

export function createExchangeRateTrigger(input: CreateExchangeRateTriggerInput | ExchangeRateTriggerInput): Promise<LiveContextTrigger> {
  const body =
    "confirmed" in input
      ? { title: `${input.base.toUpperCase()}/${input.quote.toUpperCase()} rate alert`, base: input.base, quote: input.quote, operator: ">=", targetRate: input.targetRate ?? Number(input.threshold?.targetRate ?? 0) }
      : input;
  return apiClient<LiveContextTrigger>({ method: "POST", path: "/live-context/exchange-rate-triggers", body });
}

export function createPriceLog(input: CreatePriceLogInput): Promise<PriceLog> {
  return apiClient<PriceLog>({ method: "POST", path: "/live-context/price-logs", body: { ...input, source: input.source ?? "MANUAL" } });
}

export function listPriceLogs(itemName?: string): Promise<PriceLog[]> {
  const query = itemName ? `?${new URLSearchParams({ itemName }).toString()}` : "";
  return apiClient<PriceLog[]>({ method: "GET", path: `/live-context/price-logs${query}` });
}

export function getPriceHistory(itemName: string): Promise<PriceLog[]> {
  return apiClient<PriceLog[]>({ method: "GET", path: `/live-context/price-logs/${encodeURIComponent(itemName)}/history` });
}

export function createPriceTrigger(input: CreatePriceTriggerInput): Promise<LiveContextTrigger> {
  return apiClient<LiveContextTrigger>({ method: "POST", path: "/live-context/price-triggers", body: input });
}

export function listLiveContextTriggers(): Promise<LiveContextTrigger[]> {
  return apiClient<LiveContextTrigger[]>({ method: "GET", path: "/live-context/triggers" });
}
