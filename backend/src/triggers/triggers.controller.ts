import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { AuthUser, CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { ConfirmTriggerDto } from "./dto/confirm-trigger.dto";
import { TriggersService } from "./triggers.service";

@UseGuards(JwtAuthGuard)
@Controller("triggers")
export class TriggersController {
  constructor(private readonly triggers: TriggersService) {}

  @Post("confirm")
  confirm(@CurrentUser() user: AuthUser, @Body() dto: ConfirmTriggerDto) {
    return this.triggers.confirm(user.id, dto);
  }
}
