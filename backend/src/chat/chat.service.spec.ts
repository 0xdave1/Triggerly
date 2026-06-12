import { ChatService } from "./chat.service";

describe("ChatService", () => {
  it("creates a conversation, saves messages, and creates an agent run", async () => {
    const prisma = {
      conversation: {
        create: jest.fn().mockResolvedValue({ id: "c1", title: "Remind me tomorrow" })
      },
      chatMessage: {
        create: jest
          .fn()
          .mockResolvedValueOnce({ id: "m1", conversationId: "c1", role: "USER", content: "Remind me tomorrow" })
          .mockResolvedValueOnce({ id: "m2", conversationId: "c1", role: "ASSISTANT", content: "Plan ready" })
      }
    };
    const agent = {
      createRun: jest.fn().mockResolvedValue({
        id: "r1",
        status: "WAITING_FOR_CONFIRMATION",
        plan: { id: "p1", summary: "Plan ready", requiresConfirmation: true, items: [] }
      })
    };
    const service = new ChatService(prisma as any, agent as any);

    const result = await service.sendMessage("u1", { message: "Remind me tomorrow" });

    expect(prisma.conversation.create).toHaveBeenCalledWith({
      data: { userId: "u1", title: "Remind me tomorrow" }
    });
    expect(agent.createRun).toHaveBeenCalledWith("u1", "c1", "Remind me tomorrow");
    expect(result.agentRun.id).toBe("r1");
  });
});
