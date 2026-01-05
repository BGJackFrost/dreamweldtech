/**
 * Rate Limiting Service
 * 
 * Provides configurable per-endpoint rate limiting with usage tracking.
 */

import { getDb } from "./db";
import { rateLimitConfig, rateLimitUsage, InsertRateLimitConfig, InsertRateLimitUsage } from "../drizzle/schema";
import { eq, desc, and, gte, sql, like } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

// In-memory cache for rate limit configs (refreshed periodically)
let configCache: Map<string, RateLimitConfigItem> = new Map();
let lastConfigRefresh = 0;
const CONFIG_REFRESH_INTERVAL = 60 * 1000; // 1 minute

// In-memory request counters (per IP per endpoint)
const requestCounters: Map<string, { count: number; windowStart: number; blocked: boolean; blockUntil: number }> = new Map();

interface RateLimitConfigItem {
  id: number;
  endpointPattern: string;
  maxRequests: number;
  windowSeconds: number;
  isEnabled: boolean;
  blockDurationSeconds: number;
  errorMessage: string | null;
  priority: number;
}

// Default rate limit configs
const DEFAULT_CONFIGS: Omit<InsertRateLimitConfig, "id" | "createdAt" | "updatedAt">[] = [
  {
    endpointPattern: "/api/trpc/*",
    maxRequests: 100,
    windowSeconds: 60,
    isEnabled: "true",
    blockDurationSeconds: 60,
    priority: 100,
    description: "Default rate limit for all tRPC endpoints",
  },
  {
    endpointPattern: "/api/upload",
    maxRequests: 10,
    windowSeconds: 60,
    isEnabled: "true",
    blockDurationSeconds: 120,
    priority: 50,
    description: "Stricter limit for file uploads",
  },
  {
    endpointPattern: "/api/oauth/*",
    maxRequests: 20,
    windowSeconds: 60,
    isEnabled: "true",
    blockDurationSeconds: 300,
    priority: 30,
    description: "Authentication endpoints",
  },
  {
    endpointPattern: "/api/health*",
    maxRequests: 1000,
    windowSeconds: 60,
    isEnabled: "true",
    blockDurationSeconds: 0,
    priority: 10,
    description: "Health check endpoints (high limit)",
  },
];

/**
 * Initialize default rate limit configs
 */
export async function initializeRateLimitConfigs(): Promise<void> {
  try {
    const db = await getDb();
    
    for (const config of DEFAULT_CONFIGS) {
      const existing = await db!
        .select()
        .from(rateLimitConfig)
        .where(eq(rateLimitConfig.endpointPattern, config.endpointPattern))
        .limit(1);
      
      if (existing.length === 0) {
        await db!.insert(rateLimitConfig).values(config);
        console.log(`[Rate Limit] Created default config for ${config.endpointPattern}`);
      }
    }
    
    await refreshConfigCache();
    console.log("[Rate Limit] Initialized with", configCache.size, "configs");
  } catch (error) {
    console.error("[Rate Limit] Failed to initialize configs:", error);
  }
}

/**
 * Refresh config cache from database
 */
async function refreshConfigCache(): Promise<void> {
  try {
    const db = await getDb();
    const configs = await db!
      .select()
      .from(rateLimitConfig)
      .where(eq(rateLimitConfig.isEnabled, "true"))
      .orderBy(rateLimitConfig.priority);
    
    configCache.clear();
    for (const config of configs) {
      configCache.set(config.endpointPattern, {
        id: config.id,
        endpointPattern: config.endpointPattern,
        maxRequests: config.maxRequests,
        windowSeconds: config.windowSeconds,
        isEnabled: config.isEnabled === "true",
        blockDurationSeconds: config.blockDurationSeconds || 60,
        errorMessage: config.errorMessage,
        priority: config.priority || 100,
      });
    }
    
    lastConfigRefresh = Date.now();
  } catch (error) {
    console.error("[Rate Limit] Failed to refresh config cache:", error);
  }
}

/**
 * Match endpoint to config pattern
 */
function matchEndpointToConfig(endpoint: string): RateLimitConfigItem | null {
  // Refresh cache if stale
  if (Date.now() - lastConfigRefresh > CONFIG_REFRESH_INTERVAL) {
    refreshConfigCache();
  }
  
  // Sort by priority and find first match
  const sortedConfigs = Array.from(configCache.values()).sort((a, b) => a.priority - b.priority);
  
  for (const config of sortedConfigs) {
    const pattern = config.endpointPattern
      .replace(/\*/g, ".*")
      .replace(/\?/g, ".");
    
    const regex = new RegExp(`^${pattern}$`);
    if (regex.test(endpoint)) {
      return config;
    }
  }
  
  return null;
}

/**
 * Get client IP from request
 */
function getClientIP(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "unknown";
}

/**
 * Anonymize IP for storage
 */
