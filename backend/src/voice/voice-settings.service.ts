import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { UpdateVoiceSettingsDto } from "./dto/update-voice-settings.dto";

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
}
