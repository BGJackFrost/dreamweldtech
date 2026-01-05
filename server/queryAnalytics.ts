/**
 * Database Query Analytics Service
 * 
 * Tracks and analyzes database query performance.
 */

import { getDb } from "./db";
import { queryMetrics, queryDailyStats, InsertQueryMetric, InsertQueryDailyStat } from "../drizzle/schema";
import { eq, desc, and, gte, sql, like } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import crypto from "crypto";

// Buffer for query metrics
let queryBuffer: InsertQueryMetric[] = [];
const BUFFER_SIZE = 100;
const FLUSH_INTERVAL = 30 * 1000; // 30 seconds
const AGGREGATION_INTERVAL = 60 * 60 * 1000; // 1 hour

// Query tracking state
let isTracking = true;

/**
 * Generate hash for query grouping
 */
function generateQueryHash(queryType: string, tableName: string): string {
  const str = `${queryType}:${tableName}`;
  return crypto.createHash("md5").update(str).digest("hex").substring(0, 16);
}

/**
 * Track a database query
 */
export function trackQuery(
  queryType: string,
  tableName: string | null,
  executionTime: number,
  rowCount: number | null,
  isSuccess: boolean,
  errorMessage: string | null = null,
  callerEndpoint: string | null = null
): void {
  if (!isTracking) return;
  
  const now = new Date();
  
  queryBuffer.push({
    queryType: queryType.toUpperCase(),
    tableName,
    executionTime,
    rowCount,
    isSuccess: isSuccess ? "true" : "false",
    errorMessage,
    queryHash: generateQueryHash(queryType, tableName || "unknown"),
    callerEndpoint,
    dateKey: now.toISOString().split("T")[0],
  });
  
  if (queryBuffer.length >= BUFFER_SIZE) {
    flushQueryBuffer();
  }
}

/**
 * Flush query buffer to database
 */
async function flushQueryBuffer(): Promise<void> {
  if (queryBuffer.length === 0) return;
  
  try {
    const db = await getDb();
    const toFlush = queryBuffer.splice(0, queryBuffer.length);
    
    await db!.insert(queryMetrics).values(toFlush);
    console.log(`[Query Analytics] Flushed ${toFlush.length} records`);
  } catch (error) {
    console.error("[Query Analytics] Failed to flush buffer:", error);
  }
}

/**
 * Calculate percentile
 */
function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Aggregate daily stats
 */
