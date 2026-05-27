import { getCurrentCoordinates } from "./permissions";
import type { ForegroundLocationCheckResult } from "./types";
import type { ReminderWithTriggers } from "@/features/reminders/types";

export async function registerLocationReminder(reminder: ReminderWithTriggers): Promise<void> {
  if (!reminder.locationTrigger) return;

  // TODO: Wire native background geofencing for production builds. Expo background
  // geofencing can require a custom dev client, platform QA, and background modes.
  // This MVP stores the trigger and supports foreground checks for development.
  throw new Error("Location trigger saved, but background geofencing is not active in this MVP. Open Triggerly to check foreground location.");
}

export async function checkLocationReminderInForeground(reminder: ReminderWithTriggers): Promise<ForegroundLocationCheckResult> {
  if (!reminder.locationTrigger) return { isWithinRadius: false, error: "Reminder has no location trigger." };

  try {
    const current = await getCurrentCoordinates();
    const distanceMeters = getDistanceMeters(current, {
      latitude: reminder.locationTrigger.latitude,
      longitude: reminder.locationTrigger.longitude
    });

    return {
      isWithinRadius: distanceMeters <= reminder.locationTrigger.radiusMeters,
      distanceMeters
    };
  } catch (error) {
    return {
      isWithinRadius: false,
      error: error instanceof Error ? error.message : "Location unavailable."
    };
  }
}

function getDistanceMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  const earthRadiusMeters = 6371000;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latDelta = toRadians(b.latitude - a.latitude);
  const lonDelta = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const haversine =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(lonDelta / 2) * Math.sin(lonDelta / 2);
  return Math.round(earthRadiusMeters * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine)));
}
