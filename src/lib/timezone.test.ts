import { describe, expect, it } from "vitest";
import { formatNigeriaDateTimeInput, parseNigeriaDateTimeInput } from "./timezone";

describe("Nigeria timezone helpers", () => {
  it("converts Nigeria wall-clock time to UTC ISO", () => {
    expect(parseNigeriaDateTimeInput("2026-05-27 18:00")).toBe("2026-05-27T17:00:00.000Z");
  });

  it("keeps explicit UTC input stable", () => {
    expect(parseNigeriaDateTimeInput("2026-05-27T18:00:00.000Z")).toBe("2026-05-27T18:00:00.000Z");
  });

  it("uses the next occurrence for time-only input", () => {
    expect(parseNigeriaDateTimeInput("6pm", new Date("2026-05-27T16:30:00.000Z"))).toBe("2026-05-27T17:00:00.000Z");
    expect(parseNigeriaDateTimeInput("6pm", new Date("2026-05-27T17:30:00.000Z"))).toBe("2026-05-28T17:00:00.000Z");
  });

  it("formats stored UTC as Nigeria input", () => {
    expect(formatNigeriaDateTimeInput("2026-05-27T17:00:00.000Z")).toBe("2026-05-27 18:00");
  });
});
