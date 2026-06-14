import { ChatService } from "./chat.service";
import { IntentClassifierService } from "./intent-classifier.service";

const triggerPlan = {
  id: "p1",
  summary: "Review this reminder before I create it.",
  requiresConfirmation: true,
  items: [
    {
      id: "i1",
      type: "create_trigger",
      title: "Call David",
      description: "Tomorrow",
      riskLevel: "low",
      status: "proposed",
      payload: { triggerType: "time", taskTitle: "Call David", time: "tomorrow" },
      requiresConfirmation: true,
      sensitive: false
    }
  ]
};

function setup() {
  let messageNumber = 0;
  const prisma = {
    conversation: {
      create: jest.fn().mockImplementation(({ data }) => ({ id: "c1", ...data })),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn()
    },
    chatMessage: {
      create: jest.fn().mockImplementation(({ data }) => ({
        id: `m${++messageNumber}`,
        createdAt: new Date("2026-06-14T10:00:00.000Z"),
        ...data
      }))
    }
  };
  const agent = {
    preparePlan: jest.fn().mockResolvedValue(triggerPlan),
    createRun: jest.fn().mockResolvedValue({
      id: "r1",
      status: "WAITING_FOR_CONFIRMATION",
      plan: triggerPlan
    })
  };
  const ai = {
    generateNormalAnswer: jest.fn().mockResolvedValue("Artificial intelligence is software that performs tasks requiring human-like judgment.")
  };
  const privacy = {
    getSettings: jest.fn().mockResolvedValue({ aiParsingEnabled: true })
  };
  const service = new ChatService(
    prisma as any,
    agent as any,
    ai as any,
    privacy as any,
    new IntentClassifierService()
  );
  return { service, prisma, agent, ai, privacy };
}

describe("ChatService", () => {
  it.each(["What is AI?", "Explain compound interest."])(
    "returns a normal answer with no plan for %s",
    async (message) => {
      const { service, prisma, agent, ai } = setup();

      const result = await service.sendMessage("u1", { message });

      expect(result).toMatchObject({
        mode: "answer",
        agentRunId: null,
        plan: null,
        agentRun: null
      });
      expect(ai.generateNormalAnswer).toHaveBeenCalled();
      expect(agent.preparePlan).not.toHaveBeenCalled();
      expect(agent.createRun).not.toHaveBeenCalled();
      expect(prisma.chatMessage.create).toHaveBeenCalledTimes(2);
    }
  );

  it("creates an AgentRun only for a task request", async () => {
    const { service, agent } = setup();

    const result = await service.sendMessage("u1", {
      message: "Remind me to call David tomorrow."
    });

    expect(result).toMatchObject({
      mode: "plan",
      agentRunId: "r1",
      plan: triggerPlan
    });
    expect(agent.preparePlan).toHaveBeenCalledWith(
      "u1",
      "Remind me to call David tomorrow."
    );
    expect(agent.createRun).toHaveBeenCalledWith(
      "u1",
      "c1",
      "Remind me to call David tomorrow.",
      triggerPlan
    );
  });

  it("asks for clarification without creating an AgentRun", async () => {
    const { service, agent } = setup();

    const result = await service.sendMessage("u1", { message: "Remind me later." });

    expect(result.mode).toBe("clarification");
    expect(result.plan).toBeNull();
    expect(agent.createRun).not.toHaveBeenCalled();
  });

  it("blocks automatic payment execution without creating an AgentRun", async () => {
    const { service, agent } = setup();

    const result = await service.sendMessage("u1", {
      message: "Send money to David automatically."
    });

    expect(result.mode).toBe("blocked");
    expect(result.message).toContain("cannot move money automatically");
    expect(result.plan).toBeNull();
    expect(agent.createRun).not.toHaveBeenCalled();
  });

  it("returns blocked when AI parsing is disabled", async () => {
    const { service, privacy, ai, agent } = setup();
    privacy.getSettings.mockResolvedValue({ aiParsingEnabled: false });

    const result = await service.sendMessage("u1", { message: "What is AI?" });

    expect(result.mode).toBe("blocked");
    expect(result.message).toContain("disabled in Control");
    expect(ai.generateNormalAnswer).not.toHaveBeenCalled();
    expect(agent.createRun).not.toHaveBeenCalled();
  });
});
