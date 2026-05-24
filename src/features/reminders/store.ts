import { create } from "zustand";
import { APP_CONFIG } from "@/constants/config";
import { getNextHabitDueDate } from "@/lib/dates";
import { createId } from "@/lib/id";
import { deleteStoredValue, getStoredJson, setStoredJson } from "@/lib/storage";
import type {
  Habit,
  LocationTrigger,
  LocationTriggerType,
  ReminderCreateInput,
  ReminderEvent,
  ReminderEventType,
  ReminderStatus,
  ReminderUpdateInput,
  ReminderWithTriggers,
  TimeTrigger
} from "./types";
import { snoozeTimeFromNow } from "./utils";

const STORAGE_KEY = "triggerly.reminders.v1";

type ReminderPersistedState = {
  reminders: ReminderWithTriggers[];
  events: ReminderEvent[];
};

type LocationDraft = {
  placeName: string;
  latitude?: number;
  longitude?: number;
  radiusMeters: number;
  triggerType: LocationTriggerType;
};

type ReminderState = ReminderPersistedState & {
  hydrated: boolean;
  locationDraft?: LocationDraft;
  hydrate: () => Promise<void>;
  addReminder: (input: ReminderCreateInput) => Promise<ReminderWithTriggers>;
  updateReminder: (id: string, input: ReminderUpdateInput) => Promise<ReminderWithTriggers | undefined>;
  deleteReminder: (id: string) => Promise<void>;
  completeReminder: (id: string) => Promise<ReminderWithTriggers | undefined>;
  snoozeReminder: (id: string, minutes?: number) => Promise<ReminderWithTriggers | undefined>;
  addEvent: (reminderId: string, eventType: ReminderEventType, metadata?: Record<string, unknown>) => Promise<void>;
  setLocationDraft: (draft?: LocationDraft) => void;
  clearLocalData: () => Promise<void>;
};

