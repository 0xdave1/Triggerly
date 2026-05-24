import { IsEnum, IsObject, IsOptional } from "class-validator";
import { ReminderEventType } from "@/common/enums";

export class CreateReminderEventDto {
  @IsEnum(ReminderEventType)
  eventType!: ReminderEventType;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
