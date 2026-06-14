import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiClient, backendUnavailable } = vi.hoisted(() => ({
  apiClient: vi.fn(),
  backendUnavailable: { value: false }
}));

vi.mock("@/lib/apiClient", () => ({
  apiClient,
  isBackendUnavailable: () => backendUnavailable.value
}));

import { confirmAgentRun, sendChatMessage } from "./api";

describe("chat API", () => {
  beforeEach(() => {
    apiClient.mockReset();
    backendUnavailable.value = false;
  });

  it("confirms an agent run through the backend", async () => {
    apiClient.mockResolvedValue({
      id: "run1",
      status: "COMPLETED",
      plan: { id: "plan1", summary: "Done", requiresConfirmation: false, items: [] }
    });

    await confirmAgentRun("run1", ["item1"]);

    expect(apiClient).toHaveBeenCalledWith({
      method: "POST",
      path: "/agent-runs/run1/confirm",
      body: { itemIds: ["item1"] }
    });
  });

  it("normalizes answer mode without an AgentPlan", async () => {
    apiClient.mockResolvedValue({
      mode: "answer",
      message: "Artificial intelligence is software that performs human-like tasks.",
      conversationId: "c1",
      agentRunId: null,
      plan: null,
      conversation: { id: "c1", title: "What is AI?" },
      userMessage: {
        id: "m1",
        conversationId: "c1",
        role: "USER",
        content: "What is AI?",
        createdAt: "2026-06-14T10:00:00.000Z"
      },
      assistantMessage: {
        id: "m2",
        conversationId: "c1",
        role: "ASSISTANT",
        content: "Artificial intelligence is software that performs human-like tasks.",
        metadata: { mode: "answer" },
        createdAt: "2026-06-14T10:00:01.000Z"
      },
      agentRun: null
    });

    const response = await sendChatMessage({ message: "What is AI?" });

    expect(response).toMatchObject({
      mode: "answer",
      plan: null,
      agentRun: null
    });
    expect(response.assistantMessage.role).toBe("assistant");
  });

  it("keeps a task plan attached to the assistant message", async () => {
    const plan = {
      id: "p1",
      summary: "Review this reminder.",
      requiresConfirmation: true,
      items: []
    };
    apiClient.mockResolvedValue({
      mode: "plan",
      message: plan.summary,
      conversationId: "c1",
      agentRunId: "r1",
      plan,
      conversation: { id: "c1", title: "Remind me" },
      userMessage: {
        id: "m1",
        conversationId: "c1",
        role: "USER",
        content: "Remind me tomorrow",
        createdAt: "2026-06-14T10:00:00.000Z"
      },
      assistantMessage: {
        id: "m2",
        conversationId: "c1",
        role: "ASSISTANT",
        content: plan.summary,
        metadata: { mode: "plan", agentRunId: "r1", plan },
        createdAt: "2026-06-14T10:00:01.000Z"
      },
      agentRun: {
        id: "r1",
        status: "WAITING_FOR_CONFIRMATION",
        plan
      }
    });

    const response = await sendChatMessage({ message: "Remind me tomorrow" });

    expect(response.mode).toBe("plan");
    expect(response.agentRun?.id).toBe("r1");
    expect(response.assistantMessage.metadata?.plan).toEqual(plan);
  });

  it("does not invent a plan for an offline informational question", async () => {
    backendUnavailable.value = true;
    apiClient.mockRejectedValue(new Error("network unavailable"));

    const response = await sendChatMessage({ message: "What is AI?" });

    expect(response).toMatchObject({
      source: "local_fallback",
      mode: "answer",
      plan: null,
      agentRun: null
    });
  });
});
