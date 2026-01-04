/**
 * Alert Thresholds Service
 * 
 * Manages customizable alert thresholds stored in the database.
 * Allows admin to configure warning/critical levels for each metric.
 */

import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { alertThresholds } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// Default thresholds (used when database is empty or unavailable)
export const DEFAULT_ALERT_THRESHOLDS = {
  cpu: {
    warning: 70,
    critical: 90,
    unit: "%",
    description: "Mức sử dụng CPU của máy chủ",
    cooldownMinutes: 15,
  },
  memory: {
    warning: 80,
    critical: 95,
    unit: "%",
    description: "Mức sử dụng bộ nhớ RAM",
    cooldownMinutes: 15,
  },
  disk: {
    warning: 80,
    critical: 95,
    unit: "%",
    description: "Mức sử dụng ổ đĩa",
    cooldownMinutes: 30,
  },
  responseTime: {
    warning: 500,
    critical: 1000,
    unit: "ms",
    description: "Thời gian phản hồi trung bình của API",
    cooldownMinutes: 10,
  },
  errorRate: {
    warning: 5,
    critical: 10,
    unit: "%",
    description: "Tỷ lệ lỗi của các request",
    cooldownMinutes: 15,
  },
};

export type MetricName = keyof typeof DEFAULT_ALERT_THRESHOLDS;

export interface ThresholdConfig {
  metricName: string;
  warningThreshold: number;
  criticalThreshold: number;
  unit: string;
  description: string;
  isEnabled: boolean;
  cooldownMinutes: number;
  lastAlertAt: Date | null;
}

// Cache for thresholds (refresh every 5 minutes)
let thresholdsCache: ThresholdConfig[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Initialize default thresholds in database if not exists
 */
export async function initializeDefaultThresholds(): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;
    
    for (const [metricName, config] of Object.entries(DEFAULT_ALERT_THRESHOLDS)) {
      const existing = await db.select()
        .from(alertThresholds)
        .where(eq(alertThresholds.metricName, metricName))
        .limit(1);
      
      if (existing.length === 0) {
        await db.insert(alertThresholds).values({
          metricName,
          warningThreshold: config.warning,
          criticalThreshold: config.critical,
          unit: config.unit,
          description: config.description,
          isEnabled: "true",
          cooldownMinutes: config.cooldownMinutes,
        });
        console.log(`[Alert Thresholds] Initialized default for: ${metricName}`);
      }
    }
  } catch (error) {
    console.error("[Alert Thresholds] Failed to initialize defaults:", error);
  }
}

/**
 * Get all thresholds from database with caching
 */
export async function getAllThresholds(): Promise<ThresholdConfig[]> {
  // Check cache
  if (thresholdsCache && Date.now() - cacheTimestamp < CACHE_TTL) {
    return thresholdsCache;
  }
  
  try {
    const db = await getDb();
    if (!db) {
      // Return defaults if database unavailable
      return Object.entries(DEFAULT_ALERT_THRESHOLDS).map(([name, config]) => ({
        metricName: name,
        warningThreshold: config.warning,
        criticalThreshold: config.critical,
        unit: config.unit,
        description: config.description,
        isEnabled: true,
        cooldownMinutes: config.cooldownMinutes,
        lastAlertAt: null,
      }));
    }
    
    const results = await db.select().from(alertThresholds);
    
    // Map to ThresholdConfig
    thresholdsCache = results.map(r => ({
      metricName: r.metricName,
      warningThreshold: r.warningThreshold,
      criticalThreshold: r.criticalThreshold,
      unit: r.unit || "%",
      description: r.description || "",
      isEnabled: r.isEnabled === "true",
      cooldownMinutes: r.cooldownMinutes || 15,
      lastAlertAt: r.lastAlertAt,
    }));
    
    cacheTimestamp = Date.now();
    return thresholdsCache;
  } catch (error) {
    console.error("[Alert Thresholds] Failed to get thresholds:", error);
    return [];
  }
}

/**
 * Get threshold for a specific metric
 */
export async function getThreshold(metricName: string): Promise<ThresholdConfig | null> {
  const thresholds = await getAllThresholds();
  return thresholds.find(t => t.metricName === metricName) || null;
}

/**
 * Update threshold for a metric
 */
