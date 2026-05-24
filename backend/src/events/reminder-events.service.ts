import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ReminderEventType } from "@/common/enums";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateReminderEventDto } from "./dto/create-reminder-event.dto";

@Injectable()
export class ReminderEventsService {
  constructor(private readonly prisma: PrismaService) {}

  async createForOwnedReminder(userId: string, reminderId: string, dto: CreateReminderEventDto) {
    const reminder = await this.prisma.reminder.findFirst({
      where: { id: reminderId, userId, status: { not: "DELETED" } },
      select: { id: true }
    });
    if (!reminder) throw new NotFoundException("Reminder not found.");

    return this.create(userId, reminderId, dto.eventType, dto.metadata);
  }

  async create(userId: string, reminderId: string, eventType: ReminderEventType, metadata?: Record<string, unknown>) {
    return this.prisma.reminderEvent.create({
      data: { userId, reminderId, eventType, metadata: metadata ?? undefined }
    });
  }
}
