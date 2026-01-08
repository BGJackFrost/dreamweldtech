/**
 * Rate Limiter Service
 * Giới hạn số lần đăng nhập thất bại từ cùng IP
 */

import { getDb } from "./db";
import { loginAttempts, ipLockouts } from "../drizzle/schema";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import { getSecuritySettingNumber } from "./securitySettingsService";
import { autoBlacklistIp } from "./ipAccessControl";

// Default settings
const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_LOCKOUT_DURATION = 30; // minutes
const DEFAULT_ATTEMPT_WINDOW = 15; // minutes

interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  lockedUntil?: Date;
  message?: string;
}

/**
 * Check if IP is rate limited
 */
export async function checkRateLimit(ipAddress: string): Promise<RateLimitResult> {
  const db = await getDb();
  if (!db) return { allowed: true, remainingAttempts: DEFAULT_MAX_ATTEMPTS };
  
  try {
    // Get settings
    const maxAttempts = await getSecuritySettingNumber("maxLoginAttempts") || DEFAULT_MAX_ATTEMPTS;
    const lockoutDuration = await getSecuritySettingNumber("lockoutDuration") || DEFAULT_LOCKOUT_DURATION;
    
    // Check if currently locked
    const lockout = await db.select()
      .from(ipLockouts)
      .where(eq(ipLockouts.ipAddress, ipAddress))
      .limit(1);
    
    if (lockout.length > 0 && lockout[0].isLocked === "true") {
      const lockedUntil = lockout[0].lockedUntil;
      if (lockedUntil && lockedUntil > new Date()) {
        return {
          allowed: false,
          remainingAttempts: 0,
          lockedUntil,
          message: `IP bị khóa đến ${lockedUntil.toLocaleString("vi-VN")}`,
        };
      } else {
        // Lockout expired, reset
        await resetLockout(ipAddress);
      }
    }
    
    // Count recent failed attempts
    const windowStart = new Date(Date.now() - DEFAULT_ATTEMPT_WINDOW * 60 * 1000);
    const recentAttempts = await db.select({ count: sql<number>`count(*)` })
      .from(loginAttempts)
      .where(and(
        eq(loginAttempts.ipAddress, ipAddress),
        eq(loginAttempts.success, "false"),
        gte(loginAttempts.createdAt, windowStart)
      ));
    
    const failedCount = recentAttempts[0]?.count || 0;
    const remainingAttempts = Math.max(0, maxAttempts - failedCount);
    
    if (failedCount >= maxAttempts) {
      // Lock the IP
      await lockIp(ipAddress, lockoutDuration);
      return {
        allowed: false,
        remainingAttempts: 0,
        lockedUntil: new Date(Date.now() + lockoutDuration * 60 * 1000),
        message: `Quá nhiều lần đăng nhập thất bại. IP bị khóa ${lockoutDuration} phút.`,
      };
    }
    
    return {
      allowed: true,
      remainingAttempts,
    };
  } catch (error) {
    console.error("[Rate Limiter] Error checking rate limit:", error);
    return { allowed: true, remainingAttempts: DEFAULT_MAX_ATTEMPTS };
  }
}

/**
 * Record a login attempt
 */
export async function recordLoginAttempt(
  ipAddress: string,
  username: string | null,
  success: boolean,
  userAgent?: string,
  failureReason?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  try {
    await db.insert(loginAttempts).values({
      ipAddress,
      username,
      success: success ? "true" : "false",
      userAgent,
      failureReason,
    });
    
    // Update lockout record
    if (!success) {
      await incrementFailedAttempts(ipAddress);
    } else {
      // Reset on successful login
      await resetLockout(ipAddress);
    }
  } catch (error) {
    console.error("[Rate Limiter] Error recording attempt:", error);
  }
}

/**
 * Increment failed attempts counter
 */
async function incrementFailedAttempts(ipAddress: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  try {
    const existing = await db.select()
      .from(ipLockouts)
      .where(eq(ipLockouts.ipAddress, ipAddress))
      .limit(1);
    
    if (existing.length > 0) {
      await db.update(ipLockouts)
        .set({
          failedAttempts: sql`${ipLockouts.failedAttempts} + 1`,
          lastAttemptAt: new Date(),
        })
        .where(eq(ipLockouts.ipAddress, ipAddress));
    } else {
      await db.insert(ipLockouts).values({
        ipAddress,
        failedAttempts: 1,
        lastAttemptAt: new Date(),
      });
    }
  } catch (error) {
    console.error("[Rate Limiter] Error incrementing failed attempts:", error);
  }
}

