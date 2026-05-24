import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { AuthUser, CurrentUser } from "@/common/decorators/current-user.decorator";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { UpdateVoiceSettingsDto } from "./dto/update-voice-settings.dto";
import { VoiceSettingsService } from "./voice-settings.service";

@UseGuards(JwtAuthGuard)
@Controller("voice-settings")
export class VoiceSettingsController {
  constructor(private readonly voiceSettings: VoiceSettingsService) {}

  @Get()
  get(@CurrentUser() user: AuthUser) {
    return this.voiceSettings.get(user.id);
  }

  @Patch()
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateVoiceSettingsDto) {
    return this.voiceSettings.update(user.id, dto);
  }
}
