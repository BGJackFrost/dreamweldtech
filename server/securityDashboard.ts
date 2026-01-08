/**
 * Security Dashboard Service
 * Tổng hợp các chỉ số bảo mật
 */

import { getDb } from "./db";
import { sql } from "drizzle-orm";

export interface SecurityStats {
  // Login statistics
  totalLogins: number;
  successfulLogins: number;
  failedLogins: number;
  loginSuccessRate: number;

  // IP statistics
  blockedIps: number;
  whitelistedIps: number;
  lockedIps: number;
  geoBlockedCountries: number;

  // Security events
  suspiciousActivities: number;
  passwordResets: number;
  twoFactorEnabled: number;

  // Recent activity
  recentFailedLogins: { ipAddress: string; attempts: number; lastAttempt: Date }[];
  recentBlockedIps: { ipAddress: string; reason: string; blockedAt: Date }[];
  topBlockedCountries: { countryCode: string; countryName: string; hitCount: number }[];
}

export interface SecurityTrend {
  date: string;
  successfulLogins: number;
  failedLogins: number;
  blockedRequests: number;
}

/**
 * Get security dashboard statistics
 */
export async function getSecurityStats(): Promise<SecurityStats> {
  const db = await getDb();
  if (!db) {
    return getEmptyStats();
  }

  try {
    // Login statistics (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const loginStats = await db.select({
      total: sql<number>`count(*)`,
      successful: sql<number>`SUM(CASE WHEN is_success = 'true' THEN 1 ELSE 0 END)`,
      failed: sql<number>`SUM(CASE WHEN is_success = 'false' THEN 1 ELSE 0 END)`,
    })
      .from(sql`login_attempts`)
      .where(sql`attempted_at >= ${thirtyDaysAgo}`);

    const totalLogins = loginStats[0]?.total || 0;
    const successfulLogins = loginStats[0]?.successful || 0;
    const failedLogins = loginStats[0]?.failed || 0;
    const loginSuccessRate = totalLogins > 0 ? (successfulLogins / totalLogins) * 100 : 100;

    // IP statistics
    const blockedIps = await db.select({ count: sql<number>`count(*)` })
      .from(sql`ip_access_control`)
      .where(sql`type = 'blacklist' AND is_active = true`);

    const whitelistedIps = await db.select({ count: sql<number>`count(*)` })
      .from(sql`ip_access_control`)
      .where(sql`type = 'whitelist' AND is_active = true`);

    const lockedIps = await db.select({ count: sql<number>`count(*)` })
      .from(sql`ip_lockouts`)
      .where(sql`is_locked = 'true' AND locked_until > NOW()`);

    const geoBlockedCountries = await db.select({ count: sql<number>`count(*)` })
      .from(sql`geo_blocking_rules`)
      .where(sql`rule_type = 'block' AND is_active = true`);

    // Security events
    const passwordResets = await db.select({ count: sql<number>`count(*)` })
      .from(sql`password_reset_tokens`)
      .where(sql`created_at >= ${thirtyDaysAgo}`);

    const twoFactorEnabled = await db.select({ count: sql<number>`count(*)` })
      .from(sql`two_factor_auth`)
      .where(sql`is_enabled = true`);

    // Suspicious activities (failed logins > 3 from same IP)
    const suspiciousIps = await db.select({ count: sql<number>`count(DISTINCT ip_address)` })
      .from(sql`login_attempts`)
      .where(sql`is_success = 'false' AND attempted_at >= ${thirtyDaysAgo}`)
      .groupBy(sql`ip_address`)
      .having(sql`count(*) > 3`);

    // Recent failed logins
    const recentFailedLogins = await db.select({
      ipAddress: sql<string>`ip_address`,
      attempts: sql<number>`count(*)`,
      lastAttempt: sql<Date>`MAX(attempted_at)`,
    })
      .from(sql`login_attempts`)
      .where(sql`is_success = 'false' AND attempted_at >= ${thirtyDaysAgo}`)
      .groupBy(sql`ip_address`)
      .orderBy(sql`count(*) DESC`)
      .limit(10);

    // Recent blocked IPs
    const recentBlockedIps = await db.select()
      .from(sql`ip_access_control`)
      .where(sql`type = 'blacklist' AND is_active = true`)
      .orderBy(sql`created_at DESC`)
      .limit(10);

    // Top blocked countries
    const topBlockedCountries = await db.select()
      .from(sql`geo_blocking_rules`)
      .where(sql`rule_type = 'block' AND is_active = true`)
      .orderBy(sql`hit_count DESC`)
      .limit(10);

    return {
      totalLogins,
      successfulLogins,
      failedLogins,
      loginSuccessRate: Math.round(loginSuccessRate * 100) / 100,
      blockedIps: blockedIps[0]?.count || 0,
      whitelistedIps: whitelistedIps[0]?.count || 0,
      lockedIps: lockedIps[0]?.count || 0,
      geoBlockedCountries: geoBlockedCountries[0]?.count || 0,
      suspiciousActivities: suspiciousIps.length,
      passwordResets: passwordResets[0]?.count || 0,
      twoFactorEnabled: twoFactorEnabled[0]?.count || 0,
      recentFailedLogins: recentFailedLogins.map((r: any) => ({
        ipAddress: r.ipAddress,
        attempts: r.attempts,
        lastAttempt: r.lastAttempt,
      })),
      recentBlockedIps: recentBlockedIps.map((r: any) => ({
        ipAddress: r.ip_address,
        reason: r.reason || "Manual block",
        blockedAt: r.created_at,
      })),
      topBlockedCountries: topBlockedCountries.map((r: any) => ({
        countryCode: r.country_code,
        countryName: r.country_name,
        hitCount: r.hit_count,
      })),
    };
  } catch (error) {
    console.error("[SecurityDashboard] Error getting stats:", error);
    return getEmptyStats();
  }
}

