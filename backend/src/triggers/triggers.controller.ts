import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { AuthUser, CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { ConfirmTriggerDto } from "./dto/confirm-trigger.dto";
import { SmartSnoozeDto } from "./dto/smart-snooze.dto";
import { TriggersService } from "./triggers.service";

@UseGuards(JwtAuthGuard)
@Controller("triggers")
export class TriggersController {
  constructor(private readonly triggers: TriggersService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.triggers.list(user.id);
  }

  @Post("confirm")
  confirm(@CurrentUser() user: AuthUser, @Body() dto: ConfirmTriggerDto) {
    return this.triggers.confirm(user.id, dto);
  }

  @Post(":id/snooze-smart")
  smartSnooze(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: SmartSnoozeDto) {
    return this.triggers.smartSnooze(user.id, id, dto);
  }
}
