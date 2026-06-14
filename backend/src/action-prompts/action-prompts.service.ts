import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ActionPromptEventType, ActionPromptStatus, ActionType, FollowUpSourceType } from "@/common/enums";
import { toNullablePrismaJson, toPrismaJson } from "@/common/utils/prisma-json";
import { PrismaService } from "@/prisma/prisma.service";
import { PrivacyService } from "@/privacy/privacy.service";
import { CreateActionPromptDto, GenerateActionPromptContentDto, ListActionPromptsDto, UpdateActionPromptDto } from "./dto/create-action-prompt.dto";

@Injectable()
export class ActionPromptsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly privacy: PrivacyService
  ) {}

  list(userId: string, dto: ListActionPromptsDto = {}) {
    return this.prisma.actionPrompt.findMany({
      where: {
        userId,
        status: dto.status,
        actionType: dto.actionType
      },
      orderBy: { updatedAt: "desc" }
    });
  }

  get(userId: string, id: string) {
    return this.findOwned(userId, id);
  }

  async create(userId: string, dto: CreateActionPromptDto) {
    await this.privacy.assertCanCreateActionPrompt(userId, dto.actionType);
    if (dto.reminderId) await this.assertReminderOwner(userId, dto.reminderId);
    const payload = this.safePayload(dto.actionType, dto.payload);

    return this.prisma.$transaction(async (tx) => {
      const prompt = await tx.actionPrompt.create({
        data: {
          userId,
          reminderId: dto.reminderId,
          actionType: dto.actionType,
          title: dto.title?.trim() || this.defaultTitle(dto.actionType, payload),
          payload: toNullablePrismaJson(payload),
          status: ActionPromptStatus.PENDING_CONFIRMATION,
          sensitive: this.isSensitive(dto.actionType)
        }
      });
      await tx.actionPromptEvent.create({
        data: {
          userId,
          actionPromptId: prompt.id,
          eventType: ActionPromptEventType.CREATED,
          metadata: toPrismaJson({ actionType: dto.actionType, autoExecuted: false })
        }
      });
      return prompt;
    });
  }

  async update(userId: string, id: string, dto: UpdateActionPromptDto) {
    const existing = await this.findOwned(userId, id);
    if (dto.actionType) await this.privacy.assertCanCreateActionPrompt(userId, dto.actionType);
    return this.prisma.$transaction(async (tx) => {
      const actionType = (dto.actionType ?? existing.actionType) as ActionType;
      const prompt = await tx.actionPrompt.update({
        where: { id },
        data: {
          title: dto.title?.trim(),
          actionType: dto.actionType,
          payload: dto.payload === undefined ? undefined : toNullablePrismaJson(this.safePayload(actionType, dto.payload)),
          generatedContent: dto.generatedContent,
          sensitive: dto.actionType ? this.isSensitive(dto.actionType) : undefined
        }
      });
      await tx.actionPromptEvent.create({
        data: {
          userId,
          actionPromptId: id,
          eventType: ActionPromptEventType.UPDATED,
          metadata: toPrismaJson({ fields: Object.keys(dto), autoExecuted: false })
        }
      });
      return prompt;
    });
  }

  async confirm(userId: string, id: string) {
    const prompt = await this.findOwned(userId, id);
    return this.transition(userId, prompt.id, ActionPromptStatus.CONFIRMED, ActionPromptEventType.CONFIRMED, { confirmedAt: new Date() });
  }

  async cancel(userId: string, id: string) {
    const prompt = await this.findOwned(userId, id);
    return this.transition(userId, prompt.id, ActionPromptStatus.CANCELLED, ActionPromptEventType.CANCELLED);
  }

  async complete(userId: string, id: string) {
    const prompt = await this.findOwned(userId, id);
    const completed = await this.transition(userId, prompt.id, ActionPromptStatus.COMPLETED, ActionPromptEventType.COMPLETED, { completedAt: new Date() });
    const settings = await this.privacy.getSettings(userId);
    if (settings.followUpSuggestionsEnabled) {
      await this.prisma.followUpSuggestion.create({
        data: {
          userId,
          sourceType: FollowUpSourceType.ACTION,
          sourceId: prompt.id,
          title: `Follow up after ${prompt.title}`,
          description: "Would you like a reminder to follow up in two days?",
          suggestedActionType: "create_time_reminder",
          payload: toPrismaJson({ triggerType: "time", taskTitle: `Follow up: ${prompt.title}`, time: "in 2 days" })
        }
      });
    }
    return completed;
  }

  async generateContent(userId: string, id: string, dto: GenerateActionPromptContentDto = {}) {
    const prompt = await this.findOwned(userId, id);
    const generatedContent = this.generateSafeContent(prompt.actionType as ActionType, prompt.payload as Record<string, unknown> | null, dto.userInstruction);
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.actionPrompt.update({
        where: { id },
        data: { generatedContent }
      });
      await tx.actionPromptEvent.create({
        data: {
          userId,
          actionPromptId: id,
          eventType: ActionPromptEventType.CONTENT_GENERATED,
          metadata: toPrismaJson({ autoExecuted: false, externalSend: false })
        }
      });
      return updated;
    });
  }

  async findOwned(userId: string, id: string) {
    const prompt = await this.prisma.actionPrompt.findFirst({ where: { id, userId } });
    if (!prompt) throw new NotFoundException("Action prompt not found.");
    return prompt;
  }

  private async transition(userId: string, id: string, status: ActionPromptStatus, eventType: ActionPromptEventType, extra: Record<string, unknown> = {}) {
    return this.prisma.$transaction(async (tx) => {
      const prompt = await tx.actionPrompt.update({
        where: { id },
        data: {
          status,
          confirmedAt: extra.confirmedAt as Date | undefined,
          completedAt: extra.completedAt as Date | undefined
        }
      });
      await tx.actionPromptEvent.create({
        data: {
          userId,
          actionPromptId: id,
          eventType,
          metadata: toPrismaJson({ autoExecuted: false, externalSend: false, paymentMoved: false })
        }
      });
      return prompt;
    });
  }

  private async assertReminderOwner(userId: string, reminderId: string) {
    const reminder = await this.prisma.reminder.findFirst({ where: { id: reminderId, userId } });
    if (!reminder) throw new ForbiddenException("Reminder does not belong to this user.");
  }

  private safePayload(actionType: ActionType, payload?: Record<string, unknown>) {
    return {
      ...(payload ?? {}),
      safety: this.isSensitive(actionType) ? "confirmation_required_no_auto_execute" : "confirmation_required",
      executedAutomatically: false,
      requiresUserConfirmation: true
    };
  }

  private isSensitive(actionType: ActionType) {
    return [
      ActionType.DRAFT_EMAIL,
      ActionType.DRAFT_MESSAGE,
      ActionType.OPEN_PAYMENT_APP,
      ActionType.PAYMENT_REMINDER,
      ActionType.CALL_CONTACT,
      ActionType.CREATE_CALENDAR_EVENT
    ].includes(actionType);
  }

  private defaultTitle(actionType: ActionType, payload: Record<string, unknown>) {
    const recipient = String(payload.recipientName ?? payload.recipientCandidate ?? payload.name ?? "recipient");
    if (actionType === ActionType.DRAFT_EMAIL) return `Draft email to ${recipient}`;
    if (actionType === ActionType.DRAFT_MESSAGE) return `Draft message to ${recipient}`;
    if (actionType === ActionType.PAYMENT_REMINDER) return `Payment reminder for ${recipient}`;
    if (actionType === ActionType.OPEN_PAYMENT_APP) return "Open payment app prompt";
    if (actionType === ActionType.GENERATE_CHECKLIST) return "Generated checklist";
    if (actionType === ActionType.PREPARE_MEETING_NOTES) return "Prepare meeting notes";
    return "Prepared action";
  }

  private generateSafeContent(actionType: ActionType, payload: Record<string, unknown> | null, instruction?: string) {
    const data = payload ?? {};
    const recipient = String(data.recipientName ?? data.recipientCandidate ?? data.name ?? "there");
    const topic = String(data.topic ?? data.draft ?? instruction ?? "your request");
    const amount = data.amount ? `NGN ${Number(data.amount).toLocaleString("en-NG")}` : "the requested amount";
    const item = String(data.item ?? data.placeName ?? data.place ?? "your errand");

    if (actionType === ActionType.DRAFT_EMAIL) {
      return [`Subject: ${topic}`, "", `Hello ${recipient},`, "", `I wanted to follow up about ${topic}.`, "", "Regards,"].join("\n");
    }
    if (actionType === ActionType.DRAFT_MESSAGE) return `Hi ${recipient}, following up about ${topic}.`;
    if (actionType === ActionType.PAYMENT_REMINDER) return `Reminder prepared: send ${amount} to ${recipient}. Triggerly will not move money automatically.`;
    if (actionType === ActionType.OPEN_PAYMENT_APP) return `Payment app prompt prepared. Confirm before opening your payment app.`;
    if (actionType === ActionType.GENERATE_CHECKLIST) return [`Checklist for ${item}:`, "- Review what you need", "- Confirm items manually", "- Mark each item done"].join("\n");
    if (actionType === ActionType.PREPARE_MEETING_NOTES) return [`Meeting notes draft: ${topic}`, "- Agenda", "- Decisions", "- Follow-ups"].join("\n");
    if (actionType === ActionType.CREATE_CALENDAR_EVENT) return `Calendar event draft prepared for ${topic}. Confirm before creating anything.`;
    if (actionType === ActionType.CALL_CONTACT) return `Call prompt prepared for ${recipient}. Confirm before opening the phone app.`;
    if (actionType === ActionType.OPEN_MAPS) return `Maps prompt prepared for ${String(data.destination ?? data.placeName ?? "your destination")}.`;
    return `Action prompt prepared for ${topic}.`;
  }
}
