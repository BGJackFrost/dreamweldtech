/**
 * Uptime History Service
 * 
 * Tracks uptime/downtime events and calculates availability metrics.
 * Provides monthly statistics and incident tracking.
 */

import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { uptimeHistory, uptimeMonthlyStats } from "../drizzle/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { performSimpleHealthCheck } from "./healthCheck";

// Types
export interface UptimeCheck {
  timestamp: Date;
  status: "up" | "down" | "degraded";
  responseTime: number | null;
  statusCode: number | null;
  errorMessage: string | null;
}

export interface MonthlyStats {
  yearMonth: string;
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  degradedChecks: number;
  availabilityPercentage: number;
  avgResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  totalDowntimeSeconds: number;
  incidentCount: number;
  mttr: number; // Mean Time To Recovery in seconds
}

// Track last status for incident detection
let lastStatus: "up" | "down" | "degraded" = "up";
let incidentStartTime: Date | null = null;

/**
 * Record an uptime check result
 */
export async function recordUptimeCheck(check: UptimeCheck): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const yearMonth = `${check.timestamp.getFullYear()}-${String(check.timestamp.getMonth() + 1).padStart(2, '0')}`;
  
  // Calculate downtime duration if recovering from incident
  let downtimeDuration: number | null = null;
  if (lastStatus !== "up" && check.status === "up" && incidentStartTime) {
    downtimeDuration = Math.round((check.timestamp.getTime() - incidentStartTime.getTime()) / 1000);
    incidentStartTime = null;
  }
  
  // Track new incident
  if (lastStatus === "up" && check.status !== "up") {
    incidentStartTime = check.timestamp;
  }
  
  lastStatus = check.status;
  
  try {
    // Insert check record
    await db.insert(uptimeHistory).values({
      timestamp: check.timestamp,
      status: check.status,
      responseTime: check.responseTime,
      statusCode: check.statusCode,
      errorMessage: check.errorMessage,
      checkType: "http",
      endpoint: "/api/health",
      downtimeDuration,
      yearMonth,
    });
    
    // Update monthly stats
    await updateMonthlyStats(yearMonth, check, downtimeDuration);
  } catch (error) {
    console.error("[Uptime History] Failed to record check:", error);
  }
}

/**
 * Update monthly statistics
 */
async function updateMonthlyStats(
  yearMonth: string,
  check: UptimeCheck,
  downtimeDuration: number | null
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  try {
    // Check if stats exist for this month
    const existing = await db.select()
      .from(uptimeMonthlyStats)
      .where(eq(uptimeMonthlyStats.yearMonth, yearMonth))
      .limit(1);
    
    if (existing.length === 0) {
      // Create new stats record
      await db.insert(uptimeMonthlyStats).values({
        yearMonth,
        totalChecks: 1,
        successfulChecks: check.status === "up" ? 1 : 0,
        failedChecks: check.status === "down" ? 1 : 0,
        degradedChecks: check.status === "degraded" ? 1 : 0,
        availabilityPercentage: check.status === "up" ? "100.00" : "0.00",
        avgResponseTime: check.responseTime || 0,
        maxResponseTime: check.responseTime || 0,
        minResponseTime: check.responseTime || 0,
        totalDowntimeSeconds: downtimeDuration || 0,
        incidentCount: check.status !== "up" ? 1 : 0,
        mttr: downtimeDuration || 0,
      });
    } else {
      // Update existing stats
      const stats = existing[0];
      const newTotalChecks = (stats.totalChecks || 0) + 1;
      const newSuccessfulChecks = (stats.successfulChecks || 0) + (check.status === "up" ? 1 : 0);
      const newFailedChecks = (stats.failedChecks || 0) + (check.status === "down" ? 1 : 0);
      const newDegradedChecks = (stats.degradedChecks || 0) + (check.status === "degraded" ? 1 : 0);
      const newAvailability = ((newSuccessfulChecks / newTotalChecks) * 100).toFixed(2);
      
      // Update response time stats
      const currentAvg = stats.avgResponseTime || 0;
      const newAvgResponseTime = check.responseTime 
        ? Math.round((currentAvg * (stats.totalChecks || 0) + check.responseTime) / newTotalChecks)
        : currentAvg;
      const newMaxResponseTime = Math.max(stats.maxResponseTime || 0, check.responseTime || 0);
      const newMinResponseTime = stats.minResponseTime === 0 
        ? (check.responseTime || 0)
        : Math.min(stats.minResponseTime || 0, check.responseTime || Infinity);
      
      // Update downtime and MTTR
      const newTotalDowntime = (stats.totalDowntimeSeconds || 0) + (downtimeDuration || 0);
      const newIncidentCount = (stats.incidentCount || 0) + (check.status !== "up" && lastStatus === "up" ? 1 : 0);
      const newMttr = newIncidentCount > 0 ? Math.round(newTotalDowntime / newIncidentCount) : 0;
      
      await db.update(uptimeMonthlyStats)
        .set({
          totalChecks: newTotalChecks,
          successfulChecks: newSuccessfulChecks,
          failedChecks: newFailedChecks,
          degradedChecks: newDegradedChecks,
          availabilityPercentage: newAvailability,
          avgResponseTime: newAvgResponseTime,
          maxResponseTime: newMaxResponseTime,
          minResponseTime: newMinResponseTime,
          totalDowntimeSeconds: newTotalDowntime,
          incidentCount: newIncidentCount,
          mttr: newMttr,
        })
        .where(eq(uptimeMonthlyStats.yearMonth, yearMonth));
    }
  } catch (error) {
    console.error("[Uptime History] Failed to update monthly stats:", error);
  }
}

