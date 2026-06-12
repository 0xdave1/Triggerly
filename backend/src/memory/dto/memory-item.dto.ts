import { IsEnum, IsNumber, IsObject, IsOptional, IsString, Max, Min } from "class-validator";
import { MemorySource, MemoryStatus, MemoryType } from "@/common/enums";

export { MemorySource, MemoryStatus, MemoryType };

export class ListMemoryDto {
  @IsOptional()
  @IsEnum(MemoryType)
  type?: MemoryType;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(MemoryStatus)
  status?: MemoryStatus;
}

export class CreateMemoryItemDto {
  @IsEnum(MemoryType)
  type!: MemoryType;

  @IsString()
  title!: string;

  @IsString()
  body!: string;

  @IsOptional()
  @IsObject()
  entities?: Record<string, unknown>;

  @IsOptional()
  @IsEnum(MemorySource)
  source?: MemorySource;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;
}

export class UpdateMemoryItemDto {
  @IsOptional()
  @IsEnum(MemoryType)
  type?: MemoryType;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsObject()
  entities?: Record<string, unknown>;

  @IsOptional()
  @IsEnum(MemorySource)
  source?: MemorySource;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;

  @IsOptional()
  @IsEnum(MemoryStatus)
  status?: MemoryStatus;
}

export class ConfirmMemoryFromIntentDto {
  @IsObject()
  parsedIntent!: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  overrides?: Partial<CreateMemoryItemDto>;
}
