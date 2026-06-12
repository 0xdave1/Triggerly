import { validateEnv } from "./env.schema";

const base = {
  DATABASE_URL: "postgresql://user:password@localhost:5432/triggerly",
  JWT_SECRET: "development-secret",
  NODE_ENV: "development"
};

describe("environment validation", () => {
  it("requires a backend API key when FreeModel is selected", () => {
    expect(() =>
      validateEnv({
        ...base,
        AI_PROVIDER: "freemodel",
        OPENAI_API_KEY: ""
      })
    ).toThrow("OPENAI_API_KEY");
  });

  it("allows the heuristic provider without an API key", () => {
    expect(
      validateEnv({
        ...base,
        AI_PROVIDER: "heuristic",
        OPENAI_API_KEY: ""
      }).AI_PROVIDER
    ).toBe("heuristic");
  });
});