/**
 * Perform uptime check and record result
 */
export async function performUptimeCheck(): Promise<UptimeCheck> {
  const startTime = Date.now();
  
  try {
    const result = await performSimpleHealthCheck();
    const responseTime = Date.now() - startTime;
    
    const check: UptimeCheck = {
      timestamp: new Date(),
      status: result.status === "ok" ? "up" : "down",
      responseTime,
      statusCode: 200,
      errorMessage: null,
    };
    
    // Check for degraded status (slow response)
    if (responseTime > 1000 && check.status === "up") {
      check.status = "degraded";
    }
    
    await recordUptimeCheck(check);
    return check;
  } catch (error) {
    const check: UptimeCheck = {
      timestamp: new Date(),
      status: "down",
      responseTime: null,
      statusCode: null,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    };
    
    await recordUptimeCheck(check);
    return check;
  }
}

/**
 * Get monthly stats for a date range
 */
export async function getMonthlyStatsRange(
  startMonth: string,
  endMonth: string
): Promise<MonthlyStats[]> {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const results = await db.select()
      .from(uptimeMonthlyStats)
      .where(and(
        gte(uptimeMonthlyStats.yearMonth, startMonth),
        lte(uptimeMonthlyStats.yearMonth, endMonth)
      ))
      .orderBy(desc(uptimeMonthlyStats.yearMonth));
    
    return results.map(r => ({
      yearMonth: r.yearMonth,
      totalChecks: r.totalChecks || 0,
      successfulChecks: r.successfulChecks || 0,
      failedChecks: r.failedChecks || 0,
      degradedChecks: r.degradedChecks || 0,
      availabilityPercentage: Number(r.availabilityPercentage) || 100,
      avgResponseTime: r.avgResponseTime || 0,
      maxResponseTime: r.maxResponseTime || 0,
      minResponseTime: r.minResponseTime || 0,
      totalDowntimeSeconds: r.totalDowntimeSeconds || 0,
      incidentCount: r.incidentCount || 0,
      mttr: r.mttr || 0,
    }));
  } catch (error) {
    console.error("[Uptime History] Failed to get monthly stats:", error);
    return [];
  }
}

/**
 * Get recent uptime checks
 */
export async function getRecentChecks(limit: number = 100): Promise<UptimeCheck[]> {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const results = await db.select()
      .from(uptimeHistory)
      .orderBy(desc(uptimeHistory.timestamp))
      .limit(limit);
    
    return results.map(r => ({
      timestamp: r.timestamp,
      status: r.status as "up" | "down" | "degraded",
      responseTime: r.responseTime,
      statusCode: r.statusCode,
      errorMessage: r.errorMessage,
    }));
  } catch (error) {
    console.error("[Uptime History] Failed to get recent checks:", error);
    return [];
  }
}

/**
 * Calculate current streak (consecutive up checks)
 */
