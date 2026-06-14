import { IsBoolean, IsEnum, IsOptional, IsString, Matches } from "class-validator";
import { BriefingType } from "@/common/enums";

export class GenerateBriefingDto {
  @IsOptional()
  @IsEnum(BriefingType)
  type?: BriefingType;
}

export class UpdateBriefingPreferenceDto {
  @IsOptional() @IsBoolean() morningBriefingEnabled?: boolean;
  @IsOptional() @IsBoolean() eveningBriefingEnabled?: boolean;
  @IsOptional() @IsString() @Matches(/^\d{2}:\d{2}$/) morningTime?: string;
  @IsOptional() @IsString() @Matches(/^\d{2}:\d{2}$/) eveningTime?: string;
  @IsOptional() @IsBoolean() includeWeather?: boolean;
  @IsOptional() @IsBoolean() includeActions?: boolean;
  @IsOptional() @IsBoolean() includeHabits?: boolean;
  @IsOptional() @IsBoolean() includeMemory?: boolean;
  @IsOptional() @IsBoolean() voiceEnabled?: boolean;
}
