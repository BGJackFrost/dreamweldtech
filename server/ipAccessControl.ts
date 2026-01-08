/**
 * IP Access Control Service
 * Quản lý IP Blacklist/Whitelist
 */

import { getDb } from "./db";
import { ipAccessControl } from "../drizzle/schema";
import { eq, and, or, gte, isNull, desc, sql } from "drizzle-orm";

interface IpCheckResult {
  allowed: boolean;
  reason?: string;
  ruleType?: "blacklist" | "whitelist";
  ruleId?: number;
}

/**
 * Check if an IP is allowed to access
 */
export async function checkIpAccess(ipAddress: string): Promise<IpCheckResult> {
  const db = await getDb();
  if (!db) return { allowed: true };
  
  try {
    const now = new Date();
    
    // Get all active rules for this IP (or matching CIDR ranges)
    const rules = await db.select()
      .from(ipAccessControl)
      .where(and(
        eq(ipAccessControl.ipAddress, ipAddress),
        eq(ipAccessControl.isActive, "true"),
        or(
          isNull(ipAccessControl.expiresAt),
          gte(ipAccessControl.expiresAt, now)
        )
      ))
      .orderBy(desc(ipAccessControl.createdAt));
    
    // Check whitelist first (whitelist takes priority)
    const whitelistRule = rules.find(r => r.type === "whitelist");
    if (whitelistRule) {
      // Update hit count
      await updateHitCount(whitelistRule.id);
      return {
        allowed: true,
        reason: "IP trong whitelist",
        ruleType: "whitelist",
        ruleId: whitelistRule.id,
      };
    }
    
    // Check blacklist
    const blacklistRule = rules.find(r => r.type === "blacklist");
    if (blacklistRule) {
      // Update hit count
      await updateHitCount(blacklistRule.id);
      return {
        allowed: false,
        reason: blacklistRule.reason || "IP bị chặn",
        ruleType: "blacklist",
        ruleId: blacklistRule.id,
      };
    }
    
    // No rules found, allow by default
    return { allowed: true };
  } catch (error) {
    console.error("[IP Access Control] Error checking IP:", error);
    return { allowed: true }; // Allow on error to prevent lockout
  }
}

/**
 * Update hit count for a rule
 */
async function updateHitCount(ruleId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  try {
    await db.update(ipAccessControl)
      .set({
        hitCount: sql`${ipAccessControl.hitCount} + 1`,
        lastHitAt: new Date(),
      })
      .where(eq(ipAccessControl.id, ruleId));
  } catch (error) {
    console.error("[IP Access Control] Error updating hit count:", error);
  }
}

/**
 * Add IP to blacklist
 */
export async function addToBlacklist(
  ipAddress: string,
  options?: {
    reason?: string;
    addedBy?: number;
    expiresAt?: Date;
  }
): Promise<{ success: boolean; id?: number; message: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Database không khả dụng" };
  
  try {
    // Check if already exists
    const existing = await db.select()
      .from(ipAccessControl)
      .where(and(
        eq(ipAccessControl.ipAddress, ipAddress),
        eq(ipAccessControl.type, "blacklist"),
        eq(ipAccessControl.isActive, "true")
      ))
      .limit(1);
    
    if (existing.length > 0) {
      return { success: false, message: "IP đã có trong blacklist" };
    }
    
    const result = await db.insert(ipAccessControl).values({
      ipAddress,
      type: "blacklist",
      reason: options?.reason,
      addedBy: options?.addedBy,
      expiresAt: options?.expiresAt,
    });
    
    return { success: true, id: result[0].insertId, message: "Đã thêm IP vào blacklist" };
  } catch (error) {
    console.error("[IP Access Control] Error adding to blacklist:", error);
    return { success: false, message: "Có lỗi xảy ra" };
  }
}

/**
 * Add IP to whitelist
 */
