import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { WeatherContextDto } from "../dto/live-context.dto";
import { providerNotConfigured } from "../types";

export interface WeatherProvider {
  getCurrentWeather(location: string): Promise<unknown>;
  getForecast(location: string, dateRange?: string): Promise<unknown>;
}

@Injectable()
export class WeatherProviderService implements WeatherProvider {
  constructor(private readonly config: ConfigService) {}

  async getCurrentWeather(location: string) {
    if (!this.isConfigured()) return providerNotConfigured("weather", { location });
    return providerNotConfigured("weather", { location });
  }

  async getForecast(location: string, dateRange?: string) {
    if (!this.isConfigured()) return providerNotConfigured("weather", { location, dateRange });
    return providerNotConfigured("weather", { location, dateRange });
  }

  async getContext(dto: WeatherContextDto) {
    return this.getCurrentWeather(dto.location);
  }

  private isConfigured() {
    return Boolean(this.config.get("weatherProvider") && this.config.get("weatherApiKey"));
  }
}
