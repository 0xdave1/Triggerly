import { parseSafeJson } from "./safe-json.util";

describe("parseSafeJson", () => {
  it("strips code fences", () => {
    expect(parseSafeJson('```json\n{"ok":true}\n```')).toEqual({ ok: true });
  });

  it("rejects malformed responses", () => {
    expect(() => parseSafeJson("not json")).toThrow("invalid JSON");
  });
});
