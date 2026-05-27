import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { ActionPromptStatus, ReminderEventType, ReminderStatus, ReminderType } from "@/common/enums";
import { PrismaService } from "@/prisma/prisma.service";
import { ReminderEventsService } from "@/events/reminder-events.service";
import { NotificationsService } from "@/notifications/notifications.service";
import { TriggersService } from "@/triggers/triggers.service";
import { CreateReminderDto } from "./dto/create-reminder.dto";
import { ListRemindersDto } from "./dto/list-reminders.dto";
import { SnoozeReminderDto } from "./dto/snooze-reminder.dto";
import { UpdateReminderDto } from "./dto/update-reminder.dto";
import { CreateReminderEventDto } from "@/events/dto/create-reminder-event.dto";

const reminderInclude = {
  timeTrigger: true,
  locationTrigger: true,
  habit: true
};

@Injectable()
export class RemindersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly triggers: TriggersService,
    private readonly events: ReminderEventsService,
    private readonly notifications: NotificationsService
  ) {}

  async list(userId: string, query: ListRemindersDto) {
    return this.prisma.reminder.findMany({
      where: {
        userId,
        status: query.status ?? { not: ReminderStatus.DELETED },
        type: query.type
      },
      include: reminderInclude,
      orderBy: { updatedAt: "desc" }
    });
  }

  async get(userId: string, id: string) {
    return this.findOwned(userId, id);
  }

  async create(userId: string, dto: CreateReminderDto) {
    this.validateTriggerRules(dto);

    const reminder = await this.prisma.$transaction(async (tx) => {
      const created = await tx.reminder.create({
        data: {
          userId,
          title: dto.title.trim(),
          notes: dto.notes?.trim(),
          type: dto.type,
          deliveryMode: dto.deliveryMode,
          voiceScript: dto.voiceScript,
          voiceEnabled: dto.voiceEnabled,
          contactMemoryId: dto.contactMemoryId,
          actionPrompt: dto.actionType
            ? {
                create: {
                  userId,
                  actionType: dto.actionType,
                  payload: dto.actionPayload as Prisma.InputJsonValue | undefined,
                  status: ActionPromptStatus.PENDING_CONFIRMATION
                }
              }
            : undefined,
          timeTrigger: dto.timeTrigger ? { create: this.triggers.buildTimeTrigger(dto.timeTrigger) } : undefined,
          locationTrigger: dto.locationTrigger ? { create: this.triggers.buildLocationTrigger(dto.locationTrigger) } : undefined,
          habit: dto.habit ? { create: this.triggers.buildHabit(dto.habit) } : undefined,
          events: {
            create: {
              userId,
              eventType: ReminderEventType.CREATED
            }
          }
        },
        include: reminderInclude
      });
      return created;
    });

    await this.scheduleIfNeeded(userId, reminder);
    return reminder;
  }

  async update(userId: string, id: string, dto: UpdateReminderDto) {
    await this.findOwned(userId, id);
    const nextType = dto.type;
    if (nextType) this.validateTriggerRules({ ...dto, title: dto.title ?? "existing", type: nextType } as CreateReminderDto);

    const reminder = await this.prisma.reminder.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        notes: dto.notes?.trim(),
        type: dto.type,
        status: dto.status,
        deliveryMode: dto.deliveryMode,
        voiceScript: dto.voiceScript,
        voiceEnabled: dto.voiceEnabled,
        contactMemoryId: dto.contactMemoryId,
        actionPrompt: dto.actionType
          ? {
              upsert: {
                create: {
                  userId,
                  actionType: dto.actionType,
                  payload: dto.actionPayload as Prisma.InputJsonValue | undefined,
                  status: ActionPromptStatus.PENDING_CONFIRMATION
                },
                update: {
                  actionType: dto.actionType,
                  payload: dto.actionPayload as Prisma.InputJsonValue | undefined,
                  status: ActionPromptStatus.PENDING_CONFIRMATION
                }
              }
            }
          : undefined,
        timeTrigger: dto.timeTrigger
          ? {
              upsert: {
                create: this.triggers.buildTimeTrigger(dto.timeTrigger),
                update: this.triggers.buildTimeTrigger(dto.timeTrigger)
              }
            }
          : undefined,
        locationTrigger: dto.locationTrigger
          ? {
              upsert: {
                create: this.triggers.buildLocationTrigger(dto.locationTrigger),
                update: this.triggers.buildLocationTrigger(dto.locationTrigger)
              }
            }
          : undefined,
        habit: dto.habit
          ? {
              upsert: {
                create: this.triggers.buildHabit(dto.habit),
                update: this.triggers.buildHabit(dto.habit)
              }
            }
          : undefined
      },
      include: reminderInclude
    });

    await this.events.create(userId, id, ReminderEventType.EDITED);
    await this.scheduleIfNeeded(userId, reminder);
    return reminder;
  }

  async softDelete(userId: string, id: string) {
    await this.findOwned(userId, id);
    await this.notifications.cancelReminderNotification(id);
    const reminder = await this.prisma.reminder.update({
      where: { id },
      data: { status: ReminderStatus.DELETED, deletedAt: new Date() },
      include: reminderInclude
    });
    await this.events.create(userId, id, ReminderEventType.DELETED);
    return reminder;
  }

  async complete(userId: string, id: string) {
    await this.findOwned(userId, id);
    await this.notifications.cancelReminderNotification(id);
    const reminder = await this.prisma.reminder.update({
      where: { id },
      data: { status: ReminderStatus.COMPLETED, completedAt: new Date() },
      include: reminderInclude
    });
    await this.events.create(userId, id, ReminderEventType.COMPLETED);
    return reminder;
  }

  async snooze(userId: string, id: string, dto: SnoozeReminderDto) {
    await this.findOwned(userId, id);
    const snoozeUntil = new Date(dto.snoozeUntil);
    const reminder = await this.prisma.reminder.update({
      where: { id },
      data: {
        status: ReminderStatus.SNOOZED,
        timeTrigger: {
          upsert: {
            create: { triggerDateTime: snoozeUntil, timezone: "UTC" },
            update: { triggerDateTime: snoozeUntil }
          }
        }
      },
      include: reminderInclude
    });
    await this.events.create(userId, id, ReminderEventType.SNOOZED, { snoozeUntil: dto.snoozeUntil });
    await this.scheduleIfNeeded(userId, reminder);
    return reminder;
  }

  async createEvent(userId: string, id: string, dto: CreateReminderEventDto) {
    return this.events.createForOwnedReminder(userId, id, dto);
  }

  private async findOwned(userId: string, id: string) {
    const reminder = await this.prisma.reminder.findFirst({
      where: { id, userId, status: { not: ReminderStatus.DELETED } },
      include: reminderInclude
    });
    if (!reminder) throw new NotFoundException("Reminder not found.");
    return reminder;
  }

  private validateTriggerRules(dto: CreateReminderDto) {
    if (!dto.title?.trim()) throw new BadRequestException("Title is required.");
    if (dto.type === ReminderType.TIME && !dto.timeTrigger) throw new BadRequestException("TIME reminders require timeTrigger.");
    if (dto.type === ReminderType.LOCATION && !dto.locationTrigger) throw new BadRequestException("LOCATION reminders require locationTrigger.");
    if (dto.type === ReminderType.HABIT && !dto.habit) throw new BadRequestException("HABIT reminders require habit.");
    if (dto.type === ReminderType.HYBRID && !dto.timeTrigger && !dto.locationTrigger && !dto.habit) {
      throw new BadRequestException("HYBRID reminders require at least one trigger.");
    }
  }

  private async scheduleIfNeeded(userId: string, reminder: { id: string; timeTrigger?: { triggerDateTime: Date } | null }) {
    if (!reminder.timeTrigger) return;
    await this.notifications.scheduleTimeReminderNotification({
      userId,
      reminderId: reminder.id,
      triggerDateTime: reminder.timeTrigger.triggerDateTime.toISOString()
    });
  }
}
