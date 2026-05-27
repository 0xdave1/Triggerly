export const APP_CONFIG = {
  appName: "Triggerly",
  apiBaseUrl: getApiBaseUrl(),
  defaultUserId: "local-user",
  defaultTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  locationRadiusOptions: [100, 250, 500, 1000] as const,
  snoozeMinutes: 15
};

function getApiBaseUrl(): string {
  const env = (globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } }).process?.env;
  return env?.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";
}
