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
import {
  changePassword,
  canChangePassword,
} from "./passwordChange";
import {
  logAccess,
  getUserAccessHistory,
  isKnownDevice,
  addKnownDevice,
  removeKnownDevice,
  getUserKnownDevices,
  getUserSecurityPreferences,
  updateUserSecurityPreferences,
} from "./accessHistory";
import {
  getAllSecuritySettings,
  getSecuritySetting,
  setSecuritySetting,
  is2FARequiredForRole,
  userNeeds2FASetup,
} from "./securitySettingsService";

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
// PASSWORD CHANGE ROUTER (for logged-in users)
// ============================================
export const passwordChangeRouter = router({
  // Check if user can change password
  canChange: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.id) {
      return false;
    }
    return await canChangePassword(ctx.user.id);
  }),

  // Change password
  change: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
        newPassword: z.string().min(8, "Mật khẩu mới phải có ít nhất 8 ký tự"),
        logoutAllSessions: z.boolean().optional().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.id) {
        return { success: false, message: "Chưa đăng nhập." };
      }
      
      const ipAddress =
        ctx.req.headers["x-forwarded-for"]?.toString() ||
        ctx.req.socket.remoteAddress;
      const userAgent = ctx.req.headers["user-agent"];
      const currentToken = ctx.req.cookies?.["dreamweldtech_admin_token"];

      return await changePassword(ctx.user.id, input.currentPassword, input.newPassword, {
        logoutAllSessions: input.logoutAllSessions,
        currentSessionToken: currentToken,
        ipAddress,
        userAgent,
      });
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

  // Check if 2FA is required for current user
  isRequired: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.id) {
      return { required: false, hasSetup: false };
    }
    const role = ctx.user.role || "viewer";
    const required = await is2FARequiredForRole(role);
    const hasSetup = await is2FAEnabled(ctx.user.id);
    return { required, hasSetup };
  }),

  // Check if user needs to setup 2FA
  needsSetup: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.id) {
      return false;
    }
    const role = ctx.user.role || "viewer";
    return await userNeeds2FASetup(ctx.user.id, role);
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
// ACCESS HISTORY ROUTER
// ============================================
export const accessHistoryRouter = router({
  // Get access history for current user
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
        actionType: z.string().optional(),
        status: z.enum(["success", "failed", "blocked"]).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.user?.id) {
        return { history: [], total: 0 };
      }
      return await getUserAccessHistory(ctx.user.id, {
        limit: input.limit,
        offset: input.offset,
        actionType: input.actionType as any,
        status: input.status,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
      });
    }),

  // Get known devices
  devices: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.id) {
      return [];
    }
    return await getUserKnownDevices(ctx.user.id);
  }),

  // Remove known device
  removeDevice: protectedProcedure
    .input(
      z.object({
        deviceId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.id) {
        return { success: false, message: "Chưa đăng nhập." };
      }
      const result = await removeKnownDevice(ctx.user.id, input.deviceId);
      return { success: result, message: result ? "Đã xóa thiết bị" : "Không thể xóa thiết bị" };
    }),
});

// ============================================
// SECURITY PREFERENCES ROUTER
// ============================================
export const securityPreferencesRouter = router({
  // Get security preferences
  get: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.id) {
      return null;
    }
    return await getUserSecurityPreferences(ctx.user.id);
  }),

  // Update security preferences
  update: protectedProcedure
    .input(
      z.object({
        notifyOnNewLogin: z.boolean().optional(),
        notifyOnPasswordChange: z.boolean().optional(),
        notifyOn2FAChange: z.boolean().optional(),
        require2FAForSensitiveActions: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.id) {
        return { success: false, message: "Chưa đăng nhập." };
      }
      const result = await updateUserSecurityPreferences(ctx.user.id, input);
      return { success: result, message: result ? "Đã cập nhật cài đặt" : "Không thể cập nhật cài đặt" };
    }),
});

// ============================================
// ADMIN SECURITY SETTINGS ROUTER
// ============================================
export const adminSecuritySettingsRouter = router({
  // Get all security settings (admin only)
  getAll: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.role || !["admin", "superadmin"].includes(ctx.user.role)) {
      return {};
    }
    return await getAllSecuritySettings();
  }),

  // Get a specific setting
  get: protectedProcedure
    .input(
      z.object({
        key: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.user?.role || !["admin", "superadmin"].includes(ctx.user.role)) {
        return null;
      }
      return await getSecuritySetting(input.key);
    }),

  // Update a setting (admin only)
  set: protectedProcedure
    .input(
      z.object({
        key: z.string(),
        value: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.role || !["admin", "superadmin"].includes(ctx.user.role)) {
        return { success: false, message: "Không có quyền." };
      }
      const result = await setSecuritySetting(input.key, input.value);
      return { success: result, message: result ? "Đã cập nhật cài đặt" : "Không thể cập nhật cài đặt" };
    }),
});

// ============================================
// COMBINED SECURITY ROUTER
// ============================================
export const securityRouter = router({
  passwordReset: passwordResetRouter,
  passwordChange: passwordChangeRouter,
  twoFactor: twoFactorRouter,
  sessions: sessionRouter,
  accessHistory: accessHistoryRouter,
  preferences: securityPreferencesRouter,
  adminSettings: adminSecuritySettingsRouter,
});
