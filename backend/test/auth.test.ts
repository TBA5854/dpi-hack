import { describe, expect, test, beforeEach, afterAll } from "bun:test";
import { AuthService } from "../src/auth/auth.service";
import { AppError } from "../src/utils/AppError";
import prisma from "../src/prisma";

describe("Auth Service (Integration)", () => {
  const authService = new AuthService();
  const testUsername = "test_integration_user";
  const testPhone = "9999999999";

  // Cleanup before and after
  const cleanup = async () => {
    try {
      await prisma.user.delete({ where: { username: testUsername } });
    } catch (e) {
      // Ignore if not found
    }
    try {
      await prisma.user.delete({ where: { phoneNumber: testPhone } });
    } catch (e) {
      // Ignore
    }
  };

  beforeEach(async () => {
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  test("register should create user and return token", async () => {
    const token = await authService.register(testUsername, testPhone, "password");
    
    expect(token).toBeString();
    
    const user = await prisma.user.findUnique({ where: { username: testUsername } });
    expect(user).not.toBeNull();
    expect(user?.username).toBe(testUsername);
  });

  test("login should fail with invalid credentials", async () => {
    try {
      await authService.login("nonexistent@example.com", "password");
    } catch (e) {
      expect(e).toBeInstanceOf(AppError);
      expect((e as AppError).message).toBe("Invalid credentials");
      expect((e as AppError).statusCode).toBe(401);
    }
  });
});
