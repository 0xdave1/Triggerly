import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { LiveContextTriggerStatus, LiveContextTriggerType, TravelPlanStatus } from "@/common/enums";
import { toPrismaJson } from "@/common/utils/prisma-json";
import { PrismaService } from "@/prisma/prisma.service";
import { PrivacyService } from "@/privacy/privacy.service";
import { CreateTravelPlanDto, UpdateTravelPlanDto } from "./dto/travel.dto";

const DEFAULT_TRAVEL_ITEMS = ["Identification", "Phone charger", "Medication", "Weather-ready clothing", "Travel documents"];

@Injectable()
export class TravelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly privacy: PrivacyService
  ) {}

  list(userId: string) {
    return this.prisma.travelPlan.findMany({ where: { userId }, include: { checklistItems: true }, orderBy: { departureDate: "asc" } });
  }

  async get(userId: string, id: string) {
    const plan = await this.prisma.travelPlan.findFirst({ where: { id, userId }, include: { checklistItems: true } });
    if (!plan) throw new NotFoundException("Travel plan not found.");
    return plan;
  }

  async create(userId: string, dto: CreateTravelPlanDto) {
    const settings = await this.privacy.getSettings(userId);
    if (!settings.travelModeEnabled) throw new ForbiddenException("Travel mode is disabled in Control.");
    return this.prisma.travelPlan.create({
      data: {
        userId,
        destination: dto.destination.trim(),
        origin: dto.origin?.trim(),
        departureDate: dto.departureDate ? new Date(dto.departureDate) : undefined,
        returnDate: dto.returnDate ? new Date(dto.returnDate) : undefined,
        weatherAlertsEnabled: dto.weatherAlertsEnabled ?? false,
        checklistEnabled: dto.checklistEnabled ?? true
      },
      include: { checklistItems: true }
    });
  }

  async update(userId: string, id: string, dto: UpdateTravelPlanDto) {
    await this.get(userId, id);
    return this.prisma.travelPlan.update({
      where: { id },
      data: {
        ...dto,
        departureDate: dto.departureDate ? new Date(dto.departureDate) : undefined,
        returnDate: dto.returnDate ? new Date(dto.returnDate) : undefined
      },
      include: { checklistItems: true }
    });
  }

  async generateChecklist(userId: string, id: string) {
    const plan = await this.get(userId, id);
    if (!plan.checklistItems.length) {
      await this.prisma.travelChecklistItem.createMany({
        data: DEFAULT_TRAVEL_ITEMS.map((title) => ({ travelPlanId: id, title }))
      });
    }
    return this.get(userId, id);
  }

  async enableWeatherAlerts(userId: string, id: string) {
    const settings = await this.privacy.getSettings(userId);
    if (!settings.weatherTriggersEnabled) throw new ForbiddenException("Weather triggers are disabled in Control.");
    const plan = await this.get(userId, id);
    await this.prisma.$transaction([
      this.prisma.travelPlan.update({ where: { id }, data: { weatherAlertsEnabled: true } }),
      this.prisma.liveContextTrigger.create({
        data: {
          userId,
          type: LiveContextTriggerType.TRAVEL,
          title: `Weather for ${plan.destination}`,
          status: LiveContextTriggerStatus.ACTIVE,
          condition: toPrismaJson({ location: plan.destination, date: plan.departureDate, travelPlanId: id })
        }
      })
    ]);
    return this.get(userId, id);
  }

  async complete(userId: string, id: string) {
    await this.get(userId, id);
    return this.prisma.travelPlan.update({ where: { id }, data: { status: TravelPlanStatus.COMPLETED } });
  }
}
