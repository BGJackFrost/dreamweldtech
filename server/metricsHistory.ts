/**
 * Metrics History Service
 * Saves and retrieves historical server metrics for reporting
 */

import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { metricsHistory } from "../drizzle/schema";
import { eq, gte, lte, and, desc, sql } from "drizzle-orm";
import os from "os";

// In-memory metrics for current session
let currentMetrics = {
  totalRequests: 0,
  errorCount: 0,
  totalResponseTime: 0,
  requestsPerMinute: 0,
  startTime: Date.now(),
};

// Get current system metrics
function getSystemMetrics() {
  const cpus = os.cpus();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  
  let totalIdle = 0;
  let totalTick = 0;
  
  for (const cpu of cpus) {
    for (const type in cpu.times) {
      totalTick += cpu.times[type as keyof typeof cpu.times];
    }
    totalIdle += cpu.times.idle;
  }
  
  const cpuUsage = Math.round((1 - totalIdle / totalTick) * 100);
  const memoryUsage = Math.round((usedMemory / totalMemory) * 100);
  
  return {
    cpuUsage,
    memoryUsage,
    memoryTotal: totalMemory,
    memoryUsed: usedMemory,
    loadAverage: os.loadavg(),
    uptime: os.uptime(),
    hostname: os.hostname(),
  };
}

// Get current app metrics
function getAppMetrics() {
  const avgResponseTime = currentMetrics.totalRequests > 0 
    ? Math.round(currentMetrics.totalResponseTime / currentMetrics.totalRequests) 
    : 0;
  const errorRate = currentMetrics.totalRequests > 0 
    ? Math.round((currentMetrics.errorCount / currentMetrics.totalRequests) * 100 * 100) / 100 
    : 0;
  
  return {
    totalRequests: currentMetrics.totalRequests,
    errorCount: currentMetrics.errorCount,
    errorRate,
    avgResponseTime,
    requestsPerMinute: currentMetrics.requestsPerMinute,
  };
}

/**
 * Save current metrics to database
 */
export async function saveMetricsSnapshot(aggregationType: "raw" | "hourly" | "daily" | "weekly" | "monthly" = "raw"): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;
    
    const system = getSystemMetrics();
    const app = getAppMetrics();
    
    await db.insert(metricsHistory).values({
      cpuUsage: system.cpuUsage,
      memoryUsage: system.memoryUsage,
      memoryTotal: system.memoryTotal,
      memoryUsed: system.memoryUsed,
      loadAvg1m: system.loadAverage[0]?.toFixed(2) || "0",
      loadAvg5m: system.loadAverage[1]?.toFixed(2) || "0",
      loadAvg15m: system.loadAverage[2]?.toFixed(2) || "0",
      totalRequests: app.totalRequests,
      errorCount: app.errorCount,
      errorRate: app.errorRate.toFixed(2),
      avgResponseTime: app.avgResponseTime,
      requestsPerMinute: app.requestsPerMinute,
      hostname: system.hostname,
      uptime: system.uptime,
      aggregationType,
    });
    
    console.log(`[Metrics History] Saved ${aggregationType} snapshot`);
    return true;
  } catch (error) {
    console.error("[Metrics History] Failed to save snapshot:", error);
    return false;
  }
}

/**
 * Start periodic metrics collection
 */
let metricsInterval: NodeJS.Timeout | null = null;

export function startMetricsCollection(intervalMs: number = 5 * 60 * 1000): void {
  if (metricsInterval) {
    clearInterval(metricsInterval);
  }
  
  // Save initial snapshot
  saveMetricsSnapshot("raw");
  
  // Save snapshot every interval
  metricsInterval = setInterval(() => {
    saveMetricsSnapshot("raw");
  }, intervalMs);
  
  console.log(`[Metrics History] Started collection every ${intervalMs / 1000}s`);
}

export function stopMetricsCollection(): void {
  if (metricsInterval) {
    clearInterval(metricsInterval);
    metricsInterval = null;
    console.log("[Metrics History] Stopped collection");
  }
}

