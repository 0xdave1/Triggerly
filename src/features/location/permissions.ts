import * as Location from "expo-location";
import type { PermissionState } from "./types";

export async function getLocationPermissionStatus(): Promise<PermissionState> {
  const permission = await Location.getForegroundPermissionsAsync();
  return permission.status as PermissionState;
}

export async function requestLocationPermission(): Promise<PermissionState> {
  const permission = await Location.requestForegroundPermissionsAsync();
  return permission.status as PermissionState;
}

export async function getCurrentCoordinates() {
  const status = await requestLocationPermission();
  if (status !== "granted") {
    throw new Error("Location permission denied.");
  }

  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude
  };
}
