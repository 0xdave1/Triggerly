import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  const jwt = { signAsync: jest.fn().mockResolvedValue("token") } as unknown as JwtService;

  it("registers a new user with a hashed password", async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: "u1", email: "ada@example.com", name: "Ada", createdAt: new Date(), updatedAt: new Date() })
      }
    };
    const service = new AuthService(prisma as any, jwt);

    const result = await service.register({ name: "Ada", email: "ADA@example.com", password: "password123" });

    expect(result.accessToken).toBe("token");
    expect(prisma.user.create.mock.calls[0][0].data.email).toBe("ada@example.com");
    expect(prisma.user.create.mock.calls[0][0].data.passwordHash).not.toBe("password123");
  });

  it("rejects duplicate accounts", async () => {
    const service = new AuthService({ user: { findUnique: jest.fn().mockResolvedValue({ id: "u1" }) } } as any, jwt);
    await expect(service.register({ email: "ada@example.com", password: "password123" })).rejects.toBeInstanceOf(ConflictException);
  });

  it("rejects invalid login", async () => {
    const service = new AuthService({ user: { findUnique: jest.fn().mockResolvedValue(null) } } as any, jwt);
    await expect(service.login({ email: "ada@example.com", password: "password123" })).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
