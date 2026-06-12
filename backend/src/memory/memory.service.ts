import { Injectable, NotFoundException } from "@nestjs/common";
import { MemoryEventType, MemorySource, MemoryStatus, MemoryType } from "@/common/enums";
import { toNullablePrismaJson, toPrismaJson } from "@/common/utils/prisma-json";
import { PrismaService } from "@/prisma/prisma.service";
import { PrivacyService } from "@/privacy/privacy.service";
import { ConfirmMemoryFromIntentDto, CreateMemoryItemDto, ListMemoryDto, UpdateMemoryItemDto } from "./dto/memory-item.dto";
import { MemorySearchProvider } from "./memory-search.provider";

@Injectable()
export class MemoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly privacy: PrivacyService,
    private readonly search: MemorySearchProvider
  ) {}

  list(userId: string, dto: ListMemoryDto = {}) {
    if (dto.search?.trim()) return this.search.keywordSearch(userId, dto.search.trim(), { type: dto.type, status: dto.status });
    return this.prisma.memory.findMany({
      where: {
        userId,
        type: dto.type,
        status: dto.status ?? MemoryStatus.ACTIVE
      },
      orderBy: { updatedAt: "desc" }
    });
  }

  async get(userId: string, id: string) {
    const item = await this.prisma.memory.findFirst({ where: { id, userId, status: { not: MemoryStatus.DELETED } } });
    if (!item) throw new NotFoundException("Memory item not found.");
    return item;
  }

  async create(userId: string, dto: CreateMemoryItemDto) {
    await this.privacy.assertCanCreateMemory(userId, dto.type);
    return this.prisma.$transaction(async (tx) => {
      const memory = await tx.memory.create({
        data: {
          userId,
          type: dto.type,
          title: dto.title.trim(),
          body: dto.body.trim(),
          entities: toNullablePrismaJson(dto.entities),
          source: dto.source ?? MemorySource.MANUAL,
          confidence: dto.confidence,
          status: MemoryStatus.ACTIVE
        }
      });
      await tx.memoryEvent.create({
        data: {
          userId,
          memoryId: memory.id,
          eventType: MemoryEventType.CREATED,
          metadata: toPrismaJson({ source: memory.source })
        }
      });
      return memory;
    });
  }

  async update(userId: string, id: string, dto: UpdateMemoryItemDto) {
    const existing = await this.get(userId, id);
    if (dto.type) await this.privacy.assertCanCreateMemory(userId, dto.type);
    return this.prisma.$transaction(async (tx) => {
      const memory = await tx.memory.update({
        where: { id },
        data: {
          type: dto.type,
          title: dto.title?.trim(),
          body: dto.body?.trim(),
          entities: dto.entities === undefined ? undefined : toNullablePrismaJson(dto.entities),
          source: dto.source,
          confidence: dto.confidence,
          status: dto.status,
          archivedAt: dto.status === MemoryStatus.ARCHIVED ? new Date() : existing.archivedAt,
          deletedAt: dto.status === MemoryStatus.DELETED ? new Date() : existing.deletedAt
        }
      });
      await tx.memoryEvent.create({
        data: {
          userId,
          memoryId: id,
          eventType: MemoryEventType.UPDATED,
          metadata: toPrismaJson({ fields: Object.keys(dto) })
        }
      });
      return memory;
    });
  }

  async archive(userId: string, id: string) {
    await this.get(userId, id);
    return this.prisma.$transaction(async (tx) => {
      const memory = await tx.memory.update({
        where: { id },
        data: { status: MemoryStatus.ARCHIVED, archivedAt: new Date() }
      });
      await tx.memoryEvent.create({
        data: { userId, memoryId: id, eventType: MemoryEventType.ARCHIVED }
      });
      return memory;
    });
  }

  async remove(userId: string, id: string) {
    await this.get(userId, id);
    await this.prisma.$transaction([
      this.prisma.memory.update({
        where: { id },
        data: { status: MemoryStatus.DELETED, deletedAt: new Date() }
      }),
      this.prisma.memoryEvent.create({
        data: { userId, memoryId: id, eventType: MemoryEventType.DELETED }
      })
    ]);
    return { deleted: true };
  }

  async confirmFromIntent(userId: string, dto: ConfirmMemoryFromIntentDto) {
    const input = this.memoryInputFromIntent(dto.parsedIntent, dto.overrides);
    return this.create(userId, input);
  }

  private memoryInputFromIntent(parsedIntent: Record<string, unknown>, overrides?: Partial<CreateMemoryItemDto>): CreateMemoryItemDto {
    const candidate = (parsedIntent.memoryCandidate ?? parsedIntent.priceCandidate ?? {}) as Record<string, unknown>;
    const type = this.memoryTypeFrom(String(overrides?.type ?? candidate.type ?? parsedIntent.intentType ?? "GENERAL"));
    const title = overrides?.title ?? this.titleFrom(type, parsedIntent, candidate);
    const body = overrides?.body ?? String(parsedIntent.taskTitle ?? title);
    return {
      type,
      title,
      body,
      entities: overrides?.entities ?? candidate,
      source: overrides?.source ?? MemorySource.AI_EXTRACTED,
      confidence: overrides?.confidence ?? Number(parsedIntent.confidence ?? 0.75)
    };
  }

  private memoryTypeFrom(value: string): MemoryType {
    const normalized = value.toUpperCase().replace("_MEMORY", "");
    if (normalized === "DEBT") return MemoryType.DEBT;
    if (normalized === "PROMISE") return MemoryType.PROMISE;
    if (normalized === "PRICE" || normalized === "PRICE_LOG") return MemoryType.PRICE;
    if (normalized in MemoryType) return MemoryType[normalized as keyof typeof MemoryType];
    return MemoryType.GENERAL;
  }

  private titleFrom(type: MemoryType, parsedIntent: Record<string, unknown>, candidate: Record<string, unknown>) {
    if (type === MemoryType.DEBT && candidate.person && candidate.amount) return `${candidate.person} owes me NGN ${Number(candidate.amount).toLocaleString("en-NG")}`;
    if (type === MemoryType.PROMISE && candidate.person && candidate.commitment) return `${candidate.commitment} to ${candidate.person}${candidate.deadline ? ` by ${candidate.deadline}` : ""}`;
    if (type === MemoryType.PRICE && candidate.item && candidate.place) return `${String(candidate.item).replace(/^./, (letter) => letter.toUpperCase())} price at ${candidate.place}`;
    return String(parsedIntent.taskTitle ?? "User-approved memory");
  }
}