/**
 * Lock an IP
 */
async function lockIp(ipAddress: string, durationMinutes: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  try {
    const lockedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);
    
    const existing = await db.select()
      .from(ipLockouts)
      .where(eq(ipLockouts.ipAddress, ipAddress))
      .limit(1);
    
    if (existing.length > 0) {
      await db.update(ipLockouts)
        .set({
          isLocked: "true",
          lockedAt: new Date(),
          lockedUntil,
        })
        .where(eq(ipLockouts.ipAddress, ipAddress));
    } else {
      await db.insert(ipLockouts).values({
        ipAddress,
        isLocked: "true",
        lockedAt: new Date(),
        lockedUntil,
        failedAttempts: 0,
      });
    }
    
    console.log(`[Rate Limiter] IP ${ipAddress} locked until ${lockedUntil.toISOString()}`);
  } catch (error) {
    console.error("[Rate Limiter] Error locking IP:", error);
  }
}

/**
 * Reset lockout for an IP
 */
async function resetLockout(ipAddress: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  try {
    await db.update(ipLockouts)
      .set({
        isLocked: "false",
        failedAttempts: 0,
        lockedAt: null,
        lockedUntil: null,
      })
      .where(eq(ipLockouts.ipAddress, ipAddress));
  } catch (error) {
    console.error("[Rate Limiter] Error resetting lockout:", error);
  }
}

/**
 * Manually unlock an IP
 */
export async function unlockIp(ipAddress: string): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Database không khả dụng" };
  
  try {
    await resetLockout(ipAddress);
    return { success: true, message: "Đã mở khóa IP" };
  } catch (error) {
    console.error("[Rate Limiter] Error unlocking IP:", error);
    return { success: false, message: "Có lỗi xảy ra" };
  }
}

/**
 * Get locked IPs
 */
export async function getLockedIps(): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db.select()
      .from(ipLockouts)
      .where(eq(ipLockouts.isLocked, "true"))
      .orderBy(desc(ipLockouts.lockedAt));
  } catch (error) {
    console.error("[Rate Limiter] Error getting locked IPs:", error);
    return [];
  }
}

/**
 * Get login attempts for an IP
 */
export async function getLoginAttempts(
  ipAddress?: string,
  options?: {
    limit?: number;
    offset?: number;
    successOnly?: boolean;
    failedOnly?: boolean;
  }
): Promise<{ attempts: any[]; total: number }> {
  const db = await getDb();
  if (!db) return { attempts: [], total: 0 };
  
  try {
    const conditions = [];
    
    if (ipAddress) {
      conditions.push(eq(loginAttempts.ipAddress, ipAddress));
    }
    if (options?.successOnly) {
      conditions.push(eq(loginAttempts.success, "true"));
    }
    if (options?.failedOnly) {
      conditions.push(eq(loginAttempts.success, "false"));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const [attempts, countResult] = await Promise.all([
      db.select()
        .from(loginAttempts)
        .where(whereClause)
        .orderBy(desc(loginAttempts.createdAt))
        .limit(options?.limit || 50)
        .offset(options?.offset || 0),
      db.select({ count: sql<number>`count(*)` })
        .from(loginAttempts)
        .where(whereClause),
    ]);
    
    return {
      attempts,
      total: countResult[0]?.count || 0,
    };
  } catch (error) {
    console.error("[Rate Limiter] Error getting login attempts:", error);
    return { attempts: [], total: 0 };
  }
}

/**
 * Clean up old login attempts (older than 24 hours)
 */
export async function cleanupOldAttempts(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await db.delete(loginAttempts)
      .where(sql`${loginAttempts.createdAt} < ${cutoff}`);
    
    return result[0]?.affectedRows || 0;
  } catch (error) {
    console.error("[Rate Limiter] Error cleaning up old attempts:", error);
    return 0;
  }
}
