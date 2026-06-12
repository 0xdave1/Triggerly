import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiClient } = vi.hoisted(() => ({ apiClient: vi.fn() }));

vi.mock("@/lib/apiClient", () => ({
  apiClient,
  isBackendUnavailable: () => false
}));

import { confirmAgentRun } from "./api";

describe("chat API", () => {
  beforeEach(() => {
    apiClient.mockReset();
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
});
