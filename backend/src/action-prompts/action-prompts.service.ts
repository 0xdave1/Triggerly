import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ActionPromptStatus, ActionType } from "@/common/enums";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateActionPromptDto } from "./dto/create-action-prompt.dto";

@Injectable()
export class ActionPromptsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateActionPromptDto) {
    if (dto.reminderId) await this.assertReminderOwner(userId, dto.reminderId);
    return this.prisma.actionPrompt.create({
      data: {
        userId,
        reminderId: dto.reminderId,
        actionType: dto.actionType,
        payload: this.safePayload(dto.actionType, dto.payload),
        status: ActionPromptStatus.PENDING_CONFIRMATION
      }
    });
  }

  async confirm(userId: string, id: string) {
    const prompt = await this.findOwned(userId, id);
    return this.prisma.actionPrompt.update({
      where: { id: prompt.id },
      data: { status: ActionPromptStatus.CONFIRMED }
    });
  }

  async cancel(userId: string, id: string) {
    const prompt = await this.findOwned(userId, id);
    return this.prisma.actionPrompt.update({
      where: { id: prompt.id },
      data: { status: ActionPromptStatus.CANCELLED }
    });
  }

  async findOwned(userId: string, id: string) {
    const prompt = await this.prisma.actionPrompt.findFirst({ where: { id, userId } });
    if (!prompt) throw new NotFoundException("Action prompt not found.");
    return prompt;
  }

  private async assertReminderOwner(userId: string, reminderId: string) {
    const reminder = await this.prisma.reminder.findFirst({ where: { id: reminderId, userId } });
    if (!reminder) throw new ForbiddenException("Reminder does not belong to this user.");
  }

  private safePayload(actionType: ActionType, payload?: Record<string, unknown>) {
    return {
      ...(payload ?? {}),
      safety: actionType === ActionType.OPEN_PAYMENT_APP || actionType === ActionType.DRAFT_EMAIL ? "confirmation_required_no_auto_execute" : "confirmation_required"
    };
  }
}
