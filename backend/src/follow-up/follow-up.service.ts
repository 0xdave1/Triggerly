import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { FollowUpSuggestionStatus } from "@/common/enums";
import { toPrismaJson } from "@/common/utils/prisma-json";
import { PrismaService } from "@/prisma/prisma.service";
import { PrivacyService } from "@/privacy/privacy.service";
import { GenerateFollowUpDto } from "./dto/follow-up.dto";

@Injectable()
export class FollowUpService {
  constructor(private readonly prisma: PrismaService, private readonly privacy: PrivacyService) {}

  list(userId: string) {
    return this.prisma.followUpSuggestion.findMany({ where: { userId, status: FollowUpSuggestionStatus.PENDING }, orderBy: { createdAt: "desc" } });
  }

  async generate(userId: string, dto: GenerateFollowUpDto) {
    const settings = await this.privacy.getSettings(userId);
    if (!settings.followUpSuggestionsEnabled) throw new ForbiddenException("Follow-up suggestions are disabled in Control.");
    return this.prisma.followUpSuggestion.create({
      data: { userId, ...dto, payload: toPrismaJson(dto.payload) }
    });
  }

  async accept(userId: string, id: string) {
    const suggestion = await this.get(userId, id);
    await this.prisma.followUpSuggestion.update({ where: { id }, data: { status: FollowUpSuggestionStatus.ACCEPTED } });
    return {
      suggestionId: id,
      plan: {
        summary: "Review this follow-up before I create it.",
        requiresConfirmation: true,
        items: [{
          id: `follow_up_${id}`,
          type: "create_trigger",
          title: suggestion.title,
          description: suggestion.description,
          riskLevel: "low",
          status: "proposed",
          requiresConfirmation: true,
          sensitive: false,
          payload: suggestion.payload
        }]
      }
    };
  }

  async dismiss(userId: string, id: string) {
    await this.get(userId, id);
    return this.prisma.followUpSuggestion.update({ where: { id }, data: { status: FollowUpSuggestionStatus.DISMISSED } });
  }

  private async get(userId: string, id: string) {
    const item = await this.prisma.followUpSuggestion.findFirst({ where: { id, userId } });
    if (!item) throw new NotFoundException("Follow-up suggestion not found.");
    return item;
  }
}
