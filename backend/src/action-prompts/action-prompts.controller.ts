import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import { AuthUser, CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { ActionPromptsService } from "./action-prompts.service";
import { CreateActionPromptDto } from "./dto/create-action-prompt.dto";

@UseGuards(JwtAuthGuard)
@Controller("action-prompts")
export class ActionPromptsController {
  constructor(private readonly prompts: ActionPromptsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateActionPromptDto) {
    return this.prompts.create(user.id, dto);
  }

  @Post(":id/confirm")
  confirm(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.prompts.confirm(user.id, id);
  }

  @Post(":id/cancel")
  cancel(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.prompts.cancel(user.id, id);
  }
}
