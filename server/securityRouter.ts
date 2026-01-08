import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  requestPasswordReset,
  verifyResetToken,
  resetPassword,
} from "./passwordReset";
import {
  get2FASettings,
  setup2FA,
  verify2FASetup,
  verify2FACode,
  disable2FA,
  regenerateBackupCodes,
  is2FAEnabled,
} from "./twoFactorAuth";
import {
  createSession,
  validateSession,
  getUserSessions,
  revokeSession,
  revokeAllSessions,
  getSessionCount,
} from "./sessionManager";

// ============================================
// PASSWORD RESET ROUTER
// ============================================
export const passwordResetRouter = router({
  // Request password reset email
  request: publicProcedure
    .input(
      z.object({
        email: z.string().email("Email không hợp lệ"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const ipAddress =
        ctx.req.headers["x-forwarded-for"]?.toString() ||
        ctx.req.socket.remoteAddress;
      const userAgent = ctx.req.headers["user-agent"];

      return await requestPasswordReset(input.email, ipAddress, userAgent);
    }),

  // Verify reset token
  verify: publicProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .query(async ({ input }) => {
      return await verifyResetToken(input.token);
    }),

  // Reset password with token
  reset: publicProcedure
    .input(
      z.object({
        token: z.string(),
        newPassword: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
      })
    )
    .mutation(async ({ input }) => {
      return await resetPassword(input.token, input.newPassword);
    }),
});

// ============================================
// TWO-FACTOR AUTHENTICATION ROUTER
// ============================================
export const twoFactorRouter = router({
  // Get 2FA settings for current user
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.id) {
      return { isEnabled: false, hasSecret: false, backupCodesRemaining: 0 };
    }
    return await get2FASettings(ctx.user.id);
  }),

  // Setup 2FA - generate secret and QR code
  setup: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user?.id) {
      return { success: false, message: "Chưa đăng nhập." };
    }
    return await setup2FA(ctx.user.id);
  }),

  // Verify setup and enable 2FA
  verifySetup: protectedProcedure
    .input(
      z.object({
        code: z.string().length(6, "Mã phải có 6 chữ số"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.id) {
        return { success: false, message: "Chưa đăng nhập." };
      }
      return await verify2FASetup(ctx.user.id, input.code);
    }),

  // Verify 2FA code during login
  verify: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        code: z.string().min(6, "Mã không hợp lệ"),
      })
    )
    .mutation(async ({ input }) => {
      return await verify2FACode(input.userId, input.code);
    }),

  // Disable 2FA
  disable: protectedProcedure
    .input(
      z.object({
        code: z.string().min(6, "Mã không hợp lệ"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.id) {
        return { success: false, message: "Chưa đăng nhập." };
      }
      return await disable2FA(ctx.user.id, input.code);
    }),

  // Regenerate backup codes
  regenerateBackupCodes: protectedProcedure
    .input(
      z.object({
        code: z.string().min(6, "Mã không hợp lệ"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.id) {
        return { success: false, message: "Chưa đăng nhập." };
      }
      return await regenerateBackupCodes(ctx.user.id, input.code);
    }),

  // Check if 2FA is enabled for a user (for login flow)
  isEnabled: publicProcedure
    .input(
      z.object({
        userId: z.number(),
      })
    )
    .query(async ({ input }) => {
      return await is2FAEnabled(input.userId);
    }),
});

// ============================================
// SESSION MANAGEMENT ROUTER
// ============================================
export const sessionRouter = router({
  // Get all sessions for current user
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.id) {
      return [];
    }
    return await getUserSessions(ctx.user.id);
  }),

  // Get session count
  count: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.id) {
      return 0;
    }
    return await getSessionCount(ctx.user.id);
  }),

  // Revoke a specific session
  revoke: protectedProcedure
    .input(
      z.object({
        sessionId: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.id) {
        return { success: false, message: "Chưa đăng nhập." };
      }
      return await revokeSession(ctx.user.id, input.sessionId, input.reason);
    }),

  // Revoke all sessions except current
  revokeAll: protectedProcedure
    .input(
      z.object({
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.id) {
        return { success: false, count: 0, message: "Chưa đăng nhập." };
      }
      // Get current session token from cookie
      const currentToken = ctx.req.cookies?.["dreamweldtech_admin_token"];
      return await revokeAllSessions(ctx.user.id, currentToken, input.reason);
    }),
});

// ============================================
// COMBINED SECURITY ROUTER
// ============================================
export const securityRouter = router({
  passwordReset: passwordResetRouter,
  twoFactor: twoFactorRouter,
  sessions: sessionRouter,
});
