import { IsEnum, IsObject, IsOptional, IsString } from "class-validator";
import { ActionPromptStatus, ActionType } from "@/common/enums";

export class CreateActionPromptDto {
  @IsOptional()
  @IsString()
  reminderId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsEnum(ActionType)
  actionType!: ActionType;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}

export class ListActionPromptsDto {
  @IsOptional()
  @IsEnum(ActionPromptStatus)
  status?: ActionPromptStatus;

  @IsOptional()
  @IsEnum(ActionType)
  actionType?: ActionType;
}

export class UpdateActionPromptDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(ActionType)
  actionType?: ActionType;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  generatedContent?: string;
}

export class GenerateActionPromptContentDto {
  @IsOptional()
  @IsString()
  userInstruction?: string;
}
