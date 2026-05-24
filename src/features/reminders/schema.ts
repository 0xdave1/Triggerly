import { z } from "zod";

export const reminderTypeSchema = z.enum(["time", "location", "habit", "hybrid"]);
export const reminderStatusSchema = z.enum(["active", "completed", "deleted", "snoozed"]);

export const timeTriggerInputSchema = z.object({
  triggerDateTime: z.string().datetime("Use a valid ISO date and time."),
  timezone: z.string().min(1, "Timezone is required."),
  repeatRule: z.string().optional()
});

export const locationTriggerInputSchema = z.object({
  placeName: z.string().min(1, "Place name is required."),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radiusMeters: z.coerce.number().min(50),
  triggerType: z.enum(["arrival", "departure"])
});

export const habitInputSchema = z.object({
  frequencyType: z.enum(["daily", "weekly", "monthly", "custom"]),
  frequencyCount: z.coerce.number().int().min(1, "Frequency count must be at least 1.")
});

export const deliveryModeSchema = z.enum(["push", "voice", "voice_and_push", "silent", "urgent"]);
export const voiceStyleSchema = z.enum(["calm", "energetic", "professional", "friendly", "minimal"]);
export const actionPromptSchema = z.enum(["draft_email", "open_payment_app", "call_contact", "open_maps", "open_url"]);

export const reminderCreateSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required."),
    notes: z.string().optional(),
    type: reminderTypeSchema,
    timeTrigger: timeTriggerInputSchema.optional(),
    locationTrigger: locationTriggerInputSchema.optional(),
    habit: habitInputSchema.optional(),
    deliveryMode: deliveryModeSchema.optional(),
    voiceScript: z.string().optional(),
    voiceStyle: voiceStyleSchema.optional(),
    voiceEnabled: z.boolean().optional(),
    contactName: z.string().optional(),
    contactId: z.string().optional(),
    actionType: actionPromptSchema.optional(),
    actionPayload: z.record(z.unknown()).optional()
  })
  .superRefine((value, context) => {
    if (value.type === "time" && !value.timeTrigger) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Time reminders require a date and time.", path: ["timeTrigger"] });
    }

    if (value.type === "location" && !value.locationTrigger) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Location reminders require a place, coordinates, and radius.", path: ["locationTrigger"] });
    }

    if (value.type === "habit" && !value.habit) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: "Habit reminders require a frequency.", path: ["habit"] });
    }
  });

export type ReminderCreateSchema = z.infer<typeof reminderCreateSchema>;
