import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { AuthUser, CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { AgentOrchestratorService } from "./agent-orchestrator.service";
import { TurnThisIntoDto } from "./dto/turn-this-into.dto";

@UseGuards(JwtAuthGuard)
@Controller("agent")
export class AgentUtilityController {
  constructor(private readonly agent: AgentOrchestratorService) {}

  @Post("turn-this-into")
  turnThisInto(@CurrentUser() user: AuthUser, @Body() dto: TurnThisIntoDto) {
    return this.agent.turnThisInto(user.id, dto.sourceMessageId, dto.targetType);
  }
}
