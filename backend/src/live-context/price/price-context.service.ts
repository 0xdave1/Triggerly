import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class PriceContextService {
  constructor(private readonly prisma: PrismaService) {}

  listLogs(userId: string, itemName?: string) {
    return this.prisma.priceLog.findMany({
      where: {
        userId,
        itemName: itemName ? { equals: itemName, mode: "insensitive" } : undefined
      },
      orderBy: { loggedAt: "desc" }
    });
  }

  history(userId: string, itemName: string) {
    return this.prisma.priceLog.findMany({
      where: { userId, itemName: { equals: itemName, mode: "insensitive" } },
      orderBy: { loggedAt: "asc" }
    });
  }
}
