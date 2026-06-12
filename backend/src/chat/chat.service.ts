import { Injectable, NotFoundException } from "@nestjs/common";
import { AgentOrchestratorService } from "@/agent/agent-orchestrator.service";
import { ChatMessageRole } from "@/common/enums";
import { toPrismaJson } from "@/common/utils/prisma-json";
import { PrismaService } from "@/prisma/prisma.service";
import { SendChatMessageDto } from "./dto/chat-message.dto";

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly agent: AgentOrchestratorService
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

    const agentRun = await this.agent.createRun(userId, conversation.id, dto.message.trim());
    const plan = agentRun.plan;
    const assistantMessage = await this.prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        userId,
        role: ChatMessageRole.ASSISTANT,
        content: plan.summary,
        metadata: toPrismaJson({ agentRunId: agentRun.id, plan })
      }
    });

    return {
      conversation: { id: conversation.id, title: conversation.title },
      userMessage,
      assistantMessage,
      agentRun: { id: agentRun.id, status: agentRun.status, plan }
    };
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
}
