/**
 * Endpoint Metrics Service
 * 
 * Middleware and service for tracking API endpoint response times.
 * Provides detailed analytics including percentiles (p50, p95, p99).
 */

import { Request, Response, NextFunction } from "express";
import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { endpointMetrics, endpointDailyStats } from "../drizzle/schema";
import { eq, desc, and, gte, lte, sql, like } from "drizzle-orm";

// Types
export interface EndpointMetricData {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  isSuccess: boolean;
  errorMessage?: string;
  requestSize?: number;
  responseSize?: number;
  userAgent?: string;
  ipAddress?: string;
}

export interface EndpointStats {
  endpoint: string;
  method: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
}

// In-memory buffer for batch inserts
let metricsBuffer: EndpointMetricData[] = [];
const BUFFER_SIZE = 50; // Flush after 50 records
const FLUSH_INTERVAL = 30000; // Or every 30 seconds

// Endpoints to exclude from tracking
const EXCLUDED_ENDPOINTS = [
  "/api/health",
  "/api/health/simple",
  "/__vite",
  "/node_modules",
  "/src/",
  "/@",
  "/favicon",
  ".js",
  ".css",
  ".png",
  ".jpg",
  ".svg",
  ".woff",
  ".ttf",
];

/**
 * Check if endpoint should be tracked
 */
function shouldTrackEndpoint(path: string): boolean {
  return !EXCLUDED_ENDPOINTS.some(excluded => path.includes(excluded));
}

/**
 * Anonymize IP address (keep first 3 octets for IPv4, first 3 groups for IPv6)
 */
function anonymizeIp(ip: string): string {
  if (!ip) return "";
  
  // IPv4
  if (ip.includes(".")) {
    const parts = ip.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
  }
  
  // IPv6
  if (ip.includes(":")) {
    const parts = ip.split(":");
    if (parts.length >= 3) {
      return `${parts[0]}:${parts[1]}:${parts[2]}::`;
    }
  }
  
  return ip.substring(0, 20);
}

/**
 * Get date key in YYYY-MM-DD format
 */
function getDateKey(date: Date = new Date()): string {
  return date.toISOString().split("T")[0];
}

/**
 * Express middleware to track endpoint response times
 */
export function endpointMetricsMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip excluded endpoints
  if (!shouldTrackEndpoint(req.path)) {
    return next();
  }
  
  const startTime = Date.now();
  const requestSize = parseInt(req.headers["content-length"] || "0", 10);
  
  // Capture response
  const originalSend = res.send;
  let responseSize = 0;
  
  res.send = function(body: any) {
    if (body) {
      responseSize = typeof body === "string" ? body.length : JSON.stringify(body).length;
    }
    return originalSend.call(this, body);
  };
  
  // On response finish
  res.on("finish", () => {
    const responseTime = Date.now() - startTime;
    const statusCode = res.statusCode;
    const isSuccess = statusCode >= 200 && statusCode < 400;
    
    // Get real IP (handle proxies)
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() 
      || req.socket.remoteAddress 
      || "";
    
    const metricData: EndpointMetricData = {
      endpoint: req.path,
      method: req.method,
      responseTime,
      statusCode,
      isSuccess,
      requestSize,
      responseSize,
      userAgent: req.headers["user-agent"]?.substring(0, 500),
      ipAddress: anonymizeIp(ip),
    };
    
    // Add to buffer
    metricsBuffer.push(metricData);
    
    // Flush if buffer is full
    if (metricsBuffer.length >= BUFFER_SIZE) {
      flushMetricsBuffer();
    }
  });
  
  next();
}

/**
 * Flush metrics buffer to database
 */
