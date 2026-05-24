import { Injectable, NotFoundException } from "@nestjs/common";
import { HabitFrequencyType, ReminderEventType, ReminderStatus, ReminderType } from "@/common/enums";
import { calculateNextDueAt } from "@/common/utils/habit-dates";
import { ReminderEventsService } from "@/events/reminder-events.service";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateHabitDto } from "./dto/create-habit.dto";

@Injectable()
export class HabitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: ReminderEventsService
  ) {}

  list(userId: string) {
    return this.prisma.habit.findMany({
      where: { reminder: { userId, status: { not: ReminderStatus.DELETED } } },
      include: { reminder: true },
      orderBy: { nextDueAt: "asc" }
    });
  }

  async create(userId: string, dto: CreateHabitDto) {
    return this.prisma.$transaction((tx) =>
      tx.reminder.create({
        data: {
          userId,
          title: dto.title.trim(),
          notes: dto.notes?.trim(),
          type: ReminderType.HABIT,
          habit: {
            create: {
              frequencyType: dto.frequencyType,
              frequencyCount: dto.frequencyCount,
              nextDueAt: calculateNextDueAt(dto.frequencyType, dto.frequencyCount)
            }
          },
          events: { create: { userId, eventType: ReminderEventType.CREATED } }
        },
        include: { habit: true }
      })
    );
  }

  async complete(userId: string, habitId: string) {
    const habit = await this.prisma.habit.findFirst({
      where: { id: habitId, reminder: { userId, status: { not: ReminderStatus.DELETED } } },
      include: { reminder: true }
    });
    if (!habit) throw new NotFoundException("Habit not found.");

    const now = new Date();
    const updated = await this.prisma.habit.update({
      where: { id: habitId },
      data: {
        lastCompletedAt: now,
        nextDueAt: calculateNextDueAt(habit.frequencyType as HabitFrequencyType, habit.frequencyCount, now)
      },
      include: { reminder: true }
    });
    await this.prisma.reminder.update({
      where: { id: habit.reminderId },
      data: { status: ReminderStatus.ACTIVE, completedAt: null }
    });
    await this.events.create(userId, habit.reminderId, ReminderEventType.COMPLETED);
    return updated;
  }
}
