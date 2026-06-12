import type {
  HabitFrequencyType,
  LocationTriggerType,
  ParsedReminderInput,
  ReminderCreateInput,
  ReminderStatus,
  ReminderType,
  ReminderWithTriggers
} from "./types";

type BackendReminder = {
  id: string;
  userId?: string;
  title: string;
  notes?: string | null;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  deliveryMode?: string | null;
  voiceScript?: string | null;
  voiceEnabled?: boolean;
  timeTrigger?: {
    id: string;
    reminderId: string;
    triggerDateTime: string;
    timezone: string;
    repeatRule?: string | null;
    lastTriggeredAt?: string | null;
  } | null;
  locationTrigger?: {
    id: string;
    reminderId: string;
    placeName: string;
    latitude: number;
    longitude: number;
    radiusMeters: number;
    triggerType: string;
    lastTriggeredAt?: string | null;
  } | null;
  habit?: {
    id: string;
    reminderId: string;
    frequencyType: string;
    frequencyCount: number;
    lastCompletedAt?: string | null;
    nextDueAt?: string | null;
  } | null;
};

export type BackendParsedReminder = {
  title: string;
  triggerTypeGuess: string;
  timeCandidate?: string;
  locationCandidate?: string;
  habitCandidate?: string;
  confidence: number;
  requiresConfirmation: true;
};

const typeToBackend: Record<ReminderType, string> = {
  time: "TIME",
  location: "LOCATION",
  habit: "HABIT",
  hybrid: "HYBRID"
};

const typeFromBackend: Record<string, ReminderType> = {
  TIME: "time",
  LOCATION: "location",
  HABIT: "habit",
  HYBRID: "hybrid"
};

const statusFromBackend: Record<string, ReminderStatus> = {
  ACTIVE: "active",
  COMPLETED: "completed",
  DELETED: "deleted",
  SNOOZED: "snoozed"
};

export function mapReminderFromBackend(reminder: BackendReminder): ReminderWithTriggers {
  return {
    id: reminder.id,
    userId: reminder.userId,
    title: reminder.title,
    notes: reminder.notes ?? undefined,
    type: typeFromBackend[reminder.type] ?? "time",
    status: statusFromBackend[reminder.status] ?? "active",
    createdAt: reminder.createdAt,
    updatedAt: reminder.updatedAt,
    deliveryMode: reminder.deliveryMode?.toLowerCase() as ReminderWithTriggers["deliveryMode"],
    voiceScript: reminder.voiceScript ?? undefined,
    voiceEnabled: reminder.voiceEnabled ?? false,
    timeTrigger: reminder.timeTrigger
      ? {
          id: reminder.timeTrigger.id,
          reminderId: reminder.timeTrigger.reminderId,
          triggerDateTime: reminder.timeTrigger.triggerDateTime,
          timezone: reminder.timeTrigger.timezone,
          repeatRule: reminder.timeTrigger.repeatRule ?? undefined,
          lastTriggeredAt: reminder.timeTrigger.lastTriggeredAt ?? undefined
        }
      : undefined,
    locationTrigger: reminder.locationTrigger
      ? {
          id: reminder.locationTrigger.id,
          reminderId: reminder.locationTrigger.reminderId,
          placeName: reminder.locationTrigger.placeName,
          latitude: reminder.locationTrigger.latitude,
          longitude: reminder.locationTrigger.longitude,
          radiusMeters: reminder.locationTrigger.radiusMeters,
          triggerType: reminder.locationTrigger.triggerType.toLowerCase() as LocationTriggerType,
          lastTriggeredAt: reminder.locationTrigger.lastTriggeredAt ?? undefined
        }
      : undefined,
    habit: reminder.habit
      ? {
          id: reminder.habit.id,
          reminderId: reminder.habit.reminderId,
          frequencyType: reminder.habit.frequencyType.toLowerCase() as HabitFrequencyType,
          frequencyCount: reminder.habit.frequencyCount,
          lastCompletedAt: reminder.habit.lastCompletedAt ?? undefined,
          nextDueAt: reminder.habit.nextDueAt ?? undefined
        }
      : undefined
  };
}

export function mapReminderInputToBackend(input: Partial<ReminderCreateInput>) {
  return {
    title: input.title,
    notes: input.notes,
    type: input.type ? typeToBackend[input.type] : undefined,
    timeTrigger: input.timeTrigger,
    locationTrigger: input.locationTrigger
      ? {
          ...input.locationTrigger,
          triggerType: input.locationTrigger.triggerType.toUpperCase()
        }
      : undefined,
    habit: input.habit
      ? {
          ...input.habit,
          frequencyType: input.habit.frequencyType.toUpperCase()
        }
      : undefined,
    deliveryMode: input.deliveryMode?.toUpperCase(),
    voiceScript: input.voiceScript,
    voiceEnabled: input.voiceEnabled
  };
}

export function mapParsedReminderFromBackend(parsed: BackendParsedReminder): ParsedReminderInput {
  return {
    title: parsed.title,
    triggerType: typeFromBackend[parsed.triggerTypeGuess] ?? "time",
    possibleTime: parsed.timeCandidate,
    possibleLocationPhrase: parsed.locationCandidate,
    confidence: parsed.confidence
  };
}
