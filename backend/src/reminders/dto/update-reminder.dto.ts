import { Type } from "class-transformer";
import { IsBoolean, IsEnum, IsObject, IsOptional, IsString, ValidateNested } from "class-validator";
import { ActionType, DeliveryMode, ReminderStatus, ReminderType } from "@/common/enums";
import { HabitDto, LocationTriggerDto, TimeTriggerDto } from "./trigger.dto";

export class UpdateReminderDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(ReminderType)
  type?: ReminderType;

  @IsOptional()
  @IsEnum(ReminderStatus)
  status?: ReminderStatus;

  @IsOptional()
  @ValidateNested()
  @Type(() => TimeTriggerDto)
  timeTrigger?: TimeTriggerDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationTriggerDto)
  locationTrigger?: LocationTriggerDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => HabitDto)
  habit?: HabitDto;

  @IsOptional()
  @IsEnum(DeliveryMode)
  deliveryMode?: DeliveryMode;

  @IsOptional()
  @IsString()
  voiceScript?: string;

  @IsOptional()
  @IsBoolean()
  voiceEnabled?: boolean;

  @IsOptional()
  @IsString()
  contactMemoryId?: string;

  @IsOptional()
  @IsEnum(ActionType)
  actionType?: ActionType;

  @IsOptional()
  @IsObject()
  actionPayload?: Record<string, unknown>;
}
