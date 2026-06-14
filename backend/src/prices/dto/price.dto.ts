import { IsDateString, IsEnum, IsLatitude, IsLongitude, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { PriceLogSource } from "@/common/enums";

export class CreatePriceDto {
  @IsString() itemName!: string;
  @IsNumber() @Min(0) price!: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() quantityLabel?: string;
  @IsOptional() @IsString() placeName?: string;
  @IsOptional() @IsLatitude() latitude?: number;
  @IsOptional() @IsLongitude() longitude?: number;
  @IsOptional() @IsEnum(PriceLogSource) source?: PriceLogSource;
  @IsOptional() @IsDateString() loggedAt?: string;
}

export class PriceReminderDto {
  @IsOptional() @IsDateString() remindAt?: string;
}