export async function updateThreshold(
  metricName: string,
  updates: Partial<{
    warningThreshold: number;
    criticalThreshold: number;
    isEnabled: boolean;
    cooldownMinutes: number;
  }>,
  updatedBy?: number
): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;
    
    const updateData: Record<string, unknown> = {};
    
    if (updates.warningThreshold !== undefined) {
      updateData.warningThreshold = updates.warningThreshold;
    }
    if (updates.criticalThreshold !== undefined) {
      updateData.criticalThreshold = updates.criticalThreshold;
    }
    if (updates.isEnabled !== undefined) {
      updateData.isEnabled = updates.isEnabled ? "true" : "false";
    }
    if (updates.cooldownMinutes !== undefined) {
      updateData.cooldownMinutes = updates.cooldownMinutes;
    }
    if (updatedBy !== undefined) {
      updateData.updatedBy = updatedBy;
    }
    
    await db.update(alertThresholds)
      .set(updateData)
      .where(eq(alertThresholds.metricName, metricName));
    
    // Invalidate cache
    thresholdsCache = null;
    
    console.log(`[Alert Thresholds] Updated ${metricName}:`, updates);
    return true;
  } catch (error) {
    console.error("[Alert Thresholds] Failed to update:", error);
    return false;
  }
}

/**
 * Update last alert time for a metric
 */
export async function updateLastAlertTime(metricName: string): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;
    
    await db.update(alertThresholds)
      .set({ lastAlertAt: new Date() })
      .where(eq(alertThresholds.metricName, metricName));
    
    // Invalidate cache
    thresholdsCache = null;
  } catch (error) {
    console.error("[Alert Thresholds] Failed to update last alert time:", error);
  }
}

/**
 * Reset threshold to default values
 */
export async function resetToDefault(metricName: string): Promise<boolean> {
  const defaultConfig = DEFAULT_ALERT_THRESHOLDS[metricName as MetricName];
  if (!defaultConfig) return false;
  
  return await updateThreshold(metricName, {
    warningThreshold: defaultConfig.warning,
    criticalThreshold: defaultConfig.critical,
    cooldownMinutes: defaultConfig.cooldownMinutes,
    isEnabled: true,
  });
}

/**
 * Reset all thresholds to defaults
 */
export async function resetAllToDefaults(): Promise<boolean> {
  try {
    for (const metricName of Object.keys(DEFAULT_ALERT_THRESHOLDS)) {
      await resetToDefault(metricName);
    }
    return true;
  } catch (error) {
    console.error("[Alert Thresholds] Failed to reset all:", error);
    return false;
  }
}

// Alert Thresholds Router
export const alertThresholdsRouter = router({
  // Get all thresholds
  getAll: protectedProcedure.query(async () => {
    return await getAllThresholds();
  }),
  
  // Get single threshold
  get: protectedProcedure
    .input(z.object({ metricName: z.string() }))
    .query(async ({ input }) => {
      return await getThreshold(input.metricName);
    }),
  
  // Update threshold
  update: protectedProcedure
    .input(z.object({
      metricName: z.string(),
      warningThreshold: z.number().min(0).max(100).optional(),
      criticalThreshold: z.number().min(0).max(100).optional(),
      isEnabled: z.boolean().optional(),
      cooldownMinutes: z.number().min(1).max(1440).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { metricName, ...updates } = input;
      const success = await updateThreshold(metricName, updates, ctx.user?.id);
      return { success };
    }),
  
  // Batch update multiple thresholds
  batchUpdate: protectedProcedure
    .input(z.array(z.object({
      metricName: z.string(),
      warningThreshold: z.number().min(0).optional(),
      criticalThreshold: z.number().min(0).optional(),
      isEnabled: z.boolean().optional(),
      cooldownMinutes: z.number().min(1).max(1440).optional(),
    })))
    .mutation(async ({ ctx, input }) => {
      const results: { metricName: string; success: boolean }[] = [];
      
      for (const item of input) {
        const { metricName, ...updates } = item;
        const success = await updateThreshold(metricName, updates, ctx.user?.id);
        results.push({ metricName, success });
      }
      
      return { results, allSuccess: results.every(r => r.success) };
    }),
  
  // Reset single threshold to default
  resetToDefault: protectedProcedure
    .input(z.object({ metricName: z.string() }))
    .mutation(async ({ input }) => {
      const success = await resetToDefault(input.metricName);
      return { success };
    }),
  
  // Reset all thresholds to defaults
  resetAllToDefaults: protectedProcedure.mutation(async () => {
    const success = await resetAllToDefaults();
    return { success };
  }),
  
  // Initialize defaults (run once on setup)
  initialize: protectedProcedure.mutation(async () => {
    await initializeDefaultThresholds();
    return { success: true };
  }),
});

export type AlertThresholdsRouter = typeof alertThresholdsRouter;
