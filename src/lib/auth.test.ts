import { describe, expect, it, vi } from "vitest";
import { createToken, hashPassword, verifyPassword, verifyToken } from "@/lib/auth";

describe("auth primitives", () => {
  it("hashes and verifies passwords without storing plaintext", () => {
    const hash = hashPassword("correct horse battery staple");

    expect(hash).not.toContain("correct horse battery staple");
    expect(verifyPassword("correct horse battery staple", hash)).toBe(true);
    expect(verifyPassword("wrong password", hash)).toBe(false);
  });

  it("creates and verifies signed JWT sessions", () => {
    vi.stubEnv("AUTH_SECRET", "test-secret");
    const token = createToken({
      id: "user-1",
      name: "Nitin",
      email: "nitin@example.com",
      role: "ops"
    });

    expect(verifyToken(token)).toMatchObject({
      id: "user-1",
      email: "nitin@example.com",
      role: "ops"
    });
    expect(verifyToken(`${token.slice(0, -2)}xx`)).toBeNull();
  });
});
