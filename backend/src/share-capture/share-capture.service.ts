import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ChatMessageRole, ShareCaptureStatus } from "@/common/enums";
import { toPrismaJson } from "@/common/utils/prisma-json";
import { AiService } from "@/ai/ai.service";
import { validateAgentPlan } from "@/ai/schemas/agent-plan.schema";
import { AgentOrchestratorService } from "@/agent/agent-orchestrator.service";
import { PrismaService } from "@/prisma/prisma.service";
import { PrivacyService } from "@/privacy/privacy.service";
import { CreateShareCaptureDto } from "./dto/share-capture.dto";

@Injectable()
export class ShareCaptureService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly privacy: PrivacyService,
    private readonly ai: AiService,
    private readonly agent: AgentOrchestratorService
  ) {}

  list(userId: string) {
    return this.prisma.shareCapture.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  }

  async create(userId: string, dto: CreateShareCaptureDto) {
    const settings = await this.privacy.getSettings(userId);
    if (!settings.shareCaptureEnabled) throw new ForbiddenException("Share capture is disabled in Control.");
    if (!dto.rawText && !dto.fileUrl) throw new BadRequestException("Paste text or provide a file URL.");
    return this.prisma.shareCapture.create({ data: { userId, ...dto } });
  }

  async parse(userId: string, id: string) {
    const capture = await this.get(userId, id);
    if (!capture.rawText) throw new BadRequestException("Text parsing is the only supported share-capture mode in this MVP.");
    const plan = await this.ai.generateAgentPlan(userId, capture.rawText, { source: "share_capture" });
    await this.prisma.shareCapture.update({ where: { id }, data: { status: ShareCaptureStatus.PARSED, parsedPlan: toPrismaJson(plan) } });
    return { captureId: id, plan };
  }

  async confirm(userId: string, id: string) {
    const capture = await this.get(userId, id);
    if (!capture.parsedPlan) throw new BadRequestException("Parse this capture before confirming it.");
    const plan = validateAgentPlan(capture.parsedPlan);
    const conversation = await this.prisma.conversation.create({
      data: { userId, title: capture.rawText?.slice(0, 58) || "Shared with Triggerly" }
    });
    await this.prisma.chatMessage.create({
      data: {
        userId,
        conversationId: conversation.id,
        role: ChatMessageRole.USER,
        content: capture.rawText ?? "Shared content"
      }
    });
    const run = await this.agent.createRun(userId, conversation.id, capture.rawText ?? "Shared content", plan);
    const result = await this.agent.confirmRun(userId, run.id);
    const updated = await this.prisma.shareCapture.update({ where: { id }, data: { status: ShareCaptureStatus.CONFIRMED } });
    return { capture: updated, conversationId: conversation.id, agentRunId: run.id, plan: result.plan, result: result.result };
  }

  private async get(userId: string, id: string) {
    const item = await this.prisma.shareCapture.findFirst({ where: { id, userId } });
    if (!item) throw new NotFoundException("Share capture not found.");
    return item;
  }
}
