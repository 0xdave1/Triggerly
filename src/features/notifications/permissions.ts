import * as Notifications from "expo-notifications";
import type { PermissionState } from "@/features/location/types";

export async function getNotificationPermissionStatus(): Promise<PermissionState> {
  const permission = await Notifications.getPermissionsAsync();
  return permission.status as PermissionState;
}

export async function requestNotificationPermission(): Promise<PermissionState> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === "granted") return "granted";

  const permission = await Notifications.requestPermissionsAsync();
  return permission.status as PermissionState;
}
