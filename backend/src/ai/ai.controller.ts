import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { AuthUser, CurrentUser } from "@/common/decorators/current-user.decorator";
import { AiService } from "./ai.service";
import { ParseTriggerDto } from "./dto/parse-trigger.dto";
import { ParseReminderDto } from "./dto/parse-reminder.dto";

@UseGuards(JwtAuthGuard)
@Controller("ai")
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post("parse-reminder")
  parse(@Body() dto: ParseReminderDto) {
    return this.ai.parseReminderInput(dto.input);
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post("parse-trigger")
  parseTrigger(@CurrentUser() user: AuthUser, @Body() dto: ParseTriggerDto) {
    return this.ai.parseTrigger(user.id, dto.input);
  }
}
