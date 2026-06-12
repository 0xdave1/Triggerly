import { Injectable } from "@nestjs/common";
import { MemoryStatus, MemoryType } from "@/common/enums";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class MemorySearchProvider {
  constructor(private readonly prisma: PrismaService) {}

  keywordSearch(userId: string, search: string, filters: { type?: MemoryType; status?: MemoryStatus } = {}) {
    return this.prisma.memory.findMany({
      where: {
        userId,
        type: filters.type,
        status: filters.status ?? MemoryStatus.ACTIVE,
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { body: { contains: search, mode: "insensitive" } }
        ]
      },
      orderBy: { updatedAt: "desc" }
    });
  }

  semanticSearch(_userId: string, _query: string) {
    return Promise.resolve({
      status: "semantic_search_unavailable",
      message: "Memory embeddings are not enabled yet. pgvector is intentionally not required for the MVP."
    });
  }
}