// Metrics History Router
export const metricsHistoryRouter = router({
  // Get metrics history with filters
  getHistory: protectedProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      aggregationType: z.enum(["raw", "hourly", "daily", "weekly", "monthly"]).optional(),
      limit: z.number().min(1).max(1000).default(100),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const conditions = [];
      
      if (input.startDate) {
        conditions.push(gte(metricsHistory.timestamp, new Date(input.startDate)));
      }
      
      if (input.endDate) {
        conditions.push(lte(metricsHistory.timestamp, new Date(input.endDate)));
      }
      
      if (input.aggregationType) {
        conditions.push(eq(metricsHistory.aggregationType, input.aggregationType));
      }
      
      const query = conditions.length > 0
        ? db.select().from(metricsHistory).where(and(...conditions)).orderBy(desc(metricsHistory.timestamp)).limit(input.limit)
        : db.select().from(metricsHistory).orderBy(desc(metricsHistory.timestamp)).limit(input.limit);
      
      return await query;
    }),
  
  // Get aggregated report
  getReport: protectedProcedure
    .input(z.object({
      period: z.enum(["day", "week", "month"]),
      startDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      
      const now = new Date();
      let startDate: Date;
      
      if (input.startDate) {
        startDate = new Date(input.startDate);
      } else {
        switch (input.period) {
          case "day":
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case "week":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "month":
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        }
      }
      
      const metrics = await db.select().from(metricsHistory)
        .where(gte(metricsHistory.timestamp, startDate))
        .orderBy(desc(metricsHistory.timestamp));
      
      if (metrics.length === 0) {
        return {
          period: input.period,
          startDate: startDate.toISOString(),
          endDate: now.toISOString(),
          dataPoints: 0,
          summary: null,
        };
      }
      
      // Calculate aggregates
      const cpuValues = metrics.map(m => m.cpuUsage);
      const memoryValues = metrics.map(m => m.memoryUsage);
      const responseTimeValues = metrics.map(m => m.avgResponseTime || 0);
      const errorRateValues = metrics.map(m => parseFloat(m.errorRate || "0"));
      
      const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
      const max = (arr: number[]) => arr.length > 0 ? Math.max(...arr) : 0;
      const min = (arr: number[]) => arr.length > 0 ? Math.min(...arr) : 0;
      
      return {
        period: input.period,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        dataPoints: metrics.length,
        summary: {
          cpu: {
            avg: Math.round(avg(cpuValues)),
            max: max(cpuValues),
            min: min(cpuValues),
          },
          memory: {
            avg: Math.round(avg(memoryValues)),
            max: max(memoryValues),
            min: min(memoryValues),
          },
          responseTime: {
            avg: Math.round(avg(responseTimeValues)),
            max: max(responseTimeValues),
            min: min(responseTimeValues),
          },
          errorRate: {
            avg: Math.round(avg(errorRateValues) * 100) / 100,
            max: Math.round(max(errorRateValues) * 100) / 100,
            min: Math.round(min(errorRateValues) * 100) / 100,
          },
          totalRequests: metrics.reduce((sum, m) => sum + (m.totalRequests || 0), 0),
          totalErrors: metrics.reduce((sum, m) => sum + (m.errorCount || 0), 0),
        },
        // Return last 100 data points for chart
        chartData: metrics.slice(0, 100).reverse().map(m => ({
          timestamp: m.timestamp,
          cpu: m.cpuUsage,
          memory: m.memoryUsage,
          responseTime: m.avgResponseTime,
          errorRate: parseFloat(m.errorRate || "0"),
        })),
      };
    }),
  
  // Manually save snapshot
  saveSnapshot: protectedProcedure.mutation(async () => {
    const result = await saveMetricsSnapshot("raw");
    return { success: result };
  }),
  
  // Start/stop collection
  toggleCollection: protectedProcedure
    .input(z.object({ enabled: z.boolean(), intervalSeconds: z.number().min(60).default(300) }))
    .mutation(({ input }) => {
      if (input.enabled) {
        startMetricsCollection(input.intervalSeconds * 1000);
      } else {
        stopMetricsCollection();
      }
      return { success: true, enabled: input.enabled };
    }),
  
  // Delete old metrics
  cleanup: protectedProcedure
    .input(z.object({ olderThanDays: z.number().min(1).default(30) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false, deleted: 0 };
      
      const cutoffDate = new Date(Date.now() - input.olderThanDays * 24 * 60 * 60 * 1000);
      
      const result = await db.delete(metricsHistory)
        .where(lte(metricsHistory.timestamp, cutoffDate));
      
      return { success: true, deleted: result[0]?.affectedRows || 0 };
    }),
});

export type MetricsHistoryRouter = typeof metricsHistoryRouter;
