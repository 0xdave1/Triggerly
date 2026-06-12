import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthUser, CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { GenerateScriptDto } from "./dto/generate-script.dto";
import { UpdateVoiceSettingsDto } from "./dto/update-voice-settings.dto";
import { VoiceScriptService } from "./voice-script.service";
import { VoiceSettingsService } from "./voice-settings.service";

@UseGuards(JwtAuthGuard)
@Controller("voice")
export class VoiceController {
  constructor(
    private readonly scripts: VoiceScriptService,
    private readonly settings: VoiceSettingsService
  ) {}

  @Get("settings")
  getSettings(@CurrentUser() user: AuthUser) {
    return this.settings.get(user.id);
  }

  @Patch("settings")
  updateSettings(@CurrentUser() user: AuthUser, @Body() dto: UpdateVoiceSettingsDto) {
    return this.settings.update(user.id, dto);
  }

  @Post("generate-script")
  generate(@CurrentUser() user: AuthUser, @Body() dto: GenerateScriptDto) {
    return this.scripts.generateVoiceScript(user.id, dto);
  }

  @Post("preview-script")
  preview(@CurrentUser() user: AuthUser, @Body() dto: GenerateScriptDto) {
    return this.scripts.generatePreviewScript(user.id, dto);
  }
}