async function aggregateDailyStats(): Promise<void> {
  try {
    const db = await getDb();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateKey = yesterday.toISOString().split("T")[0];
    
    // Get all queries for yesterday grouped by type and table
    const queries = await db!
      .select({
        queryType: queryMetrics.queryType,
        tableName: queryMetrics.tableName,
        executionTime: queryMetrics.executionTime,
        isSuccess: queryMetrics.isSuccess,
        rowCount: queryMetrics.rowCount,
      })
      .from(queryMetrics)
      .where(eq(queryMetrics.dateKey, dateKey));
    
    if (queries.length === 0) {
      console.log("[Query Analytics] No queries to aggregate for", dateKey);
      return;
    }
    
    // Group by queryType and tableName
    const groups = new Map<string, typeof queries>();
    
    for (const q of queries) {
      const key = `${q.queryType}:${q.tableName || "unknown"}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(q);
    }
    
    // Calculate stats for each group
    for (const [key, groupQueries] of Array.from(groups.entries())) {
      const [queryType, tableName] = key.split(":");
      const times = groupQueries.map((q: { executionTime: number }) => q.executionTime);
      const successCount = groupQueries.filter((q: { isSuccess: string }) => q.isSuccess === "true").length;
      const totalRows = groupQueries.reduce((sum: number, q: { rowCount: number | null }) => sum + (q.rowCount || 0), 0);
      
      // Check if stat already exists
      const existing = await db!
        .select()
        .from(queryDailyStats)
        .where(and(
          eq(queryDailyStats.dateKey, dateKey),
          eq(queryDailyStats.queryType, queryType),
          eq(queryDailyStats.tableName, tableName)
        ))
        .limit(1);
      
      const statData: InsertQueryDailyStat = {
        dateKey,
        queryType,
        tableName,
        totalQueries: groupQueries.length,
        successfulQueries: successCount,
        failedQueries: groupQueries.length - successCount,
        avgExecutionTime: Math.round(times.reduce((a: number, b: number) => a + b, 0) / times.length),
        minExecutionTime: Math.min(...times),
        maxExecutionTime: Math.max(...times),
        p50ExecutionTime: calculatePercentile(times, 50),
        p95ExecutionTime: calculatePercentile(times, 95),
        p99ExecutionTime: calculatePercentile(times, 99),
        totalRows,
      };
      
      if (existing.length === 0) {
        await db!.insert(queryDailyStats).values(statData);
      } else {
        await db!
          .update(queryDailyStats)
          .set(statData)
          .where(eq(queryDailyStats.id, existing[0].id));
      }
    }
    
    console.log(`[Query Analytics] Aggregated ${groups.size} query groups for ${dateKey}`);
  } catch (error) {
    console.error("[Query Analytics] Failed to aggregate stats:", error);
  }
}

/**
 * Start query analytics collection
 */
export function startQueryAnalytics(): void {
  console.log("[Query Analytics] Starting collection...");
  
  // Periodic flush
  setInterval(flushQueryBuffer, FLUSH_INTERVAL);
  
  // Daily aggregation (run at 1 AM)
  setInterval(() => {
    const now = new Date();
    if (now.getHours() === 1 && now.getMinutes() < 5) {
      aggregateDailyStats();
    }
  }, 5 * 60 * 1000); // Check every 5 minutes
}

/**
 * Query Analytics Router
 */
export const queryAnalyticsRouter = router({
  // Get overall stats
  getOverallStats: protectedProcedure
    .input(z.object({
      days: z.number().min(1).max(90).optional().default(7),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);
      const startDateKey = startDate.toISOString().split("T")[0];
      
      const stats = await db!
        .select({
          totalQueries: sql<number>`SUM(${queryDailyStats.totalQueries})`,
          successfulQueries: sql<number>`SUM(${queryDailyStats.successfulQueries})`,
          failedQueries: sql<number>`SUM(${queryDailyStats.failedQueries})`,
          avgExecutionTime: sql<number>`AVG(${queryDailyStats.avgExecutionTime})`,
          maxExecutionTime: sql<number>`MAX(${queryDailyStats.maxExecutionTime})`,
        })
        .from(queryDailyStats)
        .where(gte(queryDailyStats.dateKey, startDateKey));
      
      const uniqueTables = await db!
        .selectDistinct({ tableName: queryDailyStats.tableName })
        .from(queryDailyStats)
        .where(gte(queryDailyStats.dateKey, startDateKey));
      
      return {
        totalQueries: stats[0]?.totalQueries || 0,
        successfulQueries: stats[0]?.successfulQueries || 0,
        failedQueries: stats[0]?.failedQueries || 0,
        avgExecutionTime: Math.round(stats[0]?.avgExecutionTime || 0),
        maxExecutionTime: stats[0]?.maxExecutionTime || 0,
        uniqueTables: uniqueTables.length,
        errorRate: stats[0]?.totalQueries 
          ? ((stats[0].failedQueries / stats[0].totalQueries) * 100).toFixed(2)
          : "0.00",
      };
    }),
  
  // Get stats by query type
  getStatsByType: protectedProcedure
    .input(z.object({
      days: z.number().min(1).max(90).optional().default(7),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);
      const startDateKey = startDate.toISOString().split("T")[0];
      
      const stats = await db!
        .select({
          queryType: queryDailyStats.queryType,
          totalQueries: sql<number>`SUM(${queryDailyStats.totalQueries})`,
          avgExecutionTime: sql<number>`AVG(${queryDailyStats.avgExecutionTime})`,
          p95ExecutionTime: sql<number>`MAX(${queryDailyStats.p95ExecutionTime})`,
          failedQueries: sql<number>`SUM(${queryDailyStats.failedQueries})`,
        })
        .from(queryDailyStats)
        .where(gte(queryDailyStats.dateKey, startDateKey))
        .groupBy(queryDailyStats.queryType)
        .orderBy(sql`totalQueries DESC`);
      
      return stats.map(s => ({
        ...s,
        avgExecutionTime: Math.round(s.avgExecutionTime),
        errorRate: s.totalQueries > 0 
          ? ((s.failedQueries / s.totalQueries) * 100).toFixed(2)
          : "0.00",
      }));
    }),
  
  // Get stats by table
  getStatsByTable: protectedProcedure
    .input(z.object({
      days: z.number().min(1).max(90).optional().default(7),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);
      const startDateKey = startDate.toISOString().split("T")[0];
      
      const stats = await db!
        .select({
          tableName: queryDailyStats.tableName,
          totalQueries: sql<number>`SUM(${queryDailyStats.totalQueries})`,
          avgExecutionTime: sql<number>`AVG(${queryDailyStats.avgExecutionTime})`,
          p95ExecutionTime: sql<number>`MAX(${queryDailyStats.p95ExecutionTime})`,
          p99ExecutionTime: sql<number>`MAX(${queryDailyStats.p99ExecutionTime})`,
          totalRows: sql<number>`SUM(${queryDailyStats.totalRows})`,
        })
        .from(queryDailyStats)
        .where(gte(queryDailyStats.dateKey, startDateKey))
        .groupBy(queryDailyStats.tableName)
        .orderBy(sql`totalQueries DESC`)
        .limit(20);
      
      return stats.map(s => ({
        ...s,
        avgExecutionTime: Math.round(s.avgExecutionTime),
      }));
    }),
  
  // Get slowest queries
  getSlowestQueries: protectedProcedure
    .input(z.object({
      days: z.number().min(1).max(90).optional().default(7),
      limit: z.number().min(1).max(50).optional().default(10),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);
      const startDateKey = startDate.toISOString().split("T")[0];
      
      const queries = await db!
        .select({
          queryType: queryDailyStats.queryType,
          tableName: queryDailyStats.tableName,
          p95ExecutionTime: sql<number>`COALESCE(${queryDailyStats.p95ExecutionTime}, 0)`,
          p99ExecutionTime: sql<number>`COALESCE(${queryDailyStats.p99ExecutionTime}, 0)`,
          maxExecutionTime: sql<number>`COALESCE(${queryDailyStats.maxExecutionTime}, 0)`,
          totalQueries: sql<number>`COALESCE(${queryDailyStats.totalQueries}, 0)`,
        })
        .from(queryDailyStats)
        .where(gte(queryDailyStats.dateKey, startDateKey))
        .orderBy(desc(queryDailyStats.p95ExecutionTime))
        .limit(input.limit);
      
      return queries;
    }),
  
  // Get daily trend
  getDailyTrend: protectedProcedure
    .input(z.object({
      days: z.number().min(1).max(90).optional().default(7),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);
      const startDateKey = startDate.toISOString().split("T")[0];
      
      const trend = await db!
        .select({
          dateKey: queryDailyStats.dateKey,
          totalQueries: sql<number>`SUM(${queryDailyStats.totalQueries})`,
          avgExecutionTime: sql<number>`AVG(${queryDailyStats.avgExecutionTime})`,
          p95ExecutionTime: sql<number>`MAX(${queryDailyStats.p95ExecutionTime})`,
          failedQueries: sql<number>`SUM(${queryDailyStats.failedQueries})`,
        })
        .from(queryDailyStats)
        .where(gte(queryDailyStats.dateKey, startDateKey))
        .groupBy(queryDailyStats.dateKey)
        .orderBy(queryDailyStats.dateKey);
      
      return trend.map(t => ({
        ...t,
        avgExecutionTime: Math.round(t.avgExecutionTime),
      }));
    }),
  
  // Get recent queries (real-time)
  getRecentQueries: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).optional().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      
      const queries = await db!
        .select()
        .from(queryMetrics)
        .orderBy(desc(queryMetrics.timestamp))
        .limit(input.limit);
      
      return queries;
    }),
  
  // Trigger manual aggregation
  triggerAggregation: protectedProcedure.mutation(async () => {
    await aggregateDailyStats();
    return { success: true };
  }),
  
  // Toggle tracking
  toggleTracking: protectedProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(({ input }) => {
      isTracking = input.enabled;
      return { success: true, isTracking };
    }),
  
  // Get tracking status
  getTrackingStatus: protectedProcedure.query(() => {
    return { isTracking, bufferSize: queryBuffer.length };
  }),
});
