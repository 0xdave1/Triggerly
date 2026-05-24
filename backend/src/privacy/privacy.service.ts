import { Injectable } from "@nestjs/common";
import { ReminderStatus } from "@/common/enums";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class PrivacyService {
  constructor(private readonly prisma: PrismaService) {}

  async exportUserData(userId: string) {
    const [user, reminders, events, devices, privacySetting] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, createdAt: true, updatedAt: true }
      }),
      this.prisma.reminder.findMany({
        where: { userId },
        include: { timeTrigger: true, locationTrigger: true, habit: true }
      }),
      this.prisma.reminderEvent.findMany({ where: { userId } }),
      this.prisma.device.findMany({ where: { userId } }),
      this.prisma.userPrivacySetting.findUnique({ where: { userId } })
    ]);

    return {
      exportedAt: new Date().toISOString(),
      user,
      reminders,
      events,
      devices,
      privacySetting
    };
  }

  async deleteAccount(userId: string) {
    await this.prisma.$transaction([
      this.prisma.reminder.updateMany({
        where: { userId },
        data: { status: ReminderStatus.DELETED, deletedAt: new Date() }
      }),
      this.prisma.device.deleteMany({ where: { userId } }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          name: null,
          email: `deleted-${userId}@triggerly.local`,
          passwordHash: "deleted"
        }
      })
    ]);

    return { deleted: true, mode: "soft-delete/anonymize" };
  }
}
