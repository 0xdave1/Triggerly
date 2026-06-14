import { ForbiddenException, Injectable } from "@nestjs/common";
import { BriefingType } from "@/common/enums";
import { toPrismaJson } from "@/common/utils/prisma-json";
import { PrismaService } from "@/prisma/prisma.service";
import { PrivacyService } from "@/privacy/privacy.service";
import { GenerateBriefingDto, UpdateBriefingPreferenceDto } from "./dto/briefing.dto";

@Injectable()
export class BriefingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly privacy: PrivacyService
  ) {}

  getPreferences(userId: string) {
    return this.prisma.briefingPreference.upsert({
      where: { userId },
      create: { userId },
      update: {}
    });
  }

  updatePreferences(userId: string, dto: UpdateBriefingPreferenceDto) {
    return this.prisma.briefingPreference.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: dto
    });
  }

  async today(userId: string) {
    const latest = await this.prisma.briefing.findFirst({
      where: { userId, generatedAt: { gte: startOfLagosDay() } },
      orderBy: { generatedAt: "desc" }
    });
    return latest ?? this.generate(userId, { type: BriefingType.MORNING });
  }

  async generate(userId: string, dto: GenerateBriefingDto) {
    const settings = await this.privacy.getSettings(userId);
    if (!settings.briefingsEnabled) throw new ForbiddenException("Daily briefings are disabled in Control.");
    const preferences = await this.getPreferences(userId);
    const type = dto.type ?? BriefingType.MORNING;
    const [reminders, actions, promises, debts, goals, memories, suggestions, travel] = await Promise.all([
      this.prisma.reminder.findMany({ where: { userId, status: { in: ["ACTIVE", "SNOOZED", "COMPLETED"] } }, include: { timeTrigger: true, habit: true } }),
      preferences.includeActions ? this.prisma.actionPrompt.findMany({ where: { userId, status: "PENDING_CONFIRMATION" } }) : [],
      this.prisma.promise.findMany({ where: { userId, status: { in: ["PENDING", "OVERDUE"] } } }),
      this.prisma.debt.findMany({ where: { userId, status: "PENDING" } }),
      this.prisma.accountabilityGoal.findMany({ where: { userId, status: "ACTIVE" } }),
      preferences.includeMemory ? this.prisma.memory.findMany({ where: { userId, status: "ACTIVE" }, take: 3, orderBy: { updatedAt: "desc" } }) : [],
      this.prisma.followUpSuggestion.findMany({ where: { userId, status: "PENDING" }, take: 3, orderBy: { createdAt: "desc" } }),
      this.prisma.travelPlan.findMany({ where: { userId, status: { in: ["PLANNED", "ACTIVE"] } }, take: 2, orderBy: { departureDate: "asc" } })
    ]);
    const active = reminders.filter((item) => item.status !== "COMPLETED");
    const completed = reminders.filter((item) => item.status === "COMPLETED");
    const items = {
      reminders: type === BriefingType.EVENING ? completed : active,
      actions,
      promises,
      debts,
      accountabilityGoals: goals,
      memoryHighlights: memories,
      suggestions,
      travel,
      weather: preferences.includeWeather ? { status: "provider_not_configured" } : { status: "disabled" }
    };
    const summary = type === BriefingType.EVENING
      ? `You completed ${completed.length} items. ${active.length} still need attention.`
      : `You have ${active.length} active triggers, ${actions.length} pending actions, and ${promises.length} promises to review.`;
    return this.prisma.briefing.create({
      data: {
        userId,
        type,
        title: type === BriefingType.EVENING ? "Evening review" : type === BriefingType.TRAVEL ? "Travel briefing" : "Today's briefing",
        summary,
        items: toPrismaJson(items)
      }
    });
  }
}

function startOfLagosDay() {
  const now = new Date();
  const lagos = new Date(now.getTime() + 60 * 60 * 1000);
  lagos.setUTCHours(0, 0, 0, 0);
  return new Date(lagos.getTime() - 60 * 60 * 1000);
}
