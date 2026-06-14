import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { AccountabilityGoalStatus } from "@/common/enums";
import { PrismaService } from "@/prisma/prisma.service";
import { PrivacyService } from "@/privacy/privacy.service";
import { AccountabilityCheckInDto, CreateAccountabilityGoalDto, UpdateAccountabilityGoalDto } from "./dto/accountability.dto";

@Injectable()
export class AccountabilityService {
  constructor(private readonly prisma: PrismaService, private readonly privacy: PrivacyService) {}

  list(userId: string) {
    return this.prisma.accountabilityGoal.findMany({ where: { userId }, include: { checkIns: { orderBy: { checkedAt: "desc" }, take: 7 } }, orderBy: { updatedAt: "desc" } });
  }

  async create(userId: string, dto: CreateAccountabilityGoalDto) {
    const settings = await this.privacy.getSettings(userId);
    if (!settings.accountabilityModeEnabled) throw new ForbiddenException("Accountability mode is disabled in Control.");
    return this.prisma.accountabilityGoal.create({ data: { userId, ...dto, frequencyCount: dto.frequencyCount ?? 1 } });
  }

  async update(userId: string, id: string, dto: UpdateAccountabilityGoalDto) {
    await this.get(userId, id);
    return this.prisma.accountabilityGoal.update({ where: { id }, data: dto });
  }

  async checkIn(userId: string, id: string, dto: AccountabilityCheckInDto) {
    await this.get(userId, id);
    return this.prisma.accountabilityCheckIn.create({ data: { userId, goalId: id, status: dto.status, note: dto.note } });
  }

  async pause(userId: string, id: string) {
    await this.get(userId, id);
    return this.prisma.accountabilityGoal.update({ where: { id }, data: { status: AccountabilityGoalStatus.PAUSED } });
  }

  private async get(userId: string, id: string) {
    const goal = await this.prisma.accountabilityGoal.findFirst({ where: { id, userId } });
    if (!goal) throw new NotFoundException("Accountability goal not found.");
    return goal;
  }
}
