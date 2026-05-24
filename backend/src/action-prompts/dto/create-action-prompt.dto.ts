import { IsEnum, IsObject, IsOptional, IsString } from "class-validator";
import { ActionType } from "@/common/enums";

export class CreateActionPromptDto {
  @IsOptional()
  @IsString()
  reminderId?: string;

  @IsEnum(ActionType)
  actionType!: ActionType;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
