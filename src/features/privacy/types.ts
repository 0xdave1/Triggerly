export type PrivacySettings = {
  locationEnabled: boolean;
  voiceInputEnabled: boolean;
  aiParsingEnabled: boolean;
  dataRetentionDays?: number;
  locationTriggersEnabled: boolean;
  backgroundLocationEnabled: boolean;
  microphoneInputEnabled: boolean;
  voiceNotificationsEnabled: boolean;
  cloudSyncEnabled: boolean;
  contactAccessEnabled: boolean;
  emailDraftingEnabled: boolean;
  messageDraftingEnabled: boolean;
  paymentRemindersEnabled: boolean;
  paymentActionsEnabled: boolean;
  calendarIntegrationEnabled: boolean;
  screenshotReceiptScanningEnabled: boolean;
  smartSuggestionsEnabled: boolean;
  habitLearningEnabled: boolean;
  weatherTriggersEnabled: boolean;
  exchangeRateTriggersEnabled: boolean;
  priceMemoryEnabled: boolean;
  travelContextEnabled: boolean;
  analyticsEnabled: boolean;
  crashReportsEnabled: boolean;
  dataExportEnabled: boolean;
};

export type PrivacySettingKey = keyof PrivacySettings;

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  locationEnabled: false,
  voiceInputEnabled: false,
  aiParsingEnabled: true,
  locationTriggersEnabled: true,
  backgroundLocationEnabled: false,
  microphoneInputEnabled: false,
  voiceNotificationsEnabled: false,
  cloudSyncEnabled: true,
  contactAccessEnabled: false,
  emailDraftingEnabled: false,
  messageDraftingEnabled: false,
  paymentRemindersEnabled: true,
  paymentActionsEnabled: false,
  calendarIntegrationEnabled: false,
  screenshotReceiptScanningEnabled: false,
  smartSuggestionsEnabled: true,
  habitLearningEnabled: false,
  weatherTriggersEnabled: false,
  exchangeRateTriggersEnabled: false,
  priceMemoryEnabled: true,
  travelContextEnabled: false,
  analyticsEnabled: false,
  crashReportsEnabled: false,
  dataExportEnabled: true
};

export function isFeatureEnabled(settings: PrivacySettings | undefined, key: PrivacySettingKey): boolean {
  return Boolean((settings ?? DEFAULT_PRIVACY_SETTINGS)[key]);
}