/**
 * Get security trends over time
 */
export async function getSecurityTrends(days: number = 30): Promise<SecurityTrend[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const trends = await db.select({
      date: sql<string>`DATE(attempted_at)`,
      successfulLogins: sql<number>`SUM(CASE WHEN is_success = 'true' THEN 1 ELSE 0 END)`,
      failedLogins: sql<number>`SUM(CASE WHEN is_success = 'false' THEN 1 ELSE 0 END)`,
    })
      .from(sql`login_attempts`)
      .where(sql`attempted_at >= ${startDate}`)
      .groupBy(sql`DATE(attempted_at)`)
      .orderBy(sql`DATE(attempted_at) ASC`);

    // Get blocked requests from IP access control hits
    const blockedTrends = await db.select({
      date: sql<string>`DATE(last_hit_at)`,
      blockedRequests: sql<number>`SUM(hit_count)`,
    })
      .from(sql`ip_access_control`)
      .where(sql`type = 'blacklist' AND last_hit_at >= ${startDate}`)
      .groupBy(sql`DATE(last_hit_at)`);

    // Merge trends
    const trendMap = new Map<string, SecurityTrend>();
    
    trends.forEach((t: any) => {
      trendMap.set(t.date, {
        date: t.date,
        successfulLogins: t.successfulLogins || 0,
        failedLogins: t.failedLogins || 0,
        blockedRequests: 0,
      });
    });

    blockedTrends.forEach((t: any) => {
      const existing = trendMap.get(t.date);
      if (existing) {
        existing.blockedRequests = t.blockedRequests || 0;
      } else {
        trendMap.set(t.date, {
          date: t.date,
          successfulLogins: 0,
          failedLogins: 0,
          blockedRequests: t.blockedRequests || 0,
        });
      }
    });

    return Array.from(trendMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error("[SecurityDashboard] Error getting trends:", error);
    return [];
  }
}

/**
 * Get security alerts
 */
export async function getSecurityAlerts(): Promise<{
  level: "critical" | "warning" | "info";
  message: string;
  timestamp: Date;
}[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  const alerts: { level: "critical" | "warning" | "info"; message: string; timestamp: Date }[] = [];
  const now = new Date();

  try {
    // Check for high failed login rate
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentFailures = await db.select({ count: sql<number>`count(*)` })
      .from(sql`login_attempts`)
      .where(sql`is_success = 'false' AND attempted_at >= ${oneHourAgo}`);

    if ((recentFailures[0]?.count || 0) > 50) {
      alerts.push({
        level: "critical",
        message: `Phát hiện ${recentFailures[0].count} lần đăng nhập thất bại trong 1 giờ qua`,
        timestamp: now,
      });
    } else if ((recentFailures[0]?.count || 0) > 20) {
      alerts.push({
        level: "warning",
        message: `${recentFailures[0].count} lần đăng nhập thất bại trong 1 giờ qua`,
        timestamp: now,
      });
    }

    // Check for locked IPs
    const lockedIps = await db.select({ count: sql<number>`count(*)` })
      .from(sql`ip_lockouts`)
      .where(sql`is_locked = 'true' AND locked_until > NOW()`);

    if ((lockedIps[0]?.count || 0) > 0) {
      alerts.push({
        level: "warning",
        message: `${lockedIps[0].count} địa chỉ IP đang bị khóa do vượt quá giới hạn đăng nhập`,
        timestamp: now,
      });
    }

    // Check for suspicious IPs (many failed attempts)
    const suspiciousIps = await db.select({
      ipAddress: sql<string>`ip_address`,
      count: sql<number>`count(*)`,
    })
      .from(sql`login_attempts`)
      .where(sql`is_success = 'false' AND attempted_at >= ${oneHourAgo}`)
      .groupBy(sql`ip_address`)
      .having(sql`count(*) >= 5`);

    if (suspiciousIps.length > 0) {
      alerts.push({
        level: "warning",
        message: `${suspiciousIps.length} IP đáng ngờ với nhiều lần đăng nhập thất bại`,
        timestamp: now,
      });
    }

    // Check for geo-blocked attempts
    const geoBlockedHits = await db.select({ total: sql<number>`COALESCE(SUM(hit_count), 0)` })
      .from(sql`geo_blocking_rules`)
      .where(sql`rule_type = 'block'`);

    if ((geoBlockedHits[0]?.total || 0) > 0) {
      alerts.push({
        level: "info",
        message: `Đã chặn ${geoBlockedHits[0].total} truy cập từ các quốc gia bị hạn chế`,
        timestamp: now,
      });
    }

    return alerts.sort((a, b) => {
      const levelOrder = { critical: 0, warning: 1, info: 2 };
      return levelOrder[a.level] - levelOrder[b.level];
    });
  } catch (error) {
    console.error("[SecurityDashboard] Error getting alerts:", error);
    return [];
  }
}

function getEmptyStats(): SecurityStats {
  return {
    totalLogins: 0,
    successfulLogins: 0,
    failedLogins: 0,
    loginSuccessRate: 100,
    blockedIps: 0,
    whitelistedIps: 0,
    lockedIps: 0,
    geoBlockedCountries: 0,
    suspiciousActivities: 0,
    passwordResets: 0,
    twoFactorEnabled: 0,
    recentFailedLogins: [],
    recentBlockedIps: [],
    topBlockedCountries: [],
  };
}
