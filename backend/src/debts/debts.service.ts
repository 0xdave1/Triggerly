import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { DebtStatus, MemorySource, MemoryType, ReminderType } from "@/common/enums";
import { MemoryService } from "@/memory/memory.service";
import { PrismaService } from "@/prisma/prisma.service";
import { PrivacyService } from "@/privacy/privacy.service";
import { CreateDebtDto, DebtReminderDto, UpdateDebtDto } from "./dto/debt.dto";

@Injectable()
export class DebtsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly privacy: PrivacyService,
    private readonly memory: MemoryService
  ) {}

  list(userId: string) {
    return this.prisma.debt.findMany({ where: { userId }, orderBy: [{ status: "asc" }, { updatedAt: "desc" }] });
  }

  async create(userId: string, dto: CreateDebtDto) {
    const settings = await this.privacy.getSettings(userId);
    if (!settings.debtFavourMemoryEnabled) throw new ForbiddenException("Debt and favour memory is disabled in Control.");
    const savedMemory = dto.sourceMemoryId ? undefined : await this.memory.create(userId, {
      type: MemoryType.DEBT,
      title: dto.direction === "OWED_TO_ME" ? `${dto.personName} owes me ${dto.currency ?? "NGN"} ${dto.amount}` : `I owe ${dto.personName} ${dto.currency ?? "NGN"} ${dto.amount}`,
      body: "Saved after user confirmation.",
      entities: { person: dto.personName, amount: dto.amount, currency: dto.currency ?? "NGN", direction: dto.direction },
      source: MemorySource.MANUAL,
      confidence: 1
    });
    return this.prisma.debt.create({ data: { userId, ...dto, currency: dto.currency ?? "NGN", sourceMemoryId: dto.sourceMemoryId ?? savedMemory?.id } });
  }

  async update(userId: string, id: string, dto: UpdateDebtDto) {
    await this.get(userId, id);
    return this.prisma.debt.update({ where: { id }, data: dto });
  }

  async settle(userId: string, id: string) {
    await this.get(userId, id);
    return this.prisma.debt.update({ where: { id }, data: { status: DebtStatus.PAID, settledAt: new Date() } });
  }

  async createReminder(userId: string, id: string, dto: DebtReminderDto) {
    const debt = await this.get(userId, id);
    const reminder = await this.prisma.reminder.create({
      data: {
        userId,
        title: `Follow up with ${debt.personName} about ${debt.currency} ${debt.amount}`,
        type: ReminderType.TIME,
        timeTrigger: {
          create: {
            triggerDateTime: dto.remindAt ? new Date(dto.remindAt) : new Date(Date.now() + 24 * 60 * 60 * 1000),
            timezone: "Africa/Lagos"
          }
        }
      }
    });
    return this.prisma.debt.update({ where: { id }, data: { reminderId: reminder.id } });
  }

  private async get(userId: string, id: string) {
    const item = await this.prisma.debt.findFirst({ where: { id, userId } });
    if (!item) throw new NotFoundException("Debt record not found.");
    return item;
  }
}