function anonymizeIP(ip: string): string {
  if (ip.includes(":")) {
    // IPv6
    const parts = ip.split(":");
    return `${parts[0]}:${parts[1]}:${parts[2]}::`;
  } else {
    // IPv4
    const parts = ip.split(".");
    return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  }
}

// Buffer for usage records
let usageBuffer: InsertRateLimitUsage[] = [];
const BUFFER_SIZE = 100;
const FLUSH_INTERVAL = 30 * 1000; // 30 seconds

/**
 * Flush usage buffer to database
 */
async function flushUsageBuffer(): Promise<void> {
  if (usageBuffer.length === 0) return;
  
  try {
    const db = await getDb();
    const toFlush = usageBuffer.splice(0, usageBuffer.length);
    
    await db!.insert(rateLimitUsage).values(toFlush);
    console.log(`[Rate Limit] Flushed ${toFlush.length} usage records`);
  } catch (error) {
    console.error("[Rate Limit] Failed to flush usage buffer:", error);
  }
}

// Start periodic flush
setInterval(flushUsageBuffer, FLUSH_INTERVAL);

/**
 * Track rate limit usage
 */
function trackUsage(
  endpoint: string,
  ip: string,
  wasBlocked: boolean,
  requestCount: number,
  configId: number | null
): void {
  const now = new Date();
  
  usageBuffer.push({
    endpoint,
    ipAddress: anonymizeIP(ip),
    wasBlocked: wasBlocked ? "true" : "false",
    requestCount,
    configId,
    dateKey: now.toISOString().split("T")[0],
    hourOfDay: now.getHours(),
  });
  
  if (usageBuffer.length >= BUFFER_SIZE) {
    flushUsageBuffer();
  }
}

/**
 * Rate limiting middleware
 */
export function rateLimitingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const endpoint = req.path;
  const ip = getClientIP(req);
  const config = matchEndpointToConfig(endpoint);
  
  // No config = no rate limiting
  if (!config) {
    next();
    return;
  }
  
  const key = `${ip}:${config.endpointPattern}`;
  const now = Date.now();
  
  let counter = requestCounters.get(key);
  
  // Check if blocked
  if (counter && counter.blocked && counter.blockUntil > now) {
    trackUsage(endpoint, ip, true, counter.count, config.id);
    
    res.status(429).json({
      error: config.errorMessage || "Too many requests. Please try again later.",
      retryAfter: Math.ceil((counter.blockUntil - now) / 1000),
    });
    return;
  }
  
  // Initialize or reset counter
  if (!counter || now - counter.windowStart > config.windowSeconds * 1000) {
    counter = {
      count: 0,
      windowStart: now,
      blocked: false,
      blockUntil: 0,
    };
  }
  
  counter.count++;
  
  // Check if limit exceeded
  if (counter.count > config.maxRequests) {
    counter.blocked = true;
    counter.blockUntil = now + config.blockDurationSeconds * 1000;
    requestCounters.set(key, counter);
    
    trackUsage(endpoint, ip, true, counter.count, config.id);
    
    res.status(429).json({
      error: config.errorMessage || "Rate limit exceeded. Please try again later.",
      retryAfter: config.blockDurationSeconds,
    });
    return;
  }
  
  requestCounters.set(key, counter);
  trackUsage(endpoint, ip, false, counter.count, config.id);
  
  // Add rate limit headers
  res.setHeader("X-RateLimit-Limit", config.maxRequests);
  res.setHeader("X-RateLimit-Remaining", Math.max(0, config.maxRequests - counter.count));
  res.setHeader("X-RateLimit-Reset", Math.ceil((counter.windowStart + config.windowSeconds * 1000) / 1000));
  
  next();
}

/**
 * Rate Limiting Router
 */
