import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { MemorySource, MemoryType, PromiseStatus, ReminderType } from "@/common/enums";
import { PrismaService } from "@/prisma/prisma.service";
import { PrivacyService } from "@/privacy/privacy.service";
import { MemoryService } from "@/memory/memory.service";
import { CreatePromiseDto, PromiseReminderDto, UpdatePromiseDto } from "./dto/promise.dto";

@Injectable()
export class PromisesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly privacy: PrivacyService,
    private readonly memory: MemoryService
  ) {}

  list(userId: string) {
    return this.prisma.promise.findMany({ where: { userId }, orderBy: [{ status: "asc" }, { deadline: "asc" }] });
  }

  async create(userId: string, dto: CreatePromiseDto) {
    const settings = await this.privacy.getSettings(userId);
    if (!settings.promiseTrackingEnabled) throw new ForbiddenException("Promise tracking is disabled in Control.");
    const savedMemory = dto.sourceMemoryId ? undefined : await this.memory.create(userId, {
      type: MemoryType.PROMISE,
      title: `${dto.taskTitle} for ${dto.personName}`,
      body: dto.deadline ? `Due ${dto.deadline}` : "No deadline set.",
      entities: { person: dto.personName, commitment: dto.taskTitle, deadline: dto.deadline },
      source: MemorySource.MANUAL,
      confidence: 1
    });
    return this.prisma.promise.create({
      data: {
        userId,
        personName: dto.personName.trim(),
        taskTitle: dto.taskTitle.trim(),
        deadline: dto.deadline ? new Date(dto.deadline) : undefined,
        sourceMemoryId: dto.sourceMemoryId ?? savedMemory?.id
      }
    });
  }

  async update(userId: string, id: string, dto: UpdatePromiseDto) {
    await this.get(userId, id);
    return this.prisma.promise.update({
      where: { id },
      data: { ...dto, deadline: dto.deadline ? new Date(dto.deadline) : undefined }
    });
  }

  async complete(userId: string, id: string) {
    await this.get(userId, id);
    return this.prisma.promise.update({ where: { id }, data: { status: PromiseStatus.COMPLETED, completedAt: new Date() } });
  }

  async createReminder(userId: string, id: string, dto: PromiseReminderDto) {
    const promise = await this.get(userId, id);
    const triggerDateTime = dto.remindAt ? new Date(dto.remindAt) : promise.deadline ?? new Date(Date.now() + 24 * 60 * 60 * 1000);
    const reminder = await this.prisma.reminder.create({
      data: {
        userId,
        title: `Follow up: ${promise.taskTitle}`,
        type: ReminderType.TIME,
        timeTrigger: { create: { triggerDateTime, timezone: "Africa/Lagos" } }
      }
    });
    return this.prisma.promise.update({ where: { id }, data: { reminderId: reminder.id } });
  }

  private async get(userId: string, id: string) {
    const item = await this.prisma.promise.findFirst({ where: { id, userId } });
    if (!item) throw new NotFoundException("Promise not found.");
    return item;
  }
}
