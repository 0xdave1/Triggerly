import { NIGERIA_TIME_ZONE } from "@/lib/timezone";

export const APP_CONFIG = {
  appName: "Triggerly",
  apiBaseUrl: getApiBaseUrl(),
  defaultUserId: "local-user",
  defaultTimezone: NIGERIA_TIME_ZONE,
  locationRadiusOptions: [100, 250, 500, 1000] as const,
  snoozeMinutes: 15
};

function getApiBaseUrl(): string {
  return process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";
}
