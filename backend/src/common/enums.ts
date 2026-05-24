export enum ReminderType {
  TIME = "TIME",
  LOCATION = "LOCATION",
  HABIT = "HABIT",
  HYBRID = "HYBRID"
}

export enum ReminderStatus {
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  DELETED = "DELETED",
  SNOOZED = "SNOOZED"
}

export enum LocationTriggerType {
  ARRIVAL = "ARRIVAL",
  DEPARTURE = "DEPARTURE"
}

export enum HabitFrequencyType {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  CUSTOM = "CUSTOM"
}

export enum ReminderEventType {
  CREATED = "CREATED",
  TRIGGERED = "TRIGGERED",
  COMPLETED = "COMPLETED",
  SNOOZED = "SNOOZED",
  DISMISSED = "DISMISSED",
  EDITED = "EDITED",
  DELETED = "DELETED"
}

export enum DevicePlatform {
  IOS = "IOS",
  ANDROID = "ANDROID",
  WEB = "WEB"
}

export enum DeliveryMode {
  PUSH = "PUSH",
  VOICE = "VOICE",
  VOICE_AND_PUSH = "VOICE_AND_PUSH",
  SILENT = "SILENT",
  URGENT = "URGENT"
}

export enum ActionType {
  DRAFT_EMAIL = "DRAFT_EMAIL",
  OPEN_PAYMENT_APP = "OPEN_PAYMENT_APP",
  CALL_CONTACT = "CALL_CONTACT",
  OPEN_MAPS = "OPEN_MAPS",
  OPEN_URL = "OPEN_URL"
}

export enum ActionPromptStatus {
  PENDING_CONFIRMATION = "PENDING_CONFIRMATION",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED"
}
