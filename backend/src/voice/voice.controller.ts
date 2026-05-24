import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { AuthUser, CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { GenerateScriptDto } from "./dto/generate-script.dto";
import { VoiceScriptService } from "./voice-script.service";

@UseGuards(JwtAuthGuard)
@Controller("voice")
export class VoiceController {
  constructor(private readonly scripts: VoiceScriptService) {}

  @Post("generate-script")
  generate(@CurrentUser() user: AuthUser, @Body() dto: GenerateScriptDto) {
    return this.scripts.generateForReminder(user.id, dto.reminderId, dto.context);
  }
}