export const rateLimitingRouter = router({
  // Get all configs
  getConfigs: protectedProcedure.query(async () => {
    const db = await getDb();
    const configs = await db!
      .select()
      .from(rateLimitConfig)
      .orderBy(rateLimitConfig.priority);
    
    return configs;
  }),
  
  // Create new config
  createConfig: protectedProcedure
    .input(z.object({
      endpointPattern: z.string().min(1),
      maxRequests: z.number().min(1).max(10000),
      windowSeconds: z.number().min(1).max(3600),
      isEnabled: z.boolean().optional().default(true),
      blockDurationSeconds: z.number().min(0).max(86400).optional().default(60),
      errorMessage: z.string().optional(),
      priority: z.number().min(1).max(1000).optional().default(100),
      description: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      
      await db!.insert(rateLimitConfig).values({
        ...input,
        isEnabled: input.isEnabled ? "true" : "false",
      });
      
      await refreshConfigCache();
      
      return { success: true };
    }),
  
  // Update config
  updateConfig: protectedProcedure
    .input(z.object({
      id: z.number(),
      maxRequests: z.number().min(1).max(10000).optional(),
      windowSeconds: z.number().min(1).max(3600).optional(),
      isEnabled: z.boolean().optional(),
      blockDurationSeconds: z.number().min(0).max(86400).optional(),
      errorMessage: z.string().nullable().optional(),
      priority: z.number().min(1).max(1000).optional(),
      description: z.string().nullable().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, isEnabled, ...rest } = input;
      
      const updateData: Record<string, unknown> = { ...rest };
      if (isEnabled !== undefined) {
        updateData.isEnabled = isEnabled ? "true" : "false";
      }
      
      await db!
        .update(rateLimitConfig)
        .set(updateData)
        .where(eq(rateLimitConfig.id, id));
      
      await refreshConfigCache();
      
      return { success: true };
    }),
  
  // Delete config
  deleteConfig: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      
      await db!.delete(rateLimitConfig).where(eq(rateLimitConfig.id, input.id));
      await refreshConfigCache();
      
      return { success: true };
    }),
  
  // Get usage stats
  getUsageStats: protectedProcedure
    .input(z.object({
      days: z.number().min(1).max(90).optional().default(7),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);
      const startDateKey = startDate.toISOString().split("T")[0];
      
      // Get total requests and blocks
      const totals = await db!
        .select({
          totalRequests: sql<number>`COUNT(*)`,
          blockedRequests: sql<number>`SUM(CASE WHEN ${rateLimitUsage.wasBlocked} = 'true' THEN 1 ELSE 0 END)`,
        })
        .from(rateLimitUsage)
        .where(gte(rateLimitUsage.dateKey, startDateKey));
      
      // Get daily breakdown
      const daily = await db!
        .select({
          dateKey: rateLimitUsage.dateKey,
          totalRequests: sql<number>`COUNT(*)`,
          blockedRequests: sql<number>`SUM(CASE WHEN ${rateLimitUsage.wasBlocked} = 'true' THEN 1 ELSE 0 END)`,
        })
        .from(rateLimitUsage)
        .where(gte(rateLimitUsage.dateKey, startDateKey))
        .groupBy(rateLimitUsage.dateKey)
        .orderBy(rateLimitUsage.dateKey);
      
      // Get top blocked endpoints
      const topBlocked = await db!
        .select({
          endpoint: rateLimitUsage.endpoint,
          blockedCount: sql<number>`SUM(CASE WHEN ${rateLimitUsage.wasBlocked} = 'true' THEN 1 ELSE 0 END)`,
        })
        .from(rateLimitUsage)
        .where(gte(rateLimitUsage.dateKey, startDateKey))
        .groupBy(rateLimitUsage.endpoint)
        .orderBy(sql`blockedCount DESC`)
        .limit(10);
      
      // Get hourly distribution
      const hourly = await db!
        .select({
          hour: rateLimitUsage.hourOfDay,
          totalRequests: sql<number>`COUNT(*)`,
          blockedRequests: sql<number>`SUM(CASE WHEN ${rateLimitUsage.wasBlocked} = 'true' THEN 1 ELSE 0 END)`,
        })
        .from(rateLimitUsage)
        .where(gte(rateLimitUsage.dateKey, startDateKey))
        .groupBy(rateLimitUsage.hourOfDay)
        .orderBy(rateLimitUsage.hourOfDay);
      
      return {
        totalRequests: totals[0]?.totalRequests || 0,
        blockedRequests: totals[0]?.blockedRequests || 0,
        blockRate: totals[0]?.totalRequests 
          ? ((totals[0].blockedRequests / totals[0].totalRequests) * 100).toFixed(2)
          : "0.00",
        daily,
        topBlocked: topBlocked.filter(e => e.blockedCount > 0),
        hourly,
      };
    }),
  
  // Get per-endpoint stats
  getEndpointStats: protectedProcedure
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
          endpoint: rateLimitUsage.endpoint,
          totalRequests: sql<number>`COUNT(*)`,
          blockedRequests: sql<number>`SUM(CASE WHEN ${rateLimitUsage.wasBlocked} = 'true' THEN 1 ELSE 0 END)`,
          avgRequestsPerHour: sql<number>`COUNT(*) / ${input.days * 24}`,
        })
        .from(rateLimitUsage)
        .where(gte(rateLimitUsage.dateKey, startDateKey))
        .groupBy(rateLimitUsage.endpoint)
        .orderBy(sql`totalRequests DESC`)
        .limit(50);
      
      return stats.map(s => ({
        ...s,
        blockRate: s.totalRequests > 0 
          ? ((s.blockedRequests / s.totalRequests) * 100).toFixed(2)
          : "0.00",
      }));
    }),
  
  // Force refresh config cache
  refreshCache: protectedProcedure.mutation(async () => {
    await refreshConfigCache();
    return { success: true, configCount: configCache.size };
  }),
});

// Export for initialization
export { refreshConfigCache };