async function flushMetricsBuffer(): Promise<void> {
  if (metricsBuffer.length === 0) return;
  
  const db = await getDb();
  if (!db) return;
  
  const dataToInsert = [...metricsBuffer];
  metricsBuffer = [];
  
  const now = new Date();
  const dateKey = getDateKey(now);
  const hourOfDay = now.getHours();
  
  try {
    // Batch insert
    await db.insert(endpointMetrics).values(
      dataToInsert.map(m => ({
        endpoint: m.endpoint,
        method: m.method,
        responseTime: m.responseTime,
        statusCode: m.statusCode,
        isSuccess: m.isSuccess ? "true" as const : "false" as const,
        errorMessage: m.errorMessage,
        requestSize: m.requestSize,
        responseSize: m.responseSize,
        userAgent: m.userAgent,
        ipAddress: m.ipAddress,
        dateKey,
        hourOfDay,
      }))
    );
    
    console.log(`[Endpoint Metrics] Flushed ${dataToInsert.length} records`);
  } catch (error) {
    console.error("[Endpoint Metrics] Failed to flush buffer:", error);
    // Re-add failed records to buffer
    metricsBuffer = [...dataToInsert, ...metricsBuffer].slice(0, BUFFER_SIZE * 2);
  }
}

/**
 * Calculate percentile from sorted array
 */
function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  
  const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, index)];
}

/**
 * Aggregate daily stats for an endpoint
 */
async function aggregateDailyStats(dateKey: string, endpoint: string, method: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  try {
    // Get all metrics for this endpoint on this date
    const metrics = await db.select({
      responseTime: endpointMetrics.responseTime,
      isSuccess: endpointMetrics.isSuccess,
      requestSize: endpointMetrics.requestSize,
      responseSize: endpointMetrics.responseSize,
    })
    .from(endpointMetrics)
    .where(and(
      eq(endpointMetrics.dateKey, dateKey),
      eq(endpointMetrics.endpoint, endpoint),
      eq(endpointMetrics.method, method)
    ));
    
    if (metrics.length === 0) return;
    
    // Calculate stats
    const responseTimes = metrics.map(m => m.responseTime).sort((a, b) => a - b);
    const totalRequests = metrics.length;
    const successfulRequests = metrics.filter(m => m.isSuccess === "true").length;
    const failedRequests = totalRequests - successfulRequests;
    
    const avgResponseTime = Math.round(responseTimes.reduce((a, b) => a + b, 0) / totalRequests);
    const minResponseTime = responseTimes[0];
    const maxResponseTime = responseTimes[responseTimes.length - 1];
    const p50ResponseTime = calculatePercentile(responseTimes, 50);
    const p95ResponseTime = calculatePercentile(responseTimes, 95);
    const p99ResponseTime = calculatePercentile(responseTimes, 99);
    const errorRate = ((failedRequests / totalRequests) * 100).toFixed(2);
    
    const totalRequestSize = metrics.reduce((sum, m) => sum + (m.requestSize || 0), 0);
    const totalResponseSize = metrics.reduce((sum, m) => sum + (m.responseSize || 0), 0);
    
    // Upsert daily stats
    const existing = await db.select()
      .from(endpointDailyStats)
      .where(and(
        eq(endpointDailyStats.dateKey, dateKey),
        eq(endpointDailyStats.endpoint, endpoint),
        eq(endpointDailyStats.method, method)
      ))
      .limit(1);
    
    if (existing.length > 0) {
      await db.update(endpointDailyStats)
        .set({
          totalRequests,
          successfulRequests,
          failedRequests,
          avgResponseTime,
          minResponseTime,
          maxResponseTime,
          p50ResponseTime,
          p95ResponseTime,
          p99ResponseTime,
          errorRate,
          totalRequestSize,
          totalResponseSize,
        })
        .where(eq(endpointDailyStats.id, existing[0].id));
    } else {
      await db.insert(endpointDailyStats).values({
        dateKey,
        endpoint,
        method,
        totalRequests,
        successfulRequests,
        failedRequests,
        avgResponseTime,
        minResponseTime,
        maxResponseTime,
        p50ResponseTime,
        p95ResponseTime,
        p99ResponseTime,
        errorRate,
        totalRequestSize,
        totalResponseSize,
      });
    }
  } catch (error) {
    console.error("[Endpoint Metrics] Failed to aggregate daily stats:", error);
  }
}

/**
 * Run daily aggregation for all endpoints
 */
