import { Injectable, NotFoundException } from "@nestjs/common";
import { AgentOrchestratorService } from "@/agent/agent-orchestrator.service";
import { AiService } from "@/ai/ai.service";
import type { AgentPlan } from "@/ai/types/agent-plan.types";
import { ChatMessageRole } from "@/common/enums";
import { toPrismaJson } from "@/common/utils/prisma-json";
import { PrismaService } from "@/prisma/prisma.service";
import { PrivacyService } from "@/privacy/privacy.service";
import { SendChatMessageDto } from "./dto/chat-message.dto";
import {
  ChatResponseMode,
  IntentClassifierService
} from "./intent-classifier.service";

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly agent: AgentOrchestratorService,
    private readonly ai: AiService,
    private readonly privacy: PrivacyService,
    private readonly classifier: IntentClassifierService
  ) {}

  async sendMessage(userId: string, dto: SendChatMessageDto) {
    const conversation = dto.conversationId
      ? await this.findOwnedConversation(userId, dto.conversationId)
      : await this.prisma.conversation.create({
          data: { userId, title: this.titleFrom(dto.message) }
        });

    const userMessage = await this.prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        userId,
        role: ChatMessageRole.USER,
        content: dto.message.trim()
      }
    });

    const input = dto.message.trim();
    const classification = this.classifier.classify(input);

    if (classification.mode === "blocked") {
      return this.respond(
        "blocked",
        classification.message ?? "I cannot help with that request, but I can offer a safer alternative.",
        conversation,
        userMessage,
        userId
      );
    }

    if (classification.mode === "clarification") {
      return this.respond(
        "clarification",
        classification.message ?? "What would you like me to set up?",
        conversation,
        userMessage,
        userId
      );
    }

    const settings = await this.privacy.getSettings(userId);
    if (!settings.aiParsingEnabled) {
      return this.respond(
        "blocked",
        "AI chat is disabled in Control. Enable AI parsing before asking Triggerly to answer or plan this request.",
        conversation,
        userMessage,
        userId
      );
    }

    if (classification.mode === "answer") {
      const answer = await this.ai.generateNormalAnswer(userId, input, {
        timezone: "Africa/Lagos",
        locale: "en-NG"
      });
      return this.respond("answer", answer, conversation, userMessage, userId);
    }

    const plan = await this.agent.preparePlan(userId, input);
    const actionable = plan.items.filter((item) =>
      !["ask_clarification", "answer_only"].includes(item.type)
    );
    if (!actionable.length) {
      const question =
        plan.items.find((item) => item.type === "ask_clarification")?.description ??
        "I need one more detail before setting this up.";
      return this.respond("clarification", question, conversation, userMessage, userId);
    }

    if (actionable.every((item) => typeof item.payload.blockedBy === "string")) {
      return this.respond(
        "blocked",
        actionable[0]?.description ?? "This feature is disabled in Control.",
        conversation,
        userMessage,
        userId
      );
    }

    const agentRun = await this.agent.createRun(userId, conversation.id, input, plan);
    return this.respond(
      "plan",
      plan.summary,
      conversation,
      userMessage,
      userId,
      { id: agentRun.id, status: agentRun.status, plan }
    );
  }

  listConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: { userId },
      include: {
        messages: { orderBy: { createdAt: "desc" }, take: 1 }
      },
      orderBy: { updatedAt: "desc" }
    });
  }

  async getConversation(userId: string, id: string) {
    await this.findOwnedConversation(userId, id);
    return this.prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        agentRuns: { orderBy: { createdAt: "asc" } }
      }
    });
  }

  async deleteConversation(userId: string, id: string) {
    await this.findOwnedConversation(userId, id);
    await this.prisma.conversation.delete({ where: { id } });
    return { deleted: true };
  }

  private async findOwnedConversation(userId: string, id: string) {
    const conversation = await this.prisma.conversation.findFirst({ where: { id, userId } });
    if (!conversation) throw new NotFoundException("Conversation not found.");
    return conversation;
  }

  private titleFrom(message: string) {
    const compact = message.trim().replace(/\s+/g, " ");
    return compact.length > 58 ? `${compact.slice(0, 55)}...` : compact;
  }

  private async respond(
    mode: ChatResponseMode,
    message: string,
    conversation: { id: string; title: string },
    userMessage: unknown,
    userId: string,
    agentRun?: { id: string; status: unknown; plan: AgentPlan }
  ) {
    const metadata = agentRun
      ? { mode, agentRunId: agentRun.id, plan: agentRun.plan }
      : { mode };
    const assistantMessage = await this.prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        userId,
        role: ChatMessageRole.ASSISTANT,
        content: message,
        metadata: toPrismaJson(metadata)
      }
    });

    return {
      mode,
      message,
      conversationId: conversation.id,
      agentRunId: agentRun?.id ?? null,
      plan: agentRun?.plan ?? null,
      conversation: { id: conversation.id, title: conversation.title },
      userMessage,
      assistantMessage,
      agentRun: agentRun ?? null
    };
  }
}
