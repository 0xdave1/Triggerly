import { IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { ShareCaptureContentType } from "@/common/enums";

export class CreateShareCaptureDto {
  @IsEnum(ShareCaptureContentType) contentType!: ShareCaptureContentType;
  @IsOptional() @IsString() @MinLength(1) rawText?: string;
  @IsOptional() @IsString() fileUrl?: string;
}
