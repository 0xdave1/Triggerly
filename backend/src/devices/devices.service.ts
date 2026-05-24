import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { DeviceDto } from "./dto/device.dto";

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  register(userId: string, dto: DeviceDto) {
    return this.prisma.device.upsert({
      where: { userId_pushToken: { userId, pushToken: dto.pushToken } },
      create: { userId, platform: dto.platform, pushToken: dto.pushToken, lastSeenAt: new Date() },
      update: { platform: dto.platform, lastSeenAt: new Date() }
    });
  }

  async update(userId: string, id: string, dto: DeviceDto) {
    const device = await this.prisma.device.findFirst({ where: { id, userId } });
    if (!device) throw new NotFoundException("Device not found.");
    return this.prisma.device.update({
      where: { id },
      data: { platform: dto.platform, pushToken: dto.pushToken, lastSeenAt: new Date() }
    });
  }
}
