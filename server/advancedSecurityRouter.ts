/**
 * Advanced Security Router
 * IP Control, Rate Limiting, Audit Log
 */

import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  checkIpAccess,
  addToBlacklist,
  addToWhitelist,
  removeIpRule,
  getIpRules,
  updateIpRule,
} from "./ipAccessControl";
import {
  checkRateLimit,
  unlockIp,
  getLockedIps,
  getLoginAttempts,
} from "./rateLimiter";
import {
  getAuditLog,
  getResourceAuditLog,
  getUserActivitySummary,
} from "./auditLog";

// ============================================
// IP ACCESS CONTROL ROUTER
// ============================================
export const ipControlRouter = router({
  // Check if IP is allowed
  check: publicProcedure
    .input(z.object({ ipAddress: z.string() }))
    .query(async ({ input }) => {
      return await checkIpAccess(input.ipAddress);
    }),

  // Get all IP rules (admin only)
  list: protectedProcedure
    .input(z.object({
      type: z.enum(["blacklist", "whitelist"]).optional(),
      activeOnly: z.boolean().optional().default(true),
      limit: z.number().optional().default(50),
      offset: z.number().optional().default(0),
    }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user?.role || !["admin", "superadmin"].includes(ctx.user.role)) {
        return { rules: [], total: 0 };
      }
      return await getIpRules(input);
    }),

  // Add to blacklist
  addBlacklist: protectedProcedure
    .input(z.object({
      ipAddress: z.string().min(1, "IP không được để trống"),
      reason: z.string().optional(),
      expiresAt: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.role || !["admin", "superadmin"].includes(ctx.user.role)) {
        return { success: false, message: "Không có quyền" };
      }
      return await addToBlacklist(input.ipAddress, {
        reason: input.reason,
        addedBy: ctx.user.id,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
      });
    }),

  // Add to whitelist
  addWhitelist: protectedProcedure
    .input(z.object({
      ipAddress: z.string().min(1, "IP không được để trống"),
      reason: z.string().optional(),
      expiresAt: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.role || !["admin", "superadmin"].includes(ctx.user.role)) {
        return { success: false, message: "Không có quyền" };
      }
      return await addToWhitelist(input.ipAddress, {
        reason: input.reason,
        addedBy: ctx.user.id,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
      });
    }),

  // Remove rule
  remove: protectedProcedure
    .input(z.object({ ruleId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.role || !["admin", "superadmin"].includes(ctx.user.role)) {
        return { success: false, message: "Không có quyền" };
      }
      return await removeIpRule(input.ruleId);
    }),

  // Update rule
  update: protectedProcedure
    .input(z.object({
      ruleId: z.number(),
      reason: z.string().optional(),
      expiresAt: z.string().nullable().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.role || !["admin", "superadmin"].includes(ctx.user.role)) {
        return { success: false, message: "Không có quyền" };
      }
      return await updateIpRule(input.ruleId, {
        reason: input.reason,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : input.expiresAt === null ? null : undefined,
        isActive: input.isActive,
      });
    }),
});

// ============================================
// RATE LIMITING ROUTER
// ============================================
export const rateLimitRouter = router({
  // Check rate limit for IP
  check: publicProcedure
    .input(z.object({ ipAddress: z.string() }))
    .query(async ({ input }) => {
      return await checkRateLimit(input.ipAddress);
    }),

  // Get locked IPs
  lockedIps: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.role || !["admin", "superadmin"].includes(ctx.user.role)) {
      return [];
    }
    return await getLockedIps();
  }),

  // Unlock IP
  unlock: protectedProcedure
    .input(z.object({ ipAddress: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user?.role || !["admin", "superadmin"].includes(ctx.user.role)) {
        return { success: false, message: "Không có quyền" };
      }
      return await unlockIp(input.ipAddress);
    }),

  // Get login attempts
  attempts: protectedProcedure
    .input(z.object({
      ipAddress: z.string().optional(),
      limit: z.number().optional().default(50),
      offset: z.number().optional().default(0),
      successOnly: z.boolean().optional(),
      failedOnly: z.boolean().optional(),
    }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user?.role || !["admin", "superadmin"].includes(ctx.user.role)) {
        return { attempts: [], total: 0 };
      }
      return await getLoginAttempts(input.ipAddress, input);
    }),
});

// ============================================
// AUDIT LOG ROUTER
// ============================================
export const auditLogRouter = router({
  // Get audit log
  list: protectedProcedure
    .input(z.object({
      userId: z.number().optional(),
      action: z.string().optional(),
      resourceType: z.string().optional(),
      resourceId: z.number().optional(),
      status: z.enum(["success", "failed", "partial"]).optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().optional().default(50),
      offset: z.number().optional().default(0),
    }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user?.role || !["admin", "superadmin"].includes(ctx.user.role)) {
        return { logs: [], total: 0 };
      }
      return await getAuditLog({
        ...input,
        action: input.action as any,
        resourceType: input.resourceType as any,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
      });
    }),

  // Get resource audit log
  forResource: protectedProcedure
    .input(z.object({
      resourceType: z.string(),
      resourceId: z.number(),
      limit: z.number().optional().default(20),
    }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user?.role || !["admin", "superadmin", "editor"].includes(ctx.user.role)) {
        return [];
      }
      return await getResourceAuditLog(input.resourceType as any, input.resourceId, input.limit);
    }),

  // Get user activity summary
  userSummary: protectedProcedure
    .input(z.object({
      userId: z.number().optional(),
      days: z.number().optional().default(30),
    }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user?.id) {
        return { totalActions: 0, actionsByType: {}, resourcesByType: {}, recentActions: [] };
      }
      // Users can only see their own summary, admins can see anyone's
      const role = ctx.user.role as string;
      const targetUserId = (role === "admin" || role === "superadmin") && input.userId
        ? input.userId
        : ctx.user.id;
      return await getUserActivitySummary(targetUserId, input.days);
    }),
});

// ============================================
// COMBINED ADVANCED SECURITY ROUTER
// ============================================
export const advancedSecurityRouter = router({
  ipControl: ipControlRouter,
  rateLimit: rateLimitRouter,
  auditLog: auditLogRouter,
});
