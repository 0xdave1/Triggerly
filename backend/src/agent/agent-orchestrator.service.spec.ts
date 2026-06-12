import { ActionType, AgentRunStatus, DeliveryMode, TriggerType } from "@/common/enums";
import { AgentOrchestratorService } from "./agent-orchestrator.service";

function makeService(overrides: Record<string, unknown> = {}) {
  const prisma = {
    agentRun: {
      create: jest.fn().mockImplementation(({ data }) => ({ id: "run1", ...data })),
      findFirst: jest.fn(),
      update: jest.fn().mockImplementation(({ data }) => ({ id: "run1", ...data }))
    },
    userApproval: { create: jest.fn().mockResolvedValue({}) },
    toolExecution: {
      create: jest.fn().mockResolvedValue({ id: "tool1" }),
      update: jest.fn().mockResolvedValue({})
    },
    chatMessage: { create: jest.fn().mockResolvedValue({}) },
    $transaction: jest.fn().mockImplementation(async (items) => Promise.all(items))
  };
  const ai = { createAgentPlan: jest.fn() };
  const privacy = {
    getSettings: jest.fn().mockResolvedValue({
      aiParsingEnabled: true,
      locationTriggersEnabled: true,
      memoryEnabled: true,
      priceMemoryEnabled: true,
      weatherTriggersEnabled: true,
      exchangeRateTriggersEnabled: true,
      travelContextEnabled: true,
      emailDraftingEnabled: true,
      messageDraftingEnabled: true,
      paymentRemindersEnabled: true,
      paymentActionsEnabled: false,
      contactAccessEnabled: false,
      calendarIntegrationEnabled: false
    })
  };
  const reminders = { create: jest.fn().mockResolvedValue({ id: "reminder1" }) };
  const triggers = { confirm: jest.fn().mockResolvedValue({ id: "trigger1" }) };
  const memory = { create: jest.fn().mockResolvedValue({ id: "memory1" }) };
  const liveContext = {
    createWeatherTrigger: jest.fn().mockResolvedValue({ id: "weather1" }),
    createExchangeRateTrigger: jest.fn().mockResolvedValue({ id: "rate1" }),
    createPriceLog: jest.fn().mockResolvedValue({ id: "price1" })
  };
  const actions = { create: jest.fn().mockResolvedValue({ id: "action1", status: "PENDING_CONFIRMATION" }) };
  const voice = { generateForIntent: jest.fn().mockReturnValue("Briefing ready.") };
  const mocks = {
    prisma,
    ai,
    privacy,
    reminders,
    triggers,
    memory,
    liveContext,
    actions,
    voice,
    ...overrides
  };
  return {
    service: new AgentOrchestratorService(
      mocks.prisma as any,
      mocks.ai as any,
      mocks.privacy as any,
      mocks.reminders as any,
      mocks.triggers as any,
      mocks.memory as any,
      mocks.liveContext as any,
      mocks.actions as any,
      mocks.voice as any
    ),
    mocks
  };
}

