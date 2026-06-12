import { IsBoolean, IsIn, IsOptional, IsString } from "class-validator";

export class UpdateVoiceSettingsDto {
  @IsOptional()
  @IsBoolean()
  voiceNotificationsEnabled?: boolean;

  @IsOptional()
  @IsIn(["calm", "energetic", "professional", "friendly", "minimal"])
  selectedVoiceStyle?: string;

  @IsOptional()
  @IsString()
  selectedVoiceId?: string;

  @IsOptional()
  @IsBoolean()
  readFullReminder?: boolean;

  @IsOptional()
  @IsBoolean()
  readLocationContext?: boolean;

  @IsOptional()
  @IsBoolean()
  readLiveContext?: boolean;
}
