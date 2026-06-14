import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { UpdateVoiceSettingsDto } from "./dto/update-voice-settings.dto";
import { UpdateVoicePersonalityDto } from "./dto/voice-personality.dto";

@Injectable()
export class VoiceSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  get(userId: string) {
    return this.prisma.userVoiceSetting.upsert({
      where: { userId },
      create: { userId },
      update: {}
    });
  }

  update(userId: string, dto: UpdateVoiceSettingsDto) {
    return this.prisma.userVoiceSetting.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: dto
    });
  }

  getPersonality(userId: string) {
    return this.prisma.voicePersonality.upsert({
      where: { userId },
      create: { userId },
      update: {}
    });
  }

  updatePersonality(userId: string, dto: UpdateVoicePersonalityDto) {
    return this.prisma.voicePersonality.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: dto
    });
  }
}
