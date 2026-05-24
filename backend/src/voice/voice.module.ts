import { Module } from "@nestjs/common";
import { VoiceController } from "./voice.controller";
import { VoiceSettingsController } from "./voice-settings.controller";
import { VoiceScriptService } from "./voice-script.service";
import { VoiceSettingsService } from "./voice-settings.service";

@Module({
  controllers: [VoiceSettingsController, VoiceController],
  providers: [VoiceSettingsService, VoiceScriptService],
  exports: [VoiceSettingsService, VoiceScriptService]
})
export class VoiceModule {}
