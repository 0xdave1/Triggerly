export type LiveContextCapability = "weather" | "exchange_rate" | "price" | "travel";

export type LiveContextPlaceholder = {
  capability: LiveContextCapability;
  status: "provider_not_configured";
  requiresUserConfirmation: true;
  message: string;
  input: Record<string, unknown>;
};

export type WeatherContextInput = {
  location: string;
};

export type ExchangeRateContextInput = {
  base: string;
  quote: string;
};

export type WeatherTriggerInput = WeatherContextInput & {
  confirmed: boolean;
  condition?: string;
};

export type ExchangeRateTriggerInput = ExchangeRateContextInput & {
  confirmed: boolean;
  targetRate?: number;
  threshold?: Record<string, unknown>;
};

export type LiveContextTriggerType = "WEATHER" | "EXCHANGE_RATE" | "PRICE" | "TRAVEL";
export type LiveContextTriggerStatus = "ACTIVE" | "PAUSED" | "TRIGGERED" | "DELETED";

export type LiveContextTrigger = {
  id: string;
  type: LiveContextTriggerType;
  title: string;
  condition: Record<string, unknown>;
  status: LiveContextTriggerStatus;
  lastCheckedAt?: string;
  lastTriggeredAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateWeatherTriggerInput = {
  title: string;
  location: string;
  date?: string;
  event?: string;
  threshold?: number;
  condition?: Record<string, unknown>;
};

export type CreateExchangeRateTriggerInput = {
  title: string;
  base: string;
  quote: string;
  operator?: string;
  targetRate: number;
};

export type PriceLogSource = "MANUAL" | "OCR" | "AI_PARSE";

export type PriceLog = {
  id: string;
  itemName: string;
  price: number;
  currency: string;
  quantityLabel?: string;
  placeName?: string;
  latitude?: number;
  longitude?: number;
  loggedAt: string;
  source: PriceLogSource;
  createdAt: string;
  updatedAt: string;
};

export type CreatePriceLogInput = {
  itemName: string;
  price: number;
  currency?: string;
  quantityLabel?: string;
  placeName?: string;
  latitude?: number;
  longitude?: number;
  loggedAt?: string;
  source?: PriceLogSource;
};

export type CreatePriceTriggerInput = {
  title: string;
  itemName: string;
  operator: string;
  thresholdPercent: number;
};

export type TravelContextInput = {
  destination: string;
  departureLocation?: string;
};
