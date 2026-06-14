import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { MemorySource, MemoryType, PriceLogSource, ReminderType } from "@/common/enums";
import { MemoryService } from "@/memory/memory.service";
import { PrismaService } from "@/prisma/prisma.service";
import { PrivacyService } from "@/privacy/privacy.service";
import { CreatePriceDto, PriceReminderDto } from "./dto/price.dto";

@Injectable()
export class PricesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly privacy: PrivacyService,
    private readonly memory: MemoryService
  ) {}

  list(userId: string) {
    return this.prisma.priceLog.findMany({ where: { userId }, orderBy: { loggedAt: "desc" } });
  }

  history(userId: string, itemName: string) {
    return this.prisma.priceLog.findMany({
      where: { userId, itemName: { equals: itemName, mode: "insensitive" } },
      orderBy: { loggedAt: "desc" }
    });
  }

  async compare(userId: string, itemName: string) {
    const entries = await this.prisma.priceLog.findMany({
      where: { userId, itemName: { equals: itemName, mode: "insensitive" } },
      orderBy: { loggedAt: "desc" },
      take: 2
    });
    if (entries.length < 2) return { itemName, entries, change: null, message: "Add another price to compare." };
    const current = Number(entries[0].price);
    const previous = Number(entries[1].price);
    const percent = previous ? ((current - previous) / previous) * 100 : 0;
    return { itemName, current, previous, change: current - previous, percent, direction: percent > 0 ? "up" : percent < 0 ? "down" : "same" };
  }

  async create(userId: string, dto: CreatePriceDto) {
    const settings = await this.privacy.getSettings(userId);
    if (!settings.priceMemoryEnabled) throw new ForbiddenException("Price memory is disabled in Control.");
    const price = await this.prisma.priceLog.create({
      data: {
        userId,
        ...dto,
        currency: dto.currency ?? "NGN",
        source: dto.source ?? PriceLogSource.MANUAL,
        loggedAt: dto.loggedAt ? new Date(dto.loggedAt) : undefined
      }
    });
    await this.memory.create(userId, {
      type: MemoryType.PRICE,
      title: `${dto.itemName} price${dto.placeName ? ` at ${dto.placeName}` : ""}`,
      body: `${dto.currency ?? "NGN"} ${dto.price.toLocaleString("en-NG")}`,
      entities: { item: dto.itemName, price: dto.price, currency: dto.currency ?? "NGN", place: dto.placeName, priceLogId: price.id },
      source: MemorySource.MANUAL,
      confidence: 1
    });
    return price;
  }

  async createReminder(userId: string, id: string, dto: PriceReminderDto) {
    const price = await this.prisma.priceLog.findFirst({ where: { id, userId } });
    if (!price) throw new NotFoundException("Price record not found.");
    return this.prisma.reminder.create({
      data: {
        userId,
        title: `Check the price of ${price.itemName}`,
        type: ReminderType.TIME,
        timeTrigger: {
          create: {
            triggerDateTime: dto.remindAt ? new Date(dto.remindAt) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            timezone: "Africa/Lagos"
          }
        }
      }
    });
  }
}
