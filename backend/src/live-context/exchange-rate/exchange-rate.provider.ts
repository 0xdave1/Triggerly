import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ExchangeRateContextDto } from "../dto/live-context.dto";
import { providerNotConfigured } from "../types";

export interface ExchangeRateProvider {
  getRate(base: string, quote: string): Promise<unknown>;
  getHistoricalRates(base: string, quote: string, range?: string): Promise<unknown>;
}

@Injectable()
export class ExchangeRateProviderService implements ExchangeRateProvider {
  constructor(private readonly config: ConfigService) {}

  async getRate(base: string, quote: string) {
    const pair = normalizePair(base, quote);
    if (!this.isConfigured()) return providerNotConfigured("exchange_rate", pair);
    return providerNotConfigured("exchange_rate", pair);
  }

  async getHistoricalRates(base: string, quote: string, range?: string) {
    const pair = normalizePair(base, quote);
    if (!this.isConfigured()) return providerNotConfigured("exchange_rate", { ...pair, range });
    return providerNotConfigured("exchange_rate", { ...pair, range });
  }

  async getContext(dto: ExchangeRateContextDto) {
    return this.getRate(dto.base, dto.quote);
  }

  private isConfigured() {
    return Boolean(this.config.get("exchangeRateProvider") && this.config.get("exchangeRateApiKey"));
  }
}

export function normalizePair(base: string, quote: string) {
  return { base: base.toUpperCase(), quote: quote.toUpperCase() };
}
