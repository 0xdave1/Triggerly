export const APP_CONFIG = {
  appName: "Triggerly",
  defaultUserId: "local-user",
  defaultTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  locationRadiusOptions: [100, 250, 500, 1000] as const,
  snoozeMinutes: 15
};
