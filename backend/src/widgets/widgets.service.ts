import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { PrivacyService } from "@/privacy/privacy.service";
import { UpdateWidgetPreferenceDto } from "./dto/widget.dto";

@Injectable()
export class WidgetsService {
  constructor(private readonly prisma: PrismaService, private readonly privacy: PrivacyService) {}

  preferences(userId: string) {
    return this.prisma.widgetPreference.upsert({ where: { userId }, create: { userId }, update: {} });
  }

  update(userId: string, dto: UpdateWidgetPreferenceDto) {
    return this.prisma.widgetPreference.upsert({ where: { userId }, create: { userId, ...dto }, update: dto });
  }

  async summary(userId: string) {
    const settings = await this.privacy.getSettings(userId);
    if (!settings.widgetSummaryEnabled) throw new ForbiddenException("Widget summaries are disabled in Control.");
    const preferences = await this.preferences(userId);
    const [nextTrigger, briefing, pendingActions, habitCount, travel] = await Promise.all([
      preferences.nextTriggerEnabled ? this.prisma.reminder.findFirst({ where: { userId, status: "ACTIVE" }, include: { timeTrigger: true }, orderBy: { createdAt: "asc" } }) : null,
      preferences.briefingEnabled ? this.prisma.briefing.findFirst({ where: { userId }, orderBy: { generatedAt: "desc" } }) : null,
      preferences.pendingActionsEnabled ? this.prisma.actionPrompt.count({ where: { userId, status: "PENDING_CONFIRMATION" } }) : 0,
      preferences.habitsEnabled ? this.prisma.accountabilityGoal.count({ where: { userId, status: "ACTIVE" } }) : 0,
      this.prisma.travelPlan.findFirst({ where: { userId, status: { in: ["PLANNED", "ACTIVE"] } }, orderBy: { departureDate: "asc" } })
    ]);
    return {
      generatedAt: new Date().toISOString(),
      nextTrigger,
      briefing,
      pendingActions,
      accountabilityGoals: habitCount,
      travel,
      weather: preferences.weatherEnabled ? { status: "provider_not_configured" } : null,
      nativeWidgetAvailable: false
    };
  }
}