export async function addToWhitelist(
  ipAddress: string,
  options?: {
    reason?: string;
    addedBy?: number;
    expiresAt?: Date;
  }
): Promise<{ success: boolean; id?: number; message: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Database không khả dụng" };
  
  try {
    // Check if already exists
    const existing = await db.select()
      .from(ipAccessControl)
      .where(and(
        eq(ipAccessControl.ipAddress, ipAddress),
        eq(ipAccessControl.type, "whitelist"),
        eq(ipAccessControl.isActive, "true")
      ))
      .limit(1);
    
    if (existing.length > 0) {
      return { success: false, message: "IP đã có trong whitelist" };
    }
    
    const result = await db.insert(ipAccessControl).values({
      ipAddress,
      type: "whitelist",
      reason: options?.reason,
      addedBy: options?.addedBy,
      expiresAt: options?.expiresAt,
    });
    
    return { success: true, id: result[0].insertId, message: "Đã thêm IP vào whitelist" };
  } catch (error) {
    console.error("[IP Access Control] Error adding to whitelist:", error);
    return { success: false, message: "Có lỗi xảy ra" };
  }
}

/**
 * Remove IP from access control
 */
export async function removeIpRule(ruleId: number): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Database không khả dụng" };
  
  try {
    await db.update(ipAccessControl)
      .set({ isActive: "false", updatedAt: new Date() })
      .where(eq(ipAccessControl.id, ruleId));
    
    return { success: true, message: "Đã xóa quy tắc IP" };
  } catch (error) {
    console.error("[IP Access Control] Error removing rule:", error);
    return { success: false, message: "Có lỗi xảy ra" };
  }
}

/**
 * Get all IP rules
 */
export async function getIpRules(options?: {
  type?: "blacklist" | "whitelist";
  activeOnly?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ rules: any[]; total: number }> {
  const db = await getDb();
  if (!db) return { rules: [], total: 0 };
  
  try {
    const conditions = [];
    
    if (options?.type) {
      conditions.push(eq(ipAccessControl.type, options.type));
    }
    if (options?.activeOnly !== false) {
      conditions.push(eq(ipAccessControl.isActive, "true"));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const [rules, countResult] = await Promise.all([
      db.select()
        .from(ipAccessControl)
        .where(whereClause)
        .orderBy(desc(ipAccessControl.createdAt))
        .limit(options?.limit || 50)
        .offset(options?.offset || 0),
      db.select({ count: sql<number>`count(*)` })
        .from(ipAccessControl)
        .where(whereClause),
    ]);
    
    return {
      rules,
      total: countResult[0]?.count || 0,
    };
  } catch (error) {
    console.error("[IP Access Control] Error getting rules:", error);
    return { rules: [], total: 0 };
  }
}

/**
 * Update IP rule
 */
export async function updateIpRule(
  ruleId: number,
  updates: {
    reason?: string;
    expiresAt?: Date | null;
    isActive?: boolean;
  }
): Promise<{ success: boolean; message: string }> {
  const db = await getDb();
  if (!db) return { success: false, message: "Database không khả dụng" };
  
  try {
    const updateData: any = { updatedAt: new Date() };
    
    if (updates.reason !== undefined) {
      updateData.reason = updates.reason;
    }
    if (updates.expiresAt !== undefined) {
      updateData.expiresAt = updates.expiresAt;
    }
    if (updates.isActive !== undefined) {
      updateData.isActive = updates.isActive ? "true" : "false";
    }
    
    await db.update(ipAccessControl)
      .set(updateData)
      .where(eq(ipAccessControl.id, ruleId));
    
    return { success: true, message: "Đã cập nhật quy tắc IP" };
  } catch (error) {
    console.error("[IP Access Control] Error updating rule:", error);
    return { success: false, message: "Có lỗi xảy ra" };
  }
}

/**
 * Auto-blacklist an IP (used by rate limiter)
 */
export async function autoBlacklistIp(
  ipAddress: string,
  reason: string,
  durationMinutes: number = 60
): Promise<void> {
  const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
  await addToBlacklist(ipAddress, {
    reason: `[Auto] ${reason}`,
    expiresAt,
  });
}