export const useReminderStore = create<ReminderState>((set, get) => ({
  reminders: [],
  events: [],
  hydrated: false,
  locationDraft: undefined,

  hydrate: async () => {
    const stored = await getStoredJson<ReminderPersistedState>(STORAGE_KEY, { reminders: [], events: [] });
    set({ ...stored, hydrated: true });
  },

  addReminder: async (input) => {
    const now = new Date().toISOString();
    const reminderId = createId("reminder");
    const reminder: ReminderWithTriggers = {
      id: reminderId,
      userId: APP_CONFIG.defaultUserId,
      title: input.title.trim(),
      notes: input.notes?.trim(),
      type: input.type,
      status: "active",
      createdAt: now,
      updatedAt: now,
      deliveryMode: input.deliveryMode,
      voiceScript: input.voiceScript,
      voiceStyle: input.voiceStyle,
      voiceEnabled: input.voiceEnabled,
      contactName: input.contactName,
      contactId: input.contactId,
      actionType: input.actionType,
      actionPayload: input.actionPayload,
      timeTrigger: input.timeTrigger ? createTimeTrigger(reminderId, input.timeTrigger) : undefined,
      locationTrigger: input.locationTrigger ? createLocationTrigger(reminderId, input.locationTrigger) : undefined,
      habit: input.habit ? createHabit(reminderId, input.habit) : undefined
    };

    const events = [createEvent(reminderId, "created")];
    const nextState = {
      reminders: [reminder, ...get().reminders],
      events: [...events, ...get().events]
    };
    set(nextState);
    await persist(nextState);
    return reminder;
  },

  updateReminder: async (id, input) => {
    let updatedReminder: ReminderWithTriggers | undefined;
    const reminders = get().reminders.map((reminder) => {
      if (reminder.id !== id) return reminder;

      const updated: ReminderWithTriggers = {
        ...reminder,
        title: input.title?.trim() ?? reminder.title,
        notes: input.notes?.trim() ?? reminder.notes,
        type: input.type ?? reminder.type,
        status: input.status ?? reminder.status,
        updatedAt: new Date().toISOString(),
        deliveryMode: input.deliveryMode ?? reminder.deliveryMode,
        voiceScript: input.voiceScript ?? reminder.voiceScript,
        voiceStyle: input.voiceStyle ?? reminder.voiceStyle,
        voiceEnabled: input.voiceEnabled ?? reminder.voiceEnabled,
        contactName: input.contactName ?? reminder.contactName,
        contactId: input.contactId ?? reminder.contactId,
        actionType: input.actionType ?? reminder.actionType,
        actionPayload: input.actionPayload ?? reminder.actionPayload,
        timeTrigger: input.timeTrigger ? createTimeTrigger(id, input.timeTrigger, reminder.timeTrigger?.id) : reminder.timeTrigger,
        locationTrigger: input.locationTrigger ? createLocationTrigger(id, input.locationTrigger, reminder.locationTrigger?.id) : reminder.locationTrigger,
        habit: input.habit ? createHabit(id, input.habit, reminder.habit?.id) : reminder.habit
      };
      updatedReminder = updated;
      return updated;
    });

    if (!updatedReminder) return undefined;

    const nextState = { reminders, events: [createEvent(id, "edited"), ...get().events] };
    set(nextState);
    await persist(nextState);
    return updatedReminder;
  },

  deleteReminder: async (id) => {
    const reminders = get().reminders.map((reminder) =>
      reminder.id === id ? { ...reminder, status: "deleted" as ReminderStatus, updatedAt: new Date().toISOString() } : reminder
    );
    const nextState = { reminders, events: [createEvent(id, "dismissed"), ...get().events] };
    set(nextState);
    await persist(nextState);
  },

  completeReminder: async (id) => {
    const now = new Date().toISOString();
    let completed: ReminderWithTriggers | undefined;
    const reminders = get().reminders.map((reminder) => {
      if (reminder.id !== id) return reminder;

      const habit = reminder.habit
        ? {
            ...reminder.habit,
            lastCompletedAt: now,
            nextDueAt: getNextHabitDueDate({ ...reminder.habit, lastCompletedAt: now, nextDueAt: undefined })
          }
        : undefined;
      completed = { ...reminder, status: "completed", updatedAt: now, habit };
      return completed;
    });

    if (!completed) return undefined;

    const nextState = { reminders, events: [createEvent(id, "completed"), ...get().events] };
    set(nextState);
    await persist(nextState);
    return completed;
  },

  snoozeReminder: async (id, minutes = APP_CONFIG.snoozeMinutes) => {
    let snoozed: ReminderWithTriggers | undefined;
    const reminders = get().reminders.map((reminder) => {
      if (reminder.id !== id) return reminder;

      const timeTrigger = reminder.timeTrigger
        ? { ...reminder.timeTrigger, triggerDateTime: snoozeTimeFromNow(minutes) }
        : reminder.timeTrigger;
      snoozed = { ...reminder, timeTrigger, status: "snoozed", updatedAt: new Date().toISOString() };
      return snoozed;
    });

    if (!snoozed) return undefined;

    const nextState = { reminders, events: [createEvent(id, "snoozed", { minutes }), ...get().events] };
    set(nextState);
    await persist(nextState);
    return snoozed;
  },

  addEvent: async (reminderId, eventType, metadata) => {
    const nextState = {
      reminders: get().reminders,
      events: [createEvent(reminderId, eventType, metadata), ...get().events]
    };
    set(nextState);
    await persist(nextState);
  },

  setLocationDraft: (locationDraft) => set({ locationDraft }),

  clearLocalData: async () => {
    await deleteStoredValue(STORAGE_KEY);
    set({ reminders: [], events: [], locationDraft: undefined, hydrated: true });
  }
}));

function createTimeTrigger(
  reminderId: string,
  input: ReminderCreateInput["timeTrigger"],
  existingId?: string
): TimeTrigger | undefined {
  if (!input) return undefined;
  return { id: existingId ?? createId("time"), reminderId, ...input };
}

function createLocationTrigger(
  reminderId: string,
  input: ReminderCreateInput["locationTrigger"],
  existingId?: string
): LocationTrigger | undefined {
  if (!input) return undefined;
  return { id: existingId ?? createId("location"), reminderId, ...input };
}

function createHabit(reminderId: string, input: ReminderCreateInput["habit"], existingId?: string): Habit | undefined {
  if (!input) return undefined;
  const habit = { id: existingId ?? createId("habit"), reminderId, ...input };
  return { ...habit, nextDueAt: getNextHabitDueDate(habit) };
}

function createEvent(reminderId: string, eventType: ReminderEventType, metadata?: Record<string, unknown>): ReminderEvent {
  return { id: createId("event"), reminderId, eventType, timestamp: new Date().toISOString(), metadata };
}

async function persist(state: ReminderPersistedState): Promise<void> {
  await setStoredJson(STORAGE_KEY, state);
}
