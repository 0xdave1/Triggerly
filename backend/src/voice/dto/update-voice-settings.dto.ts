import { IsBoolean, IsOptional, IsString } from "class-validator";

export class UpdateVoiceSettingsDto {
  @IsOptional()
  @IsBoolean()
  voiceNotificationsEnabled?: boolean;

  @IsOptional()
  @IsString()
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
}
