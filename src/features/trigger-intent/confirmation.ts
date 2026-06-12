import type { ReminderCreateInput, TriggerIntent } from "@/features/reminders/types";
import { NIGERIA_TIME_ZONE, parseNigeriaDateTimeInput } from "@/lib/timezone";

export function triggerIntentToReminderInput(intent: TriggerIntent): ReminderCreateInput {
  const base = {
    title: intent.taskTitle,
    deliveryMode: intent.suggestedDeliveryMode,
    voiceScript: intent.suggestedVoiceScript,
    voiceEnabled: intent.suggestedDeliveryMode === "voice" || intent.suggestedDeliveryMode === "voice_and_push",
    contactName: intent.contactCandidate,
    actionType: intent.actionType
  };

  if (intent.triggerType === "location_arrival" || intent.triggerType === "location_departure" || intent.triggerType === "errand_group") {
    return {
      ...base,
      type: "location",
      locationTrigger: {
        placeName: intent.locationCandidate || "Selected place",
        latitude: 0,
        longitude: 0,
        radiusMeters: 250,
        triggerType: intent.triggerType === "location_departure" ? "departure" : "arrival"
      }
    };
  }

  if (intent.triggerType === "habit") {
    return {
      ...base,
      type: "habit",
      habit: {
        frequencyType: intent.frequency ?? "weekly",
        frequencyCount: 1
      }
    };
  }

  return {
    ...base,
    type: "time",
    timeTrigger: {
      triggerDateTime: parseTimeCandidate(intent.timeCandidate),
      timezone: NIGERIA_TIME_ZONE
    }
  };
}

function parseTimeCandidate(candidate?: string): string {
  try {
    return parseNigeriaDateTimeInput(candidate ?? "tomorrow 9am");
  } catch {
    return parseNigeriaDateTimeInput("tomorrow 9am");
  }
}
