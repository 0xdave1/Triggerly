import { Prisma } from "@prisma/client";
import { toNullablePrismaJson, toPrismaJson } from "./prisma-json";

describe("Prisma JSON helpers", () => {
  it("serializes plain objects for Prisma Json fields", () => {
    expect(toPrismaJson({ person: "David", amount: "8k" })).toEqual({ person: "David", amount: "8k" });
  });

  it("converts undefined/null to Prisma JsonNull for nullable fields", () => {
    expect(toNullablePrismaJson(undefined)).toBe(Prisma.JsonNull);
    expect(toNullablePrismaJson(null)).toBe(Prisma.JsonNull);
  });
});