describe("AgentOrchestratorService", () => {
  it("builds a location plan without creating a trigger before confirmation", async () => {
    const { service, mocks } = makeService();
    mocks.ai.createAgentPlan.mockResolvedValue({
      id: "p1",
      summary: "One location reminder",
      requiresConfirmation: true,
      items: [{
        id: "i1",
        type: "create_trigger",
        title: "Buy fuel",
        description: "When you arrive at Total",
        riskLevel: "medium",
        status: "proposed",
        payload: {
          triggerType: "location_arrival",
          taskTitle: "Buy fuel",
          location: { placeName: "Total" },
          deliveryMode: DeliveryMode.PUSH
        },
        requiresConfirmation: true,
        sensitive: true
      }]
    });

    const run = await service.createRun("u1", "c1", "Remind me to buy fuel when I get to Total.");

    expect(run.plan.items[0]).toMatchObject({
      type: "create_trigger",
      riskLevel: "medium",
      status: "proposed",
      requiresConfirmation: true
    });
    expect(mocks.triggers.confirm).not.toHaveBeenCalled();
  });

  it("marks disabled privacy features as blocked", async () => {
    const { service, mocks } = makeService();
    mocks.privacy.getSettings.mockResolvedValue({
      aiParsingEnabled: true,
      locationTriggersEnabled: false
    });
    mocks.ai.createAgentPlan.mockResolvedValue({
      id: "p1",
      summary: "One location reminder",
      requiresConfirmation: true,
      items: [{
        id: "i1",
        type: "create_trigger",
        title: "Buy fuel",
        description: "When you arrive at Total",
        riskLevel: "medium",
        status: "proposed",
        payload: { triggerType: "location_arrival", location: "Total" },
        requiresConfirmation: true,
        sensitive: true
      }]
    });

    const run = await service.createRun("u1", "c1", "Buy fuel at Total");

    expect(run.plan.items[0].payload.blockedBy).toBe("locationTriggersEnabled");
  });

  it("confirmation creates the approved record", async () => {
    const { service, mocks } = makeService();
    const plan = {
      id: "p1",
      summary: "One reminder",
      requiresConfirmation: true,
      items: [
        {
          id: "i1",
          type: "create_trigger",
          title: "Review spending",
          description: "Sunday reminder",
          riskLevel: "low",
          status: "proposed",
          payload: {
            triggerType: "habit",
            intent: {
              intentType: "habit",
              triggerType: "habit",
              taskTitle: "Review spending",
              habitCandidate: { frequency: "weekly" },
              confidence: 0.9,
              requiresConfirmation: true
            }
          },
          requiresConfirmation: true,
          sensitive: false
        }
      ]
    };
    mocks.prisma.agentRun.findFirst.mockResolvedValue({ id: "run1", userId: "u1", conversationId: "c1", plan });

    const result = await service.confirmRun("u1", "run1");

    expect(mocks.reminders.create).toHaveBeenCalled();
    expect(result.status).toBe(AgentRunStatus.COMPLETED);
    expect(result.result.completedCount).toBe(1);
  });

  it("rejection creates no records", async () => {
    const { service, mocks } = makeService();
    const plan = {
      id: "p1",
      summary: "One reminder",
      requiresConfirmation: true,
      items: [
        {
          id: "i1",
          type: "create_trigger",
          title: "Call David",
          description: "Tomorrow",
          riskLevel: "low",
          status: "proposed",
          payload: {},
          requiresConfirmation: true,
          sensitive: false
        }
      ]
    };
    mocks.prisma.agentRun.findFirst.mockResolvedValue({ id: "run1", userId: "u1", conversationId: "c1", plan });

    await service.rejectRun("u1", "run1");

    expect(mocks.reminders.create).not.toHaveBeenCalled();
    expect(mocks.triggers.confirm).not.toHaveBeenCalled();
    expect(mocks.actions.create).not.toHaveBeenCalled();
  });

  it("payment requests only create a pending action prompt", async () => {
    const { service, mocks } = makeService();
    mocks.ai.createAgentPlan.mockResolvedValue({
      id: "p1",
      summary: "One payment reminder",
      requiresConfirmation: true,
      items: [{
        id: "i1",
        type: "create_action_prompt",
        title: "Payment reminder for David",
        description: "Prepare a payment reminder only.",
        riskLevel: "sensitive",
        status: "proposed",
        payload: {
          actionType: ActionType.PAYMENT_REMINDER,
          recipientName: "David",
          amount: 20000,
          currency: "NGN",
          executionAllowed: false
        },
        requiresConfirmation: true,
        sensitive: true
      }]
    });
    const created = await service.createRun("u1", "c1", "Send 20,000 to David tomorrow");
    mocks.prisma.agentRun.findFirst.mockResolvedValue({
      id: "run1",
      userId: "u1",
      conversationId: "c1",
      plan: created.plan
    });

    await service.confirmRun("u1", "run1");

    expect(mocks.actions.create).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({
        actionType: ActionType.PAYMENT_REMINDER,
        payload: expect.objectContaining({ executionAllowed: false })
      })
    );
    expect(mocks.reminders.create).not.toHaveBeenCalled();
    expect(mocks.triggers.confirm).not.toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({ type: TriggerType.TIME })
    );
  });

  it("returns a privacy-blocked result without executing the tool", async () => {
    const { service, mocks } = makeService();
    const plan = {
      id: "p1",
      summary: "Weather alert",
      requiresConfirmation: true,
      items: [
        {
          id: "i1",
          type: "create_live_context_trigger",
          title: "Abuja rain alert",
          description: "Check for rain.",
          riskLevel: "low",
          status: "proposed",
          payload: { triggerType: "weather", blockedBy: "weatherTriggersEnabled" },
          requiresConfirmation: true,
          sensitive: false
        }
      ]
    };
    mocks.prisma.agentRun.findFirst.mockResolvedValue({
      id: "run1",
      userId: "u1",
      conversationId: "c1",
      plan
    });

    const result = await service.confirmRun("u1", "run1");

    expect(result.plan.items[0].result).toEqual(
      expect.objectContaining({
        status: "blocked_by_privacy",
        setting: "weatherTriggersEnabled"
      })
    );
    expect(mocks.liveContext.createWeatherTrigger).not.toHaveBeenCalled();
    expect(mocks.prisma.toolExecution.create).not.toHaveBeenCalled();
  });
});
