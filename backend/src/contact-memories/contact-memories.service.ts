import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { ContactMemoryDto } from "./dto/contact-memory.dto";

@Injectable()
export class ContactMemoriesService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.contactMemory.findMany({ where: { userId }, orderBy: { name: "asc" } });
  }

  async get(userId: string, id: string) {
    const contact = await this.prisma.contactMemory.findFirst({ where: { id, userId } });
    if (!contact) throw new NotFoundException("Contact memory not found.");
    return contact;
  }

  create(userId: string, dto: ContactMemoryDto) {
    return this.prisma.contactMemory.create({ data: { userId, ...dto } });
  }

  async update(userId: string, id: string, dto: ContactMemoryDto) {
    await this.get(userId, id);
    return this.prisma.contactMemory.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    await this.get(userId, id);
    await this.prisma.contactMemory.delete({ where: { id } });
    return { deleted: true };
  }
}