async function runDailyAggregation(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateKey = getDateKey(yesterday);
  
  try {
    // Get unique endpoint/method combinations for yesterday
    const endpoints = await db.selectDistinct({
      endpoint: endpointMetrics.endpoint,
      method: endpointMetrics.method,
    })
    .from(endpointMetrics)
    .where(eq(endpointMetrics.dateKey, dateKey));
    
    console.log(`[Endpoint Metrics] Aggregating ${endpoints.length} endpoints for ${dateKey}`);
    
    for (const { endpoint, method } of endpoints) {
      await aggregateDailyStats(dateKey, endpoint, method);
    }
  } catch (error) {
    console.error("[Endpoint Metrics] Failed to run daily aggregation:", error);
  }
}

// Start periodic flush and aggregation
let flushInterval: NodeJS.Timeout | null = null;
let aggregationInterval: NodeJS.Timeout | null = null;

export function startEndpointMetricsCollection(): void {
  if (flushInterval) return;
  
  console.log("[Endpoint Metrics] Starting collection...");
  
  // Flush buffer every 30 seconds
  flushInterval = setInterval(flushMetricsBuffer, FLUSH_INTERVAL);
  
  // Run daily aggregation at midnight
  const now = new Date();
  const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
  
  setTimeout(() => {
    runDailyAggregation();
    aggregationInterval = setInterval(runDailyAggregation, 24 * 60 * 60 * 1000);
  }, msUntilMidnight);
}

export function stopEndpointMetricsCollection(): void {
  if (flushInterval) {
    clearInterval(flushInterval);
    flushInterval = null;
  }
  if (aggregationInterval) {
    clearInterval(aggregationInterval);
    aggregationInterval = null;
  }
  flushMetricsBuffer(); // Final flush
  console.log("[Endpoint Metrics] Collection stopped");
}

