import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the database module
vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("$2a$12$hashedpassword"),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

// Mock crypto
vi.mock("crypto", () => ({
  default: {
    randomBytes: vi.fn().mockReturnValue({
      toString: vi.fn().mockReturnValue("mockedtoken123456789abcdef"),
    }),
    createHash: vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({
        digest: vi.fn().mockReturnValue("hashedtoken123"),
      }),
    }),
  },
}));

// Mock email service
vi.mock("../email", () => ({
  sendEmailNotification: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock otplib
vi.mock("otplib", () => ({
  authenticator: {
    generateSecret: vi.fn().mockReturnValue("JBSWY3DPEHPK3PXP"),
    keyuri: vi.fn().mockReturnValue("otpauth://totp/DreamWeldTech:test@test.com?secret=JBSWY3DPEHPK3PXP"),
    verify: vi.fn().mockReturnValue(true),
  },
}));

// Mock qrcode
vi.mock("qrcode", () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue("data:image/png;base64,mockqrcode"),
  },
}));

// Mock ua-parser-js
vi.mock("ua-parser-js", () => ({
  UAParser: vi.fn().mockReturnValue({
    browser: { name: "Chrome", version: "120" },
    os: { name: "Windows", version: "10" },
    device: { type: undefined, vendor: undefined, model: undefined },
  }),
}));

import { getDb } from "../db";

describe("Advanced Security Features", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Password Reset", () => {
    it("should handle password reset request for non-existent email gracefully", async () => {
      // Mock database to return empty array (user not found)
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const { requestPasswordReset } = await import("../passwordReset");
      const result = await requestPasswordReset("nonexistent@test.com");

      // Should return success to not reveal if email exists
      expect(result.success).toBe(true);
      expect(result.message).toContain("Nếu email tồn tại");
    });

    it("should reject reset for OAuth-only accounts", async () => {
      // Mock database to return user without passwordHash
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([
          { id: 1, email: "test@test.com", passwordHash: null, name: "Test User" },
        ]),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const { requestPasswordReset } = await import("../passwordReset");
      const result = await requestPasswordReset("test@test.com");

      expect(result.success).toBe(false);
      expect(result.message).toContain("OAuth");
    });

    it("should handle database unavailable for password reset", async () => {
      vi.mocked(getDb).mockResolvedValue(null);

      const { resetPassword } = await import("../passwordReset");
      const result = await resetPassword("validtoken", "newpassword123");

      expect(result.success).toBe(false);
      expect(result.message).toContain("Database");
    });
  });

  describe("Two-Factor Authentication", () => {
    it("should return default settings for user without 2FA", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const { get2FASettings } = await import("../twoFactorAuth");
      const result = await get2FASettings(1);

      expect(result).toEqual({
        isEnabled: false,
        hasSecret: false,
        backupCodesRemaining: 0,
      });
    });

    it("should return null for 2FA settings when database unavailable", async () => {
      vi.mocked(getDb).mockResolvedValue(null);

      const { get2FASettings } = await import("../twoFactorAuth");
      const result = await get2FASettings(1);

      expect(result).toBeNull();
    });

    it("should check if 2FA is enabled correctly", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([
          { isEnabled: "true", totpSecret: "secret123" },
        ]),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const { is2FAEnabled } = await import("../twoFactorAuth");
      const result = await is2FAEnabled(1);

      expect(result).toBe(true);
    });

    it("should return false for 2FA when not enabled", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([
          { isEnabled: "false", totpSecret: null },
        ]),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const { is2FAEnabled } = await import("../twoFactorAuth");
      const result = await is2FAEnabled(1);

      expect(result).toBe(false);
    });
  });

  describe("Session Management", () => {
    it("should return empty array when database unavailable", async () => {
      vi.mocked(getDb).mockResolvedValue(null);

      const { getUserSessions } = await import("../sessionManager");
      const result = await getUserSessions(1);

      expect(result).toEqual([]);
    });

    it("should return 0 session count when database unavailable", async () => {
      vi.mocked(getDb).mockResolvedValue(null);

      const { getSessionCount } = await import("../sessionManager");
      const result = await getSessionCount(1);

      expect(result).toBe(0);
    });

    it("should fail to revoke session when database unavailable", async () => {
      vi.mocked(getDb).mockResolvedValue(null);

      const { revokeSession } = await import("../sessionManager");
      const result = await revokeSession(1, 1);

      expect(result.success).toBe(false);
      expect(result.message).toContain("Database");
    });

    it("should fail to revoke non-existent session", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const { revokeSession } = await import("../sessionManager");
      const result = await revokeSession(1, 999);

      expect(result.success).toBe(false);
      expect(result.message).toContain("không tồn tại");
    });

    it("should validate session token correctly", async () => {
      vi.mocked(getDb).mockResolvedValue(null);

      const { validateSession } = await import("../sessionManager");
      const result = await validateSession("invalidtoken");

      expect(result.valid).toBe(false);
    });
  });
});
