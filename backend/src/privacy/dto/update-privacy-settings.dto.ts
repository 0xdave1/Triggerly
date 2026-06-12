import { IsBoolean, IsInt, IsOptional, Min } from "class-validator";

export class UpdatePrivacySettingsDto {
  @IsOptional()
  @IsBoolean()
  locationEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  voiceInputEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  aiParsingEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  dataRetentionDays?: number;

  @IsOptional()
  @IsBoolean()
  locationTriggersEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  backgroundLocationEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  microphoneInputEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  voiceNotificationsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  cloudSyncEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  contactAccessEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  emailDraftingEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  messageDraftingEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  paymentRemindersEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  paymentActionsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  calendarIntegrationEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  screenshotReceiptScanningEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  smartSuggestionsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  memoryEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  contactMemoryEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  habitLearningEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  weatherTriggersEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  exchangeRateTriggersEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  priceMemoryEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  travelContextEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  analyticsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  crashReportsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  dataExportEnabled?: boolean;
}
