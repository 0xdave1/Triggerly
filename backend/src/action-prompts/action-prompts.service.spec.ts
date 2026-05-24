import { ForbiddenException } from "@nestjs/common";
import { ActionPromptStatus, ActionType } from "@/common/enums";
import { ActionPromptsService } from "./action-prompts.service";

describe("ActionPromptsService", () => {
  it("creates payment prompts pending confirmation and does not execute", async () => {
    const prisma = {
      actionPrompt: { create: jest.fn().mockResolvedValue({ id: "a1", status: ActionPromptStatus.PENDING_CONFIRMATION }) }
    };
    const service = new ActionPromptsService(prisma as any);

    await service.create("u1", { actionType: ActionType.OPEN_PAYMENT_APP, payload: { amount: 100 } });

    expect(prisma.actionPrompt.create.mock.calls[0][0].data.status).toBe(ActionPromptStatus.PENDING_CONFIRMATION);
    expect(prisma.actionPrompt.create.mock.calls[0][0].data.payload.safety).toBe("confirmation_required_no_auto_execute");
  });

  it("enforces reminder ownership when linking prompts", async () => {
    const prisma = {
      reminder: { findFirst: jest.fn().mockResolvedValue(null) }
    };
    const service = new ActionPromptsService(prisma as any);

    await expect(service.create("u1", { reminderId: "r2", actionType: ActionType.CALL_CONTACT })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("confirms without external execution", async () => {
    const prisma = {
      actionPrompt: {
        findFirst: jest.fn().mockResolvedValue({ id: "a1", userId: "u1" }),
        update: jest.fn().mockResolvedValue({ id: "a1", status: ActionPromptStatus.CONFIRMED })
      }
    };
    const service = new ActionPromptsService(prisma as any);

    await service.confirm("u1", "a1");

    expect(prisma.actionPrompt.update.mock.calls[0][0].data.status).toBe(ActionPromptStatus.CONFIRMED);
  });
});
