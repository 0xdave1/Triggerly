import { IsEnum, IsOptional } from "class-validator";
import { ReminderStatus, ReminderType } from "@/common/enums";

export class ListRemindersDto {
  @IsOptional()
  @IsEnum(ReminderStatus)
  status?: ReminderStatus;

  @IsOptional()
  @IsEnum(ReminderType)
  type?: ReminderType;
}
