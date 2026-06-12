import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { LiveContextTriggerStatus, LiveContextTriggerType, PriceLogSource, TriggerType } from "@/common/enums";
import { toPrismaJson } from "@/common/utils/prisma-json";
import { PrismaService } from "@/prisma/prisma.service";
import { PrivacyService } from "@/privacy/privacy.service";
import {
  CreateExchangeRateTriggerDto,
  CreatePriceLogDto,
  CreatePriceTriggerDto,
  CreateWeatherTriggerDto,
  ExchangeRateContextDto,
  ExchangeRateTriggerDto,
  PriceLogsQueryDto,
  TravelContextDto,
  UpdateLiveContextTriggerDto,
  WeatherContextDto,
  WeatherTriggerDto
} from "./dto/live-context.dto";
import { ExchangeRateProviderService, normalizePair } from "./exchange-rate/exchange-rate.provider";
import { PriceContextService } from "./price/price-context.service";
import { providerNotConfigured } from "./types";
import { WeatherProviderService } from "./weather/weather.provider";

@Injectable()
export class LiveContextService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly privacy: PrivacyService,
    private readonly weather: WeatherProviderService,
    private readonly exchange: ExchangeRateProviderService,
    private readonly priceContext: PriceContextService
  ) {}

  getWeatherContext(dto: WeatherContextDto) {
    return this.weather.getContext(dto);
  }

  getExchangeRateContext(dto: ExchangeRateContextDto) {
    return this.exchange.getContext(dto);
  }

  getTravelContext(dto: TravelContextDto) {
    return providerNotConfigured("travel", { destination: dto.destination, departureLocation: dto.departureLocation });
  }

  async createWeatherTrigger(userId: string, dto: CreateWeatherTriggerDto) {
    await this.privacy.assertCanCreateTrigger(userId, TriggerType.WEATHER);
    const condition = dto.condition ?? {
      location: dto.location,
      date: dto.date ?? "today",
      event: dto.event ?? "rain_probability_above",
      threshold: dto.threshold ?? 50
    };
    return this.createTrigger(userId, {
      type: LiveContextTriggerType.WEATHER,
      title: dto.title,
      condition
    });
  }

  async createExchangeRateTrigger(userId: string, dto: CreateExchangeRateTriggerDto) {
    await this.privacy.assertCanCreateTrigger(userId, TriggerType.EXCHANGE_RATE);
    const pair = normalizePair(dto.base, dto.quote);
    return this.createTrigger(userId, {
      type: LiveContextTriggerType.EXCHANGE_RATE,
      title: dto.title,
      condition: {
        base: pair.base,
        quote: pair.quote,
        operator: dto.operator ?? ">=",
        targetRate: dto.targetRate
      }
    });
  }

  async createPriceTrigger(userId: string, dto: CreatePriceTriggerDto) {
    await this.assertPriceMemoryEnabled(userId);
    return this.createTrigger(userId, {
      type: LiveContextTriggerType.PRICE,
      title: dto.title,
      condition: {
        itemName: dto.itemName,
        operator: dto.operator,
        thresholdPercent: dto.thresholdPercent
      }
    });
  }

  async createPriceLog(userId: string, dto: CreatePriceLogDto) {
    await this.assertPriceMemoryEnabled(userId);
    return this.prisma.priceLog.create({
      data: {
        userId,
        itemName: dto.itemName.trim(),
        price: dto.price,
        currency: dto.currency?.trim().toUpperCase() ?? "NGN",
        quantityLabel: dto.quantityLabel?.trim(),
        placeName: dto.placeName?.trim(),
        latitude: dto.latitude,
        longitude: dto.longitude,
        loggedAt: dto.loggedAt ? new Date(dto.loggedAt) : new Date(),
        source: dto.source ?? PriceLogSource.MANUAL
      }
    });
  }

  listPriceLogs(userId: string, dto: PriceLogsQueryDto) {
    return this.priceContext.listLogs(userId, dto.itemName);
  }

  getPriceHistory(userId: string, itemName: string) {
    return this.priceContext.history(userId, itemName);
  }

  listTriggers(userId: string) {
    return this.prisma.liveContextTrigger.findMany({
      where: { userId, status: { not: LiveContextTriggerStatus.DELETED } },
      orderBy: { createdAt: "desc" }
    });
  }

  async updateTrigger(userId: string, id: string, dto: UpdateLiveContextTriggerDto) {
    await this.findOwnedTrigger(userId, id);
    return this.prisma.liveContextTrigger.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        condition: dto.condition === undefined ? undefined : toPrismaJson(dto.condition),
        status: dto.status
      }
    });
  }

  async deleteTrigger(userId: string, id: string) {
    await this.findOwnedTrigger(userId, id);
    await this.prisma.liveContextTrigger.update({
      where: { id },
      data: { status: LiveContextTriggerStatus.DELETED }
    });
    return { deleted: true };
  }

  async createLegacyWeatherTrigger(userId: string, dto: WeatherTriggerDto) {
    return this.createWeatherTrigger(userId, {
      title: `Weather alert for ${dto.location}`,
      location: dto.location,
      event: dto.condition ?? "rain_probability_above",
      threshold: 50
    });
  }

  async createLegacyExchangeRateTrigger(userId: string, dto: ExchangeRateTriggerDto) {
    return this.createExchangeRateTrigger(userId, {
      title: `${dto.base.toUpperCase()}/${dto.quote.toUpperCase()} rate alert`,
      base: dto.base,
      quote: dto.quote,
      operator: ">=",
      targetRate: dto.targetRate ?? Number(dto.threshold?.targetRate ?? 0)
    });
  }

  async checkLiveContextTriggers() {
    const triggers = await this.prisma.liveContextTrigger.findMany({
      where: { status: LiveContextTriggerStatus.ACTIVE }
    });
    return {
      checked: triggers.length,
      triggered: 0,
      scheduling: "pending",
      message: "Periodic live-context checks are prepared but require Redis/BullMQ scheduling to be enabled."
    };
  }

  private createTrigger(userId: string, input: { type: LiveContextTriggerType; title: string; condition: Record<string, unknown> }) {
    return this.prisma.liveContextTrigger.create({
      data: {
        userId,
        type: input.type,
        title: input.title.trim(),
        condition: toPrismaJson(input.condition),
        status: LiveContextTriggerStatus.ACTIVE
      }
    });
  }

  private async findOwnedTrigger(userId: string, id: string) {
    const trigger = await this.prisma.liveContextTrigger.findFirst({ where: { id, userId, status: { not: LiveContextTriggerStatus.DELETED } } });
    if (!trigger) throw new NotFoundException("Live context trigger not found.");
    return trigger;
  }

  private async assertPriceMemoryEnabled(userId: string) {
    const settings = await this.privacy.getSettings(userId);
    if (!settings.priceMemoryEnabled) throw new ForbiddenException("Price memory is disabled in privacy settings.");
  }
}
