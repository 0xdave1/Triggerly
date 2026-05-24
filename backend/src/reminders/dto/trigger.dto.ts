import { Type } from "class-transformer";
import { IsEnum, IsISO8601, IsInt, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";
import { HabitFrequencyType, LocationTriggerType } from "@/common/enums";

export class TimeTriggerDto {
  @IsISO8601()
  triggerDateTime!: string;

  @IsString()
  timezone!: string;

  @IsOptional()
  @IsString()
  repeatRule?: string;
}

export class LocationTriggerDto {
  @IsString()
  placeName!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @Type(() => Number)
  @IsInt()
  @Min(50)
  radiusMeters!: number;

  @IsEnum(LocationTriggerType)
  triggerType!: LocationTriggerType;
}

export class HabitDto {
  @IsEnum(HabitFrequencyType)
  frequencyType!: HabitFrequencyType;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  frequencyCount!: number;
}
