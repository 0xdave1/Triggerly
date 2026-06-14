import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";
import {
  AccountabilityCheckInStatus,
  AccountabilityGoalStatus,
  AccountabilityStrictness,
  HabitFrequencyType
} from "@/common/enums";

export class CreateAccountabilityGoalDto {
  @IsString() title!: string;
  @IsOptional() @IsString() description?: string;
  @IsEnum(HabitFrequencyType) frequencyType!: HabitFrequencyType;
  @IsOptional() @IsInt() @Min(1) frequencyCount?: number;
  @IsOptional() @IsEnum(AccountabilityStrictness) strictness?: AccountabilityStrictness;
  @IsOptional() @IsBoolean() voiceEnabled?: boolean;
}

export class UpdateAccountabilityGoalDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(HabitFrequencyType) frequencyType?: HabitFrequencyType;
  @IsOptional() @IsInt() @Min(1) frequencyCount?: number;
  @IsOptional() @IsEnum(AccountabilityStrictness) strictness?: AccountabilityStrictness;
  @IsOptional() @IsBoolean() voiceEnabled?: boolean;
  @IsOptional() @IsEnum(AccountabilityGoalStatus) status?: AccountabilityGoalStatus;
}

export class AccountabilityCheckInDto {
  @IsEnum(AccountabilityCheckInStatus) status!: AccountabilityCheckInStatus;
  @IsOptional() @IsString() note?: string;
}
