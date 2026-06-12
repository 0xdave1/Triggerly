import { Type } from "class-transformer";
import { IsDateString, IsEnum, IsNumber, IsObject, IsOptional, IsString, Min } from "class-validator";
import { LiveContextTriggerStatus, PriceLogSource } from "@/common/enums";

export class WeatherContextDto {
  @IsString()
  location!: string;
}

export class ExchangeRateContextDto {
  @IsString()
  base!: string;

  @IsString()
  quote!: string;
}

export class TravelContextDto {
  @IsString()
  destination!: string;

  @IsOptional()
  @IsString()
  departureLocation?: string;
}

export class CreateWeatherTriggerDto {
  @IsString()
  title!: string;

  @IsString()
  location!: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  event?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  threshold?: number;

  @IsOptional()
  @IsObject()
  condition?: Record<string, unknown>;
}

export class CreateExchangeRateTriggerDto {
  @IsString()
  title!: string;

  @IsString()
  base!: string;

  @IsString()
  quote!: string;

  @IsOptional()
  @IsString()
  operator?: string;

  @Type(() => Number)
  @IsNumber()
  targetRate!: number;
}

export class CreatePriceLogDto {
  @IsString()
  itemName!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  quantityLabel?: string;

  @IsOptional()
  @IsString()
  placeName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsDateString()
  loggedAt?: string;

  @IsOptional()
  @IsEnum(PriceLogSource)
  source?: PriceLogSource;
}

export class PriceLogsQueryDto {
  @IsOptional()
  @IsString()
  itemName?: string;
}

export class CreatePriceTriggerDto {
  @IsString()
  title!: string;

  @IsString()
  itemName!: string;

  @IsString()
  operator!: string;

  @Type(() => Number)
  @IsNumber()
  thresholdPercent!: number;
}

export class UpdateLiveContextTriggerDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsObject()
  condition?: Record<string, unknown>;

  @IsOptional()
  @IsEnum(LiveContextTriggerStatus)
  status?: LiveContextTriggerStatus;
}

// Backward-compatible DTOs for older mobile builds.
export class WeatherTriggerDto extends WeatherContextDto {
  @IsOptional()
  @IsString()
  condition?: string;
}

export class ExchangeRateTriggerDto extends ExchangeRateContextDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  targetRate?: number;

  @IsOptional()
  @IsObject()
  threshold?: Record<string, unknown>;
}
