import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString } from "class-validator";
import { TravelPlanStatus } from "@/common/enums";

export class CreateTravelPlanDto {
  @IsString() destination!: string;
  @IsOptional() @IsString() origin?: string;
  @IsOptional() @IsDateString() departureDate?: string;
  @IsOptional() @IsDateString() returnDate?: string;
  @IsOptional() @IsBoolean() weatherAlertsEnabled?: boolean;
  @IsOptional() @IsBoolean() checklistEnabled?: boolean;
}

export class UpdateTravelPlanDto extends CreateTravelPlanDto {
  @IsOptional() @IsEnum(TravelPlanStatus) status?: TravelPlanStatus;
}
