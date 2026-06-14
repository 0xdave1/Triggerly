import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { ActionPromptEventType, ActionPromptStatus, ActionType } from "@/common/enums";
import { ActionPromptsService } from "./action-prompts.service";

describe("ActionPromptsService", () => {
  function setup(overrides?: { privacy?: any; prompt?: any; reminder?: any }) {
    const prompt = overrides?.prompt ?? { id: "a1", userId: "u1", actionType: ActionType.OPEN_PAYMENT_APP, payload: { amount: 100 } };
    const reminder = overrides && "reminder" in overrides ? overrides.reminder : { id: "r1", userId: "u1" };
    const prisma: any = {
      $transaction: jest.fn((input) => (typeof input === "function" ? input(prisma) : Promise.all(input))),
      actionPrompt: {
        findMany: jest.fn().mockResolvedValue([prompt]),
        findFirst: jest.fn().mockResolvedValue(prompt),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: "a1", ...data })),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: "a1", ...prompt, ...data }))
      },
      actionPromptEvent: {
        create: jest.fn().mockResolvedValue({ id: "e1" })
      },
      reminder: {
        findFirst: jest.fn().mockResolvedValue(reminder)
      },
      followUpSuggestion: {
        create: jest.fn().mockResolvedValue({ id: "f1" })
      }
    };
    const privacy = overrides?.privacy ?? {
      assertCanCreateActionPrompt: jest.fn().mockResolvedValue(undefined),
      getSettings: jest.fn().mockResolvedValue({ followUpSuggestionsEnabled: true })
    };
    return { prisma, privacy, service: new ActionPromptsService(prisma as any, privacy as any) };
  }

  it("creates payment prompts pending confirmation and does not execute", async () => {
    const { prisma, service } = setup();

    await service.create("u1", { actionType: ActionType.OPEN_PAYMENT_APP, payload: { amount: 100 } });

    expect(prisma.actionPrompt.create.mock.calls[0][0].data.status).toBe(ActionPromptStatus.PENDING_CONFIRMATION);
    expect(prisma.actionPrompt.create.mock.calls[0][0].data.sensitive).toBe(true);
    expect(prisma.actionPrompt.create.mock.calls[0][0].data.payload.safety).toBe("confirmation_required_no_auto_execute");
    expect(prisma.actionPrompt.create.mock.calls[0][0].data.payload.executedAutomatically).toBe(false);
  });

  it("blocks actions through privacy gates", async () => {
    const privacy = { assertCanCreateActionPrompt: jest.fn().mockRejectedValue(new ForbiddenException()) };
    const { service } = setup({ privacy });

    await expect(service.create("u1", { actionType: ActionType.DRAFT_EMAIL, payload: { topic: "proposal" } })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("enforces ownership", async () => {
    const { service } = setup({ reminder: null });

    await expect(service.create("u1", { reminderId: "r2", actionType: ActionType.CALL_CONTACT })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("returns not found for prompts owned by another user", async () => {
    const { prisma, service } = setup();
    prisma.actionPrompt.findFirst.mockResolvedValueOnce(null);

    await expect(service.get("u2", "a1")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("confirms without external execution", async () => {
    const { prisma, service } = setup();

    await service.confirm("u1", "a1");

    expect(prisma.actionPrompt.update.mock.calls[0][0].data.status).toBe(ActionPromptStatus.CONFIRMED);
    expect(prisma.actionPrompt.update.mock.calls[0][0].data.confirmedAt).toBeInstanceOf(Date);
    expect(prisma.actionPromptEvent.create.mock.calls[0][0].data.eventType).toBe(ActionPromptEventType.CONFIRMED);
    expect(prisma.actionPromptEvent.create.mock.calls[0][0].data.metadata).toMatchObject({ autoExecuted: false, paymentMoved: false });
  });

  it("stores generated email content without sending", async () => {
    const { prisma, service } = setup({ prompt: { id: "a1", userId: "u1", actionType: ActionType.DRAFT_EMAIL, payload: { recipientName: "Mr Ade", topic: "proposal" } } });

    await service.generateContent("u1", "a1");

    expect(prisma.actionPrompt.update.mock.calls[0][0].data.generatedContent).toContain("Subject: proposal");
    expect(prisma.actionPromptEvent.create.mock.calls[0][0].data.eventType).toBe(ActionPromptEventType.CONTENT_GENERATED);
    expect(prisma.actionPromptEvent.create.mock.calls[0][0].data.metadata.externalSend).toBe(false);
  });

  it("completes only after user-controlled lifecycle state changes", async () => {
    const { prisma, service } = setup();

    await service.complete("u1", "a1");

    expect(prisma.actionPrompt.update.mock.calls[0][0].data.status).toBe(ActionPromptStatus.COMPLETED);
    expect(prisma.actionPrompt.update.mock.calls[0][0].data.completedAt).toBeInstanceOf(Date);
    expect(prisma.followUpSuggestion.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ sourceId: "a1" }) })
    );
  });
});
