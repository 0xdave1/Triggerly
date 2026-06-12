import { ForbiddenException, Injectable } from "@nestjs/common";
import { ActionType, ReminderStatus, TriggerType } from "@/common/enums";
import { PrismaService } from "@/prisma/prisma.service";
import { UpdatePrivacySettingsDto } from "./dto/update-privacy-settings.dto";

@Injectable()
export class PrivacyService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(userId: string) {
    return this.prisma.userPrivacySetting.upsert({
      where: { userId },
      update: {},
      create: { userId }
    });
  }

  async updateSettings(userId: string, dto: UpdatePrivacySettingsDto) {
    await this.getSettings(userId);
    return this.prisma.userPrivacySetting.update({
      where: { userId },
      data: dto
    });
  }

  async assertCanParseAi(userId: string) {
    const settings = await this.getSettings(userId);
    if (!settings.aiParsingEnabled) throw new ForbiddenException("AI parsing is disabled in privacy settings.");
  }

  async assertCanCreateMemory(userId: string, type?: string) {
    const settings = await this.getSettings(userId);
    if (!settings.memoryEnabled) throw new ForbiddenException("Memory is disabled in privacy settings.");
    if (type === "PRICE" && !settings.priceMemoryEnabled) throw new ForbiddenException("Price memory is disabled in privacy settings.");
    if (type === "PERSON" && !settings.contactMemoryEnabled) throw new ForbiddenException("Contact memory is disabled in privacy settings.");
  }

  async assertCanCreateTrigger(userId: string, triggerType: TriggerType) {
    const settings = await this.getSettings(userId);
    if ((triggerType === TriggerType.LOCATION_ARRIVAL || triggerType === TriggerType.LOCATION_DEPARTURE) && !settings.locationTriggersEnabled) {
      throw new ForbiddenException("Location triggers are disabled in privacy settings.");
    }
    if (triggerType === TriggerType.WEATHER && !settings.weatherTriggersEnabled) {
      throw new ForbiddenException("Weather triggers are disabled in privacy settings.");
    }
    if (triggerType === TriggerType.EXCHANGE_RATE && !settings.exchangeRateTriggersEnabled) {
      throw new ForbiddenException("Exchange rate triggers are disabled in privacy settings.");
    }
  }

  async assertCanCreateActionPrompt(userId: string, actionType: ActionType) {
    const settings = await this.getSettings(userId);
    if (actionType === ActionType.OPEN_PAYMENT_APP && !settings.paymentActionsEnabled) {
      throw new ForbiddenException("Payment action prompts are disabled in privacy settings.");
    }
    if (actionType === ActionType.PAYMENT_REMINDER && !settings.paymentRemindersEnabled) {
      throw new ForbiddenException("Payment reminders are disabled in privacy settings.");
    }
    if (actionType === ActionType.DRAFT_EMAIL && !settings.emailDraftingEnabled) {
      throw new ForbiddenException("Email drafting is disabled in privacy settings.");
    }
    if (actionType === ActionType.DRAFT_MESSAGE && !settings.messageDraftingEnabled) {
      throw new ForbiddenException("Message drafting is disabled in privacy settings.");
    }
    if (actionType === ActionType.CALL_CONTACT && !settings.contactAccessEnabled) {
      throw new ForbiddenException("Contact actions are disabled in privacy settings.");
    }
    if (actionType === ActionType.CREATE_CALENDAR_EVENT && !settings.calendarIntegrationEnabled) {
      throw new ForbiddenException("Calendar integration is disabled in privacy settings.");
    }
  }

  async exportUserData(userId: string) {
    const [user, reminders, events, devices, privacySetting, memories] = await Promise.all([
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
      this.prisma.userPrivacySetting.findUnique({ where: { userId } }),
      this.prisma.memory.findMany({ where: { userId } })
    ]);

    return {
      exportedAt: new Date().toISOString(),
      user,
      reminders,
      events,
      devices,
      privacySetting,
      memories
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
