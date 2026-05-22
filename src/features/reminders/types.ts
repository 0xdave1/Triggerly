export type ReminderType = "time" | "location" | "habit" | "hybrid";
export type ReminderStatus = "active" | "completed" | "deleted" | "snoozed";
export type LocationTriggerType = "arrival" | "departure";
export type HabitFrequencyType = "daily" | "weekly" | "monthly" | "custom";
export type ReminderEventType = "created" | "triggered" | "completed" | "snoozed" | "dismissed" | "edited";

export type User = {
  id: string;
  name?: string;
  email?: string;
  createdAt: string;
};

export type Reminder = {
  id: string;
  userId?: string;
  title: string;
  notes?: string;
  type: ReminderType;
  status: ReminderStatus;
  createdAt: string;
  updatedAt: string;
};

export type LocationTrigger = {
  id: string;
  reminderId: string;
  placeName: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  triggerType: LocationTriggerType;
  lastTriggeredAt?: string;
};

export type TimeTrigger = {
  id: string;
  reminderId: string;
  triggerDateTime: string;
  timezone: string;
  repeatRule?: string;
  lastTriggeredAt?: string;
};

export type Habit = {
  id: string;
  reminderId: string;
  frequencyType: HabitFrequencyType;
  frequencyCount: number;
  lastCompletedAt?: string;
  nextDueAt?: string;
};

export type ReminderEvent = {
  id: string;
  reminderId: string;
  eventType: ReminderEventType;
  timestamp: string;
  metadata?: Record<string, unknown>;
};

export type ReminderWithTriggers = Reminder & {
  timeTrigger?: TimeTrigger;
  locationTrigger?: LocationTrigger;
  habit?: Habit;
};

export type ReminderCreateInput = {
  title: string;
  notes?: string;
  type: ReminderType;
  timeTrigger?: Omit<TimeTrigger, "id" | "reminderId" | "lastTriggeredAt">;
  locationTrigger?: Omit<LocationTrigger, "id" | "reminderId" | "lastTriggeredAt">;
  habit?: Omit<Habit, "id" | "reminderId" | "lastCompletedAt" | "nextDueAt">;
};

export type ReminderUpdateInput = Partial<ReminderCreateInput> & {
  status?: ReminderStatus;
};

export type ParsedReminderInput = {
  title: string;
  triggerType: ReminderType;
  possibleTime?: string;
  possibleLocationPhrase?: string;
  confidence: number;
};
