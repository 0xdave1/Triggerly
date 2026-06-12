import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { AuthUser, CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { AgentOrchestratorService } from "./agent-orchestrator.service";
import { ConfirmAgentRunDto, EditAgentPlanItemDto } from "./dto/agent-run.dto";

@UseGuards(JwtAuthGuard)
@Controller("agent-runs")
export class AgentController {
  constructor(private readonly agent: AgentOrchestratorService) {}

  @Get(":id")
  get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.agent.getRun(user.id, id);
  }

  @Post(":id/confirm")
  confirm(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: ConfirmAgentRunDto) {
    return this.agent.confirmRun(user.id, id, dto.itemIds);
  }

  @Post(":id/reject")
  reject(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.agent.rejectRun(user.id, id);
  }

  @Post(":id/items/:itemId/confirm")
  confirmItem(@CurrentUser() user: AuthUser, @Param("id") id: string, @Param("itemId") itemId: string) {
    return this.agent.confirmRun(user.id, id, [itemId]);
  }

  @Post(":id/items/:itemId/reject")
  rejectItem(@CurrentUser() user: AuthUser, @Param("id") id: string, @Param("itemId") itemId: string) {
    return this.agent.rejectItem(user.id, id, itemId);
  }

  @Post(":id/items/:itemId/edit")
  editItem(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Param("itemId") itemId: string,
    @Body() dto: EditAgentPlanItemDto
  ) {
    return this.agent.editItem(user.id, id, itemId, dto.payload);
  }
}
