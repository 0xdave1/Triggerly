export type PermissionState = "granted" | "denied" | "undetermined";

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type ForegroundLocationCheckResult = {
  isWithinRadius: boolean;
  distanceMeters?: number;
  error?: string;
};