export async function getCurrentStreak(): Promise<{ days: number; since: Date | null }> {
  const db = await getDb();
  if (!db) return { days: 0, since: null };
  
  try {
    // Get last down check
    const lastDown = await db.select()
      .from(uptimeHistory)
      .where(eq(uptimeHistory.status, "down"))
      .orderBy(desc(uptimeHistory.timestamp))
      .limit(1);
    
    if (lastDown.length === 0) {
      // No downtime ever recorded, get first check
      const firstCheck = await db.select()
        .from(uptimeHistory)
        .orderBy(uptimeHistory.timestamp)
        .limit(1);
      
      if (firstCheck.length === 0) return { days: 0, since: null };
      
      const days = Math.floor((Date.now() - firstCheck[0].timestamp.getTime()) / (1000 * 60 * 60 * 24));
      return { days, since: firstCheck[0].timestamp };
    }
    
    const days = Math.floor((Date.now() - lastDown[0].timestamp.getTime()) / (1000 * 60 * 60 * 24));
    return { days, since: lastDown[0].timestamp };
  } catch (error) {
    console.error("[Uptime History] Failed to get streak:", error);
    return { days: 0, since: null };
  }
}

// Start uptime monitoring (check every 5 minutes)
let uptimeInterval: NodeJS.Timeout | null = null;

export function startUptimeMonitoring(): void {
  if (uptimeInterval) return;
  
  console.log("[Uptime History] Starting monitoring...");
  uptimeInterval = setInterval(performUptimeCheck, 5 * 60 * 1000); // Check every 5 minutes
  
  // Also run immediately on start
  performUptimeCheck();
}

export function stopUptimeMonitoring(): void {
  if (uptimeInterval) {
    clearInterval(uptimeInterval);
    uptimeInterval = null;
    console.log("[Uptime History] Monitoring stopped");
  }
}

// Router
export const uptimeHistoryRouter = router({
  // Get monthly stats for the last N months
  getMonthlyStats: protectedProcedure
    .input(z.object({ months: z.number().min(1).max(24).default(12) }))
    .query(async ({ input }) => {
      const now = new Date();
      const endMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      const startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - input.months + 1);
      const startMonth = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
      
      return await getMonthlyStatsRange(startMonth, endMonth);
    }),
  
  // Get recent checks
  getRecentChecks: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(500).default(100) }))
    .query(async ({ input }) => {
      return await getRecentChecks(input.limit);
    }),
  
  // Get current uptime streak
  getStreak: protectedProcedure.query(async () => {
    return await getCurrentStreak();
  }),
  
  // Get overall availability (all time)
  getOverallAvailability: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { availability: 100, totalChecks: 0 };
    
    try {
      const result = await db.select({
        totalChecks: sql<number>`SUM(${uptimeMonthlyStats.totalChecks})`,
        successfulChecks: sql<number>`SUM(${uptimeMonthlyStats.successfulChecks})`,
        totalDowntime: sql<number>`SUM(${uptimeMonthlyStats.totalDowntimeSeconds})`,
        totalIncidents: sql<number>`SUM(${uptimeMonthlyStats.incidentCount})`,
      })
      .from(uptimeMonthlyStats);
      
      const row = result[0];
      const totalChecks = Number(row?.totalChecks) || 0;
      const successfulChecks = Number(row?.successfulChecks) || 0;
      const availability = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 100;
      
      return {
        availability: Number(availability.toFixed(4)),
        totalChecks,
        successfulChecks,
        totalDowntimeSeconds: Number(row?.totalDowntime) || 0,
        totalIncidents: Number(row?.totalIncidents) || 0,
      };
    } catch (error) {
      console.error("[Uptime History] Failed to get overall availability:", error);
      return { availability: 100, totalChecks: 0 };
    }
  }),
  
  // Manual check trigger
  triggerCheck: protectedProcedure.mutation(async () => {
    const result = await performUptimeCheck();
    return result;
  }),
  
  // Public endpoint for status page
  getPublicStatus: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { status: "unknown", availability: 100 };
    
    try {
      // Get last check
      const lastCheck = await db.select()
        .from(uptimeHistory)
        .orderBy(desc(uptimeHistory.timestamp))
        .limit(1);
      
      // Get current month stats
      const now = new Date();
      const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const monthStats = await db.select()
        .from(uptimeMonthlyStats)
        .where(eq(uptimeMonthlyStats.yearMonth, yearMonth))
        .limit(1);
      
      return {
        status: lastCheck[0]?.status || "unknown",
        lastChecked: lastCheck[0]?.timestamp || null,
        responseTime: lastCheck[0]?.responseTime || null,
        monthlyAvailability: monthStats[0] ? Number(monthStats[0].availabilityPercentage) : 100,
      };
    } catch (error) {
      return { status: "unknown", availability: 100 };
    }
  }),
});

export type UptimeHistoryRouter = typeof uptimeHistoryRouter;
