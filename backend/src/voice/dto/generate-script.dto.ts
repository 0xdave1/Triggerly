import { IsObject, IsOptional, IsString } from "class-validator";

export class GenerateScriptDto {
  @IsString()
  reminderId!: string;

  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>;
}
