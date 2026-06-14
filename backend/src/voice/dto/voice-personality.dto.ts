import { IsBoolean, IsEnum, IsOptional } from "class-validator";
import { VoicePersonalityStyle } from "@/common/enums";

export class UpdateVoicePersonalityDto {
  @IsOptional() @IsEnum(VoicePersonalityStyle) style?: VoicePersonalityStyle;
  @IsOptional() @IsBoolean() voiceNotificationsEnabled?: boolean;
  @IsOptional() @IsBoolean() readFullReminder?: boolean;
  @IsOptional() @IsBoolean() readSensitiveContent?: boolean;
}
