import { Injectable } from "@nestjs/common";
import { calculateNextDueAt } from "@/common/utils/habit-dates";
import { HabitDto, LocationTriggerDto, TimeTriggerDto } from "@/reminders/dto/trigger.dto";

@Injectable()
export class TriggersService {
  buildTimeTrigger(input: TimeTriggerDto) {
    return {
      triggerDateTime: new Date(input.triggerDateTime),
      timezone: input.timezone,
      repeatRule: input.repeatRule
    };
  }

  buildLocationTrigger(input: LocationTriggerDto) {
    return {
      placeName: input.placeName,
      latitude: input.latitude,
      longitude: input.longitude,
      radiusMeters: input.radiusMeters,
      triggerType: input.triggerType
    };
  }

  buildHabit(input: HabitDto, fromDate = new Date()) {
    return {
      frequencyType: input.frequencyType,
      frequencyCount: input.frequencyCount,
      nextDueAt: calculateNextDueAt(input.frequencyType, input.frequencyCount, fromDate)
    };
  }
}
