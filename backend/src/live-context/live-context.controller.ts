import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { AuthUser, CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
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
import { LiveContextService } from "./live-context.service";

@UseGuards(JwtAuthGuard)
@Controller("live-context")
export class LiveContextController {
  constructor(private readonly liveContext: LiveContextService) {}

  @Get("weather")
  weatherQuery(@Query() dto: WeatherContextDto) {
    return this.liveContext.getWeatherContext(dto);
  }

  @Post("weather")
  weather(@Body() dto: WeatherContextDto) {
    return this.liveContext.getWeatherContext(dto);
  }

  @Post("weather-triggers")
  weatherTrigger(@CurrentUser() user: AuthUser, @Body() dto: CreateWeatherTriggerDto) {
    return this.liveContext.createWeatherTrigger(user.id, dto);
  }

  @Post("weather-trigger")
  legacyWeatherTrigger(@CurrentUser() user: AuthUser, @Body() dto: WeatherTriggerDto) {
    return this.liveContext.createLegacyWeatherTrigger(user.id, dto);
  }

  @Get("exchange-rate")
  exchangeRateQuery(@Query() dto: ExchangeRateContextDto) {
    return this.liveContext.getExchangeRateContext(dto);
  }

  @Post("exchange-rate")
  exchangeRate(@Body() dto: ExchangeRateContextDto) {
    return this.liveContext.getExchangeRateContext(dto);
  }

  @Post("exchange-rate-triggers")
  exchangeRateTrigger(@CurrentUser() user: AuthUser, @Body() dto: CreateExchangeRateTriggerDto) {
    return this.liveContext.createExchangeRateTrigger(user.id, dto);
  }

  @Post("exchange-rate-trigger")
  legacyExchangeRateTrigger(@CurrentUser() user: AuthUser, @Body() dto: ExchangeRateTriggerDto) {
    return this.liveContext.createLegacyExchangeRateTrigger(user.id, dto);
  }

  @Post("price-logs")
  createPriceLog(@CurrentUser() user: AuthUser, @Body() dto: CreatePriceLogDto) {
    return this.liveContext.createPriceLog(user.id, dto);
  }

  @Get("price-logs")
  listPriceLogs(@CurrentUser() user: AuthUser, @Query() dto: PriceLogsQueryDto) {
    return this.liveContext.listPriceLogs(user.id, dto);
  }

  @Get("price-logs/:itemName/history")
  priceHistory(@CurrentUser() user: AuthUser, @Param("itemName") itemName: string) {
    return this.liveContext.getPriceHistory(user.id, itemName);
  }

  @Post("price-triggers")
  priceTrigger(@CurrentUser() user: AuthUser, @Body() dto: CreatePriceTriggerDto) {
    return this.liveContext.createPriceTrigger(user.id, dto);
  }

  @Get("triggers")
  triggers(@CurrentUser() user: AuthUser) {
    return this.liveContext.listTriggers(user.id);
  }

  @Patch("triggers/:id")
  updateTrigger(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: UpdateLiveContextTriggerDto) {
    return this.liveContext.updateTrigger(user.id, id, dto);
  }

  @Delete("triggers/:id")
  deleteTrigger(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.liveContext.deleteTrigger(user.id, id);
  }

  @Post("travel")
  travel(@Body() dto: TravelContextDto) {
    return this.liveContext.getTravelContext(dto);
  }
}
