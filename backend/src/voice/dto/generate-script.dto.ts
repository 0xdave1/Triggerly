import { IsObject, IsOptional, IsString } from "class-validator";

export class GenerateScriptDto {
  @IsOptional()
  @IsString()
  reminderId?: string;

  @IsOptional()
  @IsObject()
  intent?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>;
}
