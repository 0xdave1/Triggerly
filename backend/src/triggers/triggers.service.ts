import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { HabitFrequencyType, LiveContextTriggerType, TriggerType } from "@/common/enums";
import { calculateNextDueAt } from "@/common/utils/habit-dates";
import { toNullablePrismaJson, toPrismaJson } from "@/common/utils/prisma-json";
import { PrismaService } from "@/prisma/prisma.service";
import { PrivacyService } from "@/privacy/privacy.service";
import { HabitDto, LocationTriggerDto, TimeTriggerDto } from "@/reminders/dto/trigger.dto";
import { ConfirmTriggerDto } from "./dto/confirm-trigger.dto";

@Injectable()
export class TriggersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly privacy: PrivacyService
  ) {}

  list(userId: string) {
    return this.prisma.trigger.findMany({
      where: { userId, status: { not: "DELETED" } },
      include: { habitTrigger: true },
      orderBy: { updatedAt: "desc" }
    });
  }

  async confirm(userId: string, dto: ConfirmTriggerDto) {
    if (!dto.confirmed) throw new BadRequestException("User confirmation is required before creating a trigger.");
    await this.privacy.assertCanCreateTrigger(userId, dto.type);
    if (dto.reminderId) await this.assertReminderOwner(userId, dto.reminderId);

    return this.prisma.$transaction(async (tx) => {
      const trigger = await tx.trigger.create({
        data: {
          userId,
          reminderId: dto.reminderId,
          type: dto.type,
          title: dto.title?.trim(),
          configuration: toNullablePrismaJson(dto.configuration),
          requiresConfirmation: true,
          confirmedAt: new Date()
        }
      });

      if (dto.type === TriggerType.HABIT) {
        const frequencyType = Object.values(HabitFrequencyType).includes(dto.configuration?.frequencyType as HabitFrequencyType)
          ? (dto.configuration?.frequencyType as HabitFrequencyType)
          : HabitFrequencyType.DAILY;
        await tx.habitTrigger.create({
          data: {
            userId,
            triggerId: trigger.id,
            frequencyType,
            frequencyCount: Number(dto.configuration?.frequencyCount ?? 1),
            nextDueAt: calculateNextDueAt(frequencyType, Number(dto.configuration?.frequencyCount ?? 1), new Date())
          }
        });
      }

      if (dto.type === TriggerType.WEATHER || dto.type === TriggerType.EXCHANGE_RATE || dto.type === TriggerType.PRICE || dto.type === TriggerType.TRAVEL) {
        await tx.liveContextTrigger.create({
          data: {
            userId,
            type: toLiveContextTriggerType(dto.type),
            title: dto.title?.trim() ?? `${dto.type.toLowerCase()} trigger`,
            condition: toPrismaJson({
              ...(dto.configuration ?? {}),
              sourceTriggerId: trigger.id
            })
          }
        });
      }

      return trigger;
    });
  }

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

  private async assertReminderOwner(userId: string, reminderId: string) {
    const reminder = await this.prisma.reminder.findFirst({ where: { id: reminderId, userId } });
    if (!reminder) throw new ForbiddenException("Reminder does not belong to this user.");
  }
}

function toLiveContextTriggerType(type: TriggerType): LiveContextTriggerType {
  if (type === TriggerType.EXCHANGE_RATE) return LiveContextTriggerType.EXCHANGE_RATE;
  if (type === TriggerType.PRICE) return LiveContextTriggerType.PRICE;
  if (type === TriggerType.TRAVEL) return LiveContextTriggerType.TRAVEL;
  return LiveContextTriggerType.WEATHER;
}
