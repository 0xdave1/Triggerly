export type ReminderType = "time" | "location" | "habit" | "hybrid";
export type ReminderStatus = "active" | "completed" | "deleted" | "snoozed";
export type LocationTriggerType = "arrival" | "departure";
export type HabitFrequencyType = "daily" | "weekly" | "monthly" | "custom";
export type ReminderEventType = "created" | "triggered" | "completed" | "snoozed" | "dismissed" | "edited";
export type DeliveryMode = "push" | "voice" | "voice_and_push" | "silent" | "urgent";
export type TriggerIntentType = "time" | "location_arrival" | "location_departure" | "habit" | "weather" | "exchange_rate" | "price" | "contact" | "travel" | "action_confirmation" | "errand_group" | "action_prompt";
export type ActionPromptType = "draft_email" | "draft_message" | "open_payment_app" | "call_contact" | "open_maps" | "open_url" | "create_calendar_event" | "generate_checklist";
export type VoiceStyle = "calm" | "energetic" | "professional" | "friendly" | "minimal";

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
  deliveryMode?: DeliveryMode;
  voiceScript?: string;
  voiceStyle?: VoiceStyle;
  voiceEnabled?: boolean;
  contactName?: string;
  contactId?: string;
  actionType?: ActionPromptType;
  actionPayload?: Record<string, unknown>;
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
  deliveryMode?: DeliveryMode;
  voiceScript?: string;
  voiceStyle?: VoiceStyle;
  voiceEnabled?: boolean;
  contactName?: string;
  contactId?: string;
  actionType?: ActionPromptType;
  actionPayload?: Record<string, unknown>;
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

export type TriggerIntent = {
  taskTitle: string;
  triggerType: TriggerIntentType;
  locationCandidate?: string;
  timeCandidate?: string;
  habitCandidate?: string;
  contactCandidate?: string;
  suggestedDeliveryMode: DeliveryMode;
  suggestedVoiceScript: string;
  confidence: number;
  requiresConfirmation: true;
  frequency?: HabitFrequencyType;
  dayOfWeek?: string;
  timeOfDay?: string;
  actionType?: ActionPromptType;
};

export type ContactMemory = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};
