import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { MemoryEventType, MemorySource, MemoryStatus, MemoryType } from "@/common/enums";
import { MemoryService } from "./memory.service";

describe("MemoryService", () => {
  function prismaMock(): any {
    const mock: any = {
      $transaction: jest.fn((input) => (typeof input === "function" ? input(mock) : Promise.all(input))),
      memory: {
        findMany: jest.fn().mockResolvedValue([{ id: "m1", userId: "u1", status: MemoryStatus.ACTIVE }]),
        findFirst: jest.fn().mockResolvedValue({ id: "m1", userId: "u1", status: MemoryStatus.ACTIVE }),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: "m1", ...data })),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: "m1", ...data }))
      },
      memoryEvent: {
        create: jest.fn().mockResolvedValue({ id: "e1" })
      }
    };
    return mock;
  }

  let prisma: any;

  function service(overrides?: { privacy?: any; search?: any }) {
    prisma = prismaMock();
    return new MemoryService(
      prisma as any,
      overrides?.privacy ?? ({ assertCanCreateMemory: jest.fn().mockResolvedValue(undefined) } as any),
      overrides?.search ?? ({ keywordSearch: jest.fn().mockResolvedValue([]) } as any)
    );
  }

  it("queries active memories by authenticated user only", async () => {
    await service().list("u1");

    expect(prisma.memory.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: "u1", type: undefined, status: MemoryStatus.ACTIVE }
    }));
  });

  it("hides deleted memory from reads", async () => {
    prisma = prismaMock();
    prisma.memory.findFirst.mockResolvedValueOnce(null);
    const memory = new MemoryService(prisma as any, {} as any, {} as any);

    await expect(memory.get("u2", "m1")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("blocks memory creation when privacy setting disables memory", async () => {
    const privacy = { assertCanCreateMemory: jest.fn().mockRejectedValue(new ForbiddenException()) };

    await expect(service({ privacy }).create("u1", { type: MemoryType.GENERAL, title: "Note", body: "Body" })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("creates memory and records a created event", async () => {
    await service().create("u1", {
      type: MemoryType.DEBT,
      title: "David owes me NGN 8,000",
      body: "David owes me 8k",
      entities: { person: "David", amount: 8000 }
    });

    expect(prisma.memory.create.mock.calls[0][0].data.entities).toEqual({ person: "David", amount: 8000 });
    expect(prisma.memoryEvent.create.mock.calls[0][0].data.eventType).toBe(MemoryEventType.CREATED);
  });

  it("archives memory without deleting it", async () => {
    await service().archive("u1", "m1");

    expect(prisma.memory.update.mock.calls[0][0].data.status).toBe(MemoryStatus.ARCHIVED);
    expect(prisma.memoryEvent.create.mock.calls[0][0].data.eventType).toBe(MemoryEventType.ARCHIVED);
  });

  it("soft deletes memory and hides it from default list", async () => {
    await service().remove("u1", "m1");

    expect(prisma.memory.update.mock.calls[0][0].data.status).toBe(MemoryStatus.DELETED);
    expect(prisma.memoryEvent.create.mock.calls[0][0].data.eventType).toBe(MemoryEventType.DELETED);
  });

  it("does not save AI-extracted memory before explicit confirmation endpoint", async () => {
    await service().confirmFromIntent("u1", {
      parsedIntent: {
        intentType: "debt_memory",
        taskTitle: "David owes me 8000",
        confidence: 0.91,
        memoryCandidate: {
          type: "debt",
          person: "David",
          amount: 8000,
          currency: "NGN",
          direction: "receivable"
        }
      }
    });

    expect(prisma.memory.create.mock.calls[0][0].data.source).toBe(MemorySource.AI_EXTRACTED);
  });
});
