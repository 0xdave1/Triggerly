import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiClient } = vi.hoisted(() => ({ apiClient: vi.fn() }));
vi.mock("@/lib/apiClient", () => ({ apiClient }));

import { assistantApi } from "./api";

describe("assistant feature API", () => {
  beforeEach(() => apiClient.mockReset());

  it("turns an answer into a plan rather than creating a record directly", async () => {
    apiClient.mockResolvedValue({ agentRunId: "run1", plan: { id: "p1", summary: "Review", requiresConfirmation: true, items: [] } });

    await assistantApi.turnThisInto({ sourceMessageId: "m1", targetType: "checklist" });

    expect(apiClient).toHaveBeenCalledWith({
      method: "POST",
      path: "/agent/turn-this-into",
      body: { sourceMessageId: "m1", targetType: "checklist" }
    });
  });

  it("uses the smart snooze privacy-aware backend endpoint", async () => {
    apiClient.mockResolvedValue({});

    await assistantApi.smartSnooze({ id: "r1", mode: "tomorrow_morning" });

    expect(apiClient).toHaveBeenCalledWith({
      method: "POST",
      path: "/triggers/r1/snooze-smart",
      body: { mode: "tomorrow_morning" }
    });
  });
});
