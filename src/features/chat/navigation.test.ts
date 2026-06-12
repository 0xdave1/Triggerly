import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("chat-first navigation", () => {
  it("defines the five primary product tabs", () => {
    const layout = readFileSync("src/app/(tabs)/_layout.tsx", "utf8");

    for (const tab of ["Chat", "Triggers", "Memory", "Actions", "Control"]) {
      expect(layout).toContain(`title: "${tab}"`);
    }
  });
});