// Router
export const endpointMetricsRouter = router({
  // Get endpoint list with stats
  getEndpoints: protectedProcedure
    .input(z.object({
      days: z.number().min(1).max(90).default(7),
      search: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);
      const startDateKey = getDateKey(startDate);
      
      try {
        let query = db.select({
          endpoint: endpointDailyStats.endpoint,
          method: endpointDailyStats.method,
          totalRequests: sql<number>`SUM(${endpointDailyStats.totalRequests})`,
          successfulRequests: sql<number>`SUM(${endpointDailyStats.successfulRequests})`,
          failedRequests: sql<number>`SUM(${endpointDailyStats.failedRequests})`,
          avgResponseTime: sql<number>`AVG(${endpointDailyStats.avgResponseTime})`,
          minResponseTime: sql<number>`MIN(${endpointDailyStats.minResponseTime})`,
          maxResponseTime: sql<number>`MAX(${endpointDailyStats.maxResponseTime})`,
          p50ResponseTime: sql<number>`AVG(${endpointDailyStats.p50ResponseTime})`,
          p95ResponseTime: sql<number>`AVG(${endpointDailyStats.p95ResponseTime})`,
          p99ResponseTime: sql<number>`AVG(${endpointDailyStats.p99ResponseTime})`,
        })
        .from(endpointDailyStats)
        .where(gte(endpointDailyStats.dateKey, startDateKey))
        .groupBy(endpointDailyStats.endpoint, endpointDailyStats.method)
        .orderBy(desc(sql`SUM(${endpointDailyStats.totalRequests})`));
        
        const results = await query;
        
        // Filter by search if provided
        let filtered = results;
        if (input.search) {
          const searchLower = input.search.toLowerCase();
          filtered = results.filter(r => r.endpoint.toLowerCase().includes(searchLower));
        }
        
        return filtered.map(r => ({
          endpoint: r.endpoint,
          method: r.method,
          totalRequests: Number(r.totalRequests) || 0,
          successfulRequests: Number(r.successfulRequests) || 0,
          failedRequests: Number(r.failedRequests) || 0,
          avgResponseTime: Math.round(Number(r.avgResponseTime) || 0),
          minResponseTime: Number(r.minResponseTime) || 0,
          maxResponseTime: Number(r.maxResponseTime) || 0,
          p50ResponseTime: Math.round(Number(r.p50ResponseTime) || 0),
          p95ResponseTime: Math.round(Number(r.p95ResponseTime) || 0),
          p99ResponseTime: Math.round(Number(r.p99ResponseTime) || 0),
          errorRate: r.failedRequests && r.totalRequests 
            ? ((Number(r.failedRequests) / Number(r.totalRequests)) * 100).toFixed(2)
            : "0.00",
        }));
      } catch (error) {
        console.error("[Endpoint Metrics] Failed to get endpoints:", error);
        return [];
      }
    }),
  
  // Get endpoint detail with time series
  getEndpointDetail: protectedProcedure
    .input(z.object({
      endpoint: z.string(),
      method: z.string(),
      days: z.number().min(1).max(90).default(7),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);
      const startDateKey = getDateKey(startDate);
      
      try {
        // Get daily stats
        const dailyStats = await db.select()
          .from(endpointDailyStats)
          .where(and(
            eq(endpointDailyStats.endpoint, input.endpoint),
            eq(endpointDailyStats.method, input.method),
            gte(endpointDailyStats.dateKey, startDateKey)
          ))
          .orderBy(endpointDailyStats.dateKey);
        
        // Get hourly distribution for today
        const today = getDateKey();
        const hourlyData = await db.select({
          hour: endpointMetrics.hourOfDay,
          count: sql<number>`COUNT(*)`,
          avgTime: sql<number>`AVG(${endpointMetrics.responseTime})`,
        })
        .from(endpointMetrics)
        .where(and(
          eq(endpointMetrics.endpoint, input.endpoint),
          eq(endpointMetrics.method, input.method),
          eq(endpointMetrics.dateKey, today)
        ))
        .groupBy(endpointMetrics.hourOfDay)
        .orderBy(endpointMetrics.hourOfDay);
        
        // Get response time distribution
        const responseTimes = await db.select({
          responseTime: endpointMetrics.responseTime,
        })
        .from(endpointMetrics)
        .where(and(
          eq(endpointMetrics.endpoint, input.endpoint),
          eq(endpointMetrics.method, input.method),
          gte(endpointMetrics.dateKey, startDateKey)
        ))
        .limit(10000);
        
        // Create distribution buckets
        const buckets = [0, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
        const distribution = buckets.map((bucket, i) => {
          const nextBucket = buckets[i + 1] || Infinity;
          const count = responseTimes.filter(r => 
            r.responseTime >= bucket && r.responseTime < nextBucket
          ).length;
          return {
            range: nextBucket === Infinity ? `${bucket}ms+` : `${bucket}-${nextBucket}ms`,
            count,
          };
        });
        
        return {
          endpoint: input.endpoint,
          method: input.method,
          dailyStats: dailyStats.map(s => ({
            date: s.dateKey,
            totalRequests: s.totalRequests || 0,
            avgResponseTime: s.avgResponseTime || 0,
            p50ResponseTime: s.p50ResponseTime || 0,
            p95ResponseTime: s.p95ResponseTime || 0,
            p99ResponseTime: s.p99ResponseTime || 0,
            errorRate: Number(s.errorRate) || 0,
          })),
          hourlyDistribution: hourlyData.map(h => ({
            hour: h.hour,
            count: Number(h.count) || 0,
            avgTime: Math.round(Number(h.avgTime) || 0),
          })),
          responseTimeDistribution: distribution,
        };
      } catch (error) {
        console.error("[Endpoint Metrics] Failed to get endpoint detail:", error);
        return null;
      }
    }),
  
  // Get slowest endpoints
  getSlowestEndpoints: protectedProcedure
    .input(z.object({
      days: z.number().min(1).max(90).default(7),
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);
      const startDateKey = getDateKey(startDate);
      
      try {
        const results = await db.select({
          endpoint: endpointDailyStats.endpoint,
          method: endpointDailyStats.method,
          avgResponseTime: sql<number>`AVG(${endpointDailyStats.avgResponseTime})`,
          p95ResponseTime: sql<number>`AVG(${endpointDailyStats.p95ResponseTime})`,
          totalRequests: sql<number>`SUM(${endpointDailyStats.totalRequests})`,
        })
        .from(endpointDailyStats)
        .where(gte(endpointDailyStats.dateKey, startDateKey))
        .groupBy(endpointDailyStats.endpoint, endpointDailyStats.method)
        .orderBy(desc(sql`AVG(${endpointDailyStats.p95ResponseTime})`))
        .limit(input.limit);
        
        return results.map(r => ({
          endpoint: r.endpoint,
          method: r.method,
          avgResponseTime: Math.round(Number(r.avgResponseTime) || 0),
          p95ResponseTime: Math.round(Number(r.p95ResponseTime) || 0),
          totalRequests: Number(r.totalRequests) || 0,
        }));
      } catch (error) {
        console.error("[Endpoint Metrics] Failed to get slowest endpoints:", error);
        return [];
      }
    }),
  
  // Get endpoints with highest error rate
  getErrorProneEndpoints: protectedProcedure
    .input(z.object({
      days: z.number().min(1).max(90).default(7),
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);
      const startDateKey = getDateKey(startDate);
      
      try {
        const results = await db.select({
          endpoint: endpointDailyStats.endpoint,
          method: endpointDailyStats.method,
          totalRequests: sql<number>`SUM(${endpointDailyStats.totalRequests})`,
          failedRequests: sql<number>`SUM(${endpointDailyStats.failedRequests})`,
        })
        .from(endpointDailyStats)
        .where(gte(endpointDailyStats.dateKey, startDateKey))
        .groupBy(endpointDailyStats.endpoint, endpointDailyStats.method)
        .having(sql`SUM(${endpointDailyStats.failedRequests}) > 0`)
        .orderBy(desc(sql`SUM(${endpointDailyStats.failedRequests}) / SUM(${endpointDailyStats.totalRequests})`))
        .limit(input.limit);
        
        return results.map(r => ({
          endpoint: r.endpoint,
          method: r.method,
          totalRequests: Number(r.totalRequests) || 0,
          failedRequests: Number(r.failedRequests) || 0,
          errorRate: r.totalRequests 
            ? ((Number(r.failedRequests) / Number(r.totalRequests)) * 100).toFixed(2)
            : "0.00",
        }));
      } catch (error) {
        console.error("[Endpoint Metrics] Failed to get error prone endpoints:", error);
        return [];
      }
    }),
  
  // Get overall API stats
  getOverallStats: protectedProcedure
    .input(z.object({
      days: z.number().min(1).max(90).default(7),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);
      const startDateKey = getDateKey(startDate);
      
      try {
        const result = await db.select({
          totalRequests: sql<number>`SUM(${endpointDailyStats.totalRequests})`,
          successfulRequests: sql<number>`SUM(${endpointDailyStats.successfulRequests})`,
          failedRequests: sql<number>`SUM(${endpointDailyStats.failedRequests})`,
          avgResponseTime: sql<number>`AVG(${endpointDailyStats.avgResponseTime})`,
          uniqueEndpoints: sql<number>`COUNT(DISTINCT ${endpointDailyStats.endpoint})`,
        })
        .from(endpointDailyStats)
        .where(gte(endpointDailyStats.dateKey, startDateKey));
        
        const row = result[0];
        
        return {
          totalRequests: Number(row?.totalRequests) || 0,
          successfulRequests: Number(row?.successfulRequests) || 0,
          failedRequests: Number(row?.failedRequests) || 0,
          avgResponseTime: Math.round(Number(row?.avgResponseTime) || 0),
          uniqueEndpoints: Number(row?.uniqueEndpoints) || 0,
          errorRate: row?.totalRequests 
            ? ((Number(row.failedRequests) / Number(row.totalRequests)) * 100).toFixed(2)
            : "0.00",
        };
      } catch (error) {
        console.error("[Endpoint Metrics] Failed to get overall stats:", error);
        return null;
      }
    }),
  
  // Trigger manual aggregation
  triggerAggregation: protectedProcedure.mutation(async () => {
    await flushMetricsBuffer();
    await runDailyAggregation();
    return { success: true };
  }),
});

export type EndpointMetricsRouter = typeof endpointMetricsRouter;
