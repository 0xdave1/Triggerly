import { IsArray, IsObject, IsOptional, IsString } from "class-validator";

export class ConfirmAgentRunDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  itemIds?: string[];
}

export class EditAgentPlanItemDto {
  @IsObject()
  payload!: Record<string, unknown>;
}
