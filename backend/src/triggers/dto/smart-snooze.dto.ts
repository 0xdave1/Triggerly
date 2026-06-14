import { IsDateString, IsIn, IsOptional, IsString } from "class-validator";

export class SmartSnoozeDto {
  @IsIn(["10_minutes", "1_hour", "tonight", "tomorrow_morning", "arrival", "departure", "person", "custom"])
  mode!: "10_minutes" | "1_hour" | "tonight" | "tomorrow_morning" | "arrival" | "departure" | "person" | "custom";

  @IsOptional() @IsDateString() customAt?: string;
  @IsOptional() @IsString() placeName?: string;
  @IsOptional() @IsString() personName?: string;
}
