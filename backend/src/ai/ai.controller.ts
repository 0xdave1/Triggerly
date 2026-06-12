import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { AuthUser, CurrentUser } from "@/common/decorators/current-user.decorator";
import { PrivacyService } from "@/privacy/privacy.service";
import { AiService } from "./ai.service";
import { AiIntentService } from "./ai-intent.service";
import { ParseIntentDto } from "./dto/parse-intent.dto";
import { ParseTriggerDto } from "./dto/parse-trigger.dto";
import { ParseReminderDto } from "./dto/parse-reminder.dto";

@UseGuards(JwtAuthGuard)
@Controller("ai")
export class AiController {
  constructor(
    private readonly ai: AiService,
    private readonly intent: AiIntentService,
    private readonly privacy: PrivacyService
  ) {}

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post("parse-reminder")
  async parse(@CurrentUser() user: AuthUser, @Body() dto: ParseReminderDto) {
    await this.privacy.assertCanParseAi(user.id);
    return this.ai.parseReminderInput(dto.input);
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post("parse-trigger")
  async parseTrigger(@CurrentUser() user: AuthUser, @Body() dto: ParseTriggerDto) {
    await this.privacy.assertCanParseAi(user.id);
    return this.ai.parseTrigger(user.id, dto.input);
  }

  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post("parse-intent")
  parseIntent(@CurrentUser() user: AuthUser, @Body() dto: ParseIntentDto) {
    return this.intent.parseIntent(dto.input, user.id);
  }
}
