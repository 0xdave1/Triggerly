import { IsBoolean, IsEnum, IsObject, IsOptional, IsString } from "class-validator";
import { TriggerType } from "@/common/enums";

export class ConfirmTriggerDto {
  @IsEnum(TriggerType)
  type!: TriggerType;

  @IsBoolean()
  confirmed!: boolean;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  reminderId?: string;

  @IsOptional()
  @IsObject()
  configuration?: Record<string, unknown>;
}
