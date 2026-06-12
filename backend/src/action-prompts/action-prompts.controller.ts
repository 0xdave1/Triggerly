import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { AuthUser, CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { ActionPromptsService } from "./action-prompts.service";
import { CreateActionPromptDto, GenerateActionPromptContentDto, ListActionPromptsDto, UpdateActionPromptDto } from "./dto/create-action-prompt.dto";

@UseGuards(JwtAuthGuard)
@Controller("action-prompts")
export class ActionPromptsController {
  constructor(private readonly prompts: ActionPromptsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() dto: ListActionPromptsDto) {
    return this.prompts.list(user.id, dto);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateActionPromptDto) {
    return this.prompts.create(user.id, dto);
  }

  @Get(":id")
  get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.prompts.get(user.id, id);
  }

  @Patch(":id")
  update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: UpdateActionPromptDto) {
    return this.prompts.update(user.id, id, dto);
  }

  @Post(":id/confirm")
  confirm(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.prompts.confirm(user.id, id);
  }

  @Post(":id/cancel")
  cancel(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.prompts.cancel(user.id, id);
  }

  @Post(":id/complete")
  complete(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.prompts.complete(user.id, id);
  }

  @Post(":id/generate-content")
  generateContent(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: GenerateActionPromptContentDto) {
    return this.prompts.generateContent(user.id, id, dto);
  }
}
