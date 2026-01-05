/**
 * Performance Alerts Service
 * 
 * Real-time alerts when P95 response time exceeds thresholds.
 */

import { getDb } from "./db";
import { performanceAlerts, alertHistory, InsertPerformanceAlert } from "../drizzle/schema";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import sgMail from "@sendgrid/mail";

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// In-memory alert configs cache
interface AlertConfigCache {
  id: number;
  name: string;
  alertType: string;
  target: string;
  metric: string;
  threshold: number;
  operator: string;
  evaluationWindow: number;
  cooldownMinutes: number;
  isEnabled: boolean;
  notificationChannels: string[];
  severity: string;
  lastTriggeredAt: Date | null;
}

let alertConfigsCache: AlertConfigCache[] = [];
let lastCacheRefresh = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

// Last alert times for cooldown
const lastAlertTimes = new Map<string, Date>();

// Alert listeners for real-time notifications
type AlertListener = (alert: { alertId: number; currentValue: number; threshold: number; target: string; severity: string }) => void;
const alertListeners: AlertListener[] = [];

/**
 * Register alert listener
 */
export function onAlert(listener: AlertListener): () => void {
  alertListeners.push(listener);
  return () => {
    const index = alertListeners.indexOf(listener);
    if (index > -1) alertListeners.splice(index, 1);
  };
}

/**
 * Refresh alert configs cache
 */
async function refreshConfigsCache(): Promise<void> {
  try {
    const db = await getDb();
    const configs = await db!
      .select()
      .from(performanceAlerts)
      .where(eq(performanceAlerts.isEnabled, "true"));
    
    alertConfigsCache = configs.map(c => ({
      id: c.id,
      name: c.name,
      alertType: c.alertType,
      target: c.target || "*",
      metric: c.metric,
      threshold: c.threshold,
      operator: c.operator || "gt",
      evaluationWindow: c.evaluationWindow || 5,
      cooldownMinutes: c.cooldownMinutes || 15,
      isEnabled: c.isEnabled === "true",
      notificationChannels: (c.notificationChannels || "email").split(","),
      severity: c.severity,
      lastTriggeredAt: c.lastTriggeredAt,
    }));
    
    lastCacheRefresh = Date.now();
    console.log(`[Performance Alerts] Refreshed cache with ${alertConfigsCache.length} configs`);
  } catch (error) {
    console.error("[Performance Alerts] Failed to refresh cache:", error);
  }
}

/**
 * Get configs (with cache)
 */
async function getConfigs(): Promise<AlertConfigCache[]> {
  if (Date.now() - lastCacheRefresh > CACHE_TTL) {
    await refreshConfigsCache();
  }
  return alertConfigsCache;
}

/**
 * Check if alert is in cooldown
 */
function isInCooldown(alertId: number, target: string, cooldownMinutes: number): boolean {
  const key = `${alertId}:${target}`;
  const lastAlert = lastAlertTimes.get(key);
  if (!lastAlert) return false;
  
  const cooldownMs = cooldownMinutes * 60 * 1000;
  return Date.now() - lastAlert.getTime() < cooldownMs;
}

/**
 * Check value against threshold
 */
function checkThreshold(value: number, threshold: number, operator: string): boolean {
  switch (operator) {
    case "gt": return value > threshold;
    case "gte": return value >= threshold;
    case "lt": return value < threshold;
    case "lte": return value <= threshold;
    case "eq": return value === threshold;
    default: return value > threshold;
  }
}

/**
 * Send alert email
 */
async function sendAlertEmail(
  config: AlertConfigCache,
  currentValue: number,
  triggeredTarget: string
): Promise<void> {
  const adminEmail = process.env.ADMIN_ALERT_EMAIL;
  if (!adminEmail || !process.env.SENDGRID_API_KEY) {
    console.log("[Performance Alerts] Email not configured, skipping email notification");
    return;
  }
  
  const severityEmoji = config.severity === "critical" ? "🚨" : config.severity === "warning" ? "⚠️" : "ℹ️";
  const severityColor = config.severity === "critical" ? "#dc2626" : config.severity === "warning" ? "#f59e0b" : "#3b82f6";
  const unit = config.metric.includes("rate") ? "%" : "ms";
  
  try {
    await sgMail.send({
      to: adminEmail,
      from: adminEmail,
      subject: `${severityEmoji} Performance Alert: ${config.name} - ${config.severity.toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: ${severityColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">${severityEmoji} ${config.name}</h1>
          </div>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>Alert Type:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${config.alertType}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>Metric:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${config.metric}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>Severity:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">
                  <span style="background: ${severityColor}; color: white; padding: 4px 8px; border-radius: 4px;">
                    ${config.severity.toUpperCase()}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>Current Value:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6; font-size: 18px; font-weight: bold; color: ${severityColor};">
                  ${currentValue}${unit}
                </td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>Threshold:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">
                  ${config.operator} ${config.threshold}${unit}
                </td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><strong>Target:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><code>${triggeredTarget}</code></td>
              </tr>
              <tr>
                <td style="padding: 10px;"><strong>Time:</strong></td>
                <td style="padding: 10px;">${new Date().toLocaleString("vi-VN")}</td>
              </tr>
            </table>
            <p style="margin-top: 20px; color: #6c757d; font-size: 12px;">
              This is an automated alert from DreamWeldTech Performance Monitoring System.
            </p>
          </div>
        </div>
      `,
    });
    console.log(`[Performance Alerts] Email sent for ${config.name}`);
  } catch (error) {
    console.error("[Performance Alerts] Failed to send email:", error);
  }
}

/**
 * Send Telegram alert
 */
async function sendTelegramAlert(
  config: AlertConfigCache,
  currentValue: number,
  triggeredTarget: string
): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  if (!botToken || !chatId) return;
  
  const severityEmoji = config.severity === "critical" ? "🚨" : config.severity === "warning" ? "⚠️" : "ℹ️";
  const unit = config.metric.includes("rate") ? "%" : "ms";
  
  const message = `
${severityEmoji} *${config.name}*

*Type:* ${config.alertType}
*Metric:* ${config.metric}
*Severity:* ${config.severity.toUpperCase()}
*Value:* ${currentValue}${unit}
*Threshold:* ${config.operator} ${config.threshold}${unit}
*Target:* \`${triggeredTarget}\`
  `.trim();
  
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
      }),
    });
    console.log(`[Performance Alerts] Telegram sent for ${config.name}`);
  } catch (error) {
    console.error("[Performance Alerts] Failed to send Telegram:", error);
  }
}

/**
 * Trigger alert
 */
async function triggerAlert(
  config: AlertConfigCache,
  currentValue: number,
  triggeredTarget: string
): Promise<void> {
  const cooldownKey = `${config.id}:${triggeredTarget}`;
  
  // Check cooldown
  if (isInCooldown(config.id, triggeredTarget, config.cooldownMinutes)) {
    console.log(`[Performance Alerts] ${config.name} in cooldown for ${triggeredTarget}`);
    return;
  }
  
  try {
    const db = await getDb();
    
    // Insert alert history
    await db!.insert(alertHistory).values({
      alertId: config.id,
      currentValue: Math.round(currentValue),
      thresholdValue: config.threshold,
      triggeredTarget,
      status: "triggered",
    });
    
    // Update alert trigger count and timestamp
    await db!
      .update(performanceAlerts)
      .set({
        lastTriggeredAt: new Date(),
        triggerCount: sql`${performanceAlerts.triggerCount} + 1`,
      })
      .where(eq(performanceAlerts.id, config.id));
    
    // Update cooldown
    lastAlertTimes.set(cooldownKey, new Date());
    
    // Notify listeners
    for (const listener of alertListeners) {
      try {
        listener({
          alertId: config.id,
          currentValue,
          threshold: config.threshold,
          target: triggeredTarget,
          severity: config.severity,
        });
      } catch (e) {
        console.error("[Performance Alerts] Listener error:", e);
      }
    }
    
    // Send notifications based on channels
    const notifications: Promise<void>[] = [];
    
    if (config.notificationChannels.includes("email")) {
      notifications.push(sendAlertEmail(config, currentValue, triggeredTarget));
    }
    if (config.notificationChannels.includes("telegram")) {
      notifications.push(sendTelegramAlert(config, currentValue, triggeredTarget));
    }
    
    await Promise.all(notifications);
    
    console.log(`[Performance Alerts] Triggered ${config.severity} alert: ${config.name} (${currentValue} ${config.operator} ${config.threshold})`);
  } catch (error) {
    console.error("[Performance Alerts] Failed to trigger alert:", error);
  }
}

/**
 * Check P95 response time
 */
export async function checkP95Alert(p95Value: number, endpoint?: string): Promise<void> {
  const configs = await getConfigs();
  const target = endpoint || "*";
  
  for (const config of configs) {
    if (config.metric !== "p95") continue;
    if (config.target !== "*" && config.target !== target) continue;
    
    if (checkThreshold(p95Value, config.threshold, config.operator)) {
      await triggerAlert(config, p95Value, target);
    }
  }
}

/**
 * Check P99 response time
 */
export async function checkP99Alert(p99Value: number, endpoint?: string): Promise<void> {
  const configs = await getConfigs();
  const target = endpoint || "*";
  
  for (const config of configs) {
    if (config.metric !== "p99") continue;
    if (config.target !== "*" && config.target !== target) continue;
    
    if (checkThreshold(p99Value, config.threshold, config.operator)) {
      await triggerAlert(config, p99Value, target);
    }
  }
}

/**
 * Check error rate
 */
export async function checkErrorRateAlert(errorRate: number, endpoint?: string): Promise<void> {
  const configs = await getConfigs();
  const target = endpoint || "*";
  
  for (const config of configs) {
    if (config.metric !== "error_rate") continue;
    if (config.target !== "*" && config.target !== target) continue;
    
    if (checkThreshold(errorRate, config.threshold, config.operator)) {
      await triggerAlert(config, errorRate, target);
    }
  }
}

/**
 * Performance Alerts Router
 */
export const performanceAlertsRouter = router({
  // Get all alert configs
  getConfigs: protectedProcedure.query(async () => {
    const db = await getDb();
    return await db!.select().from(performanceAlerts).orderBy(desc(performanceAlerts.createdAt));
  }),
  
  // Create alert config
  createConfig: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      alertType: z.string(),
      target: z.string().optional().default("*"),
      metric: z.string(),
      threshold: z.number().min(0),
      operator: z.enum(["gt", "gte", "lt", "lte", "eq"]).optional().default("gt"),
      evaluationWindow: z.number().min(1).max(60).optional().default(5),
      cooldownMinutes: z.number().min(1).max(60).optional().default(15),
      notificationChannels: z.string().optional().default("email"),
      severity: z.enum(["info", "warning", "critical"]).optional().default("warning"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      
      await db!.insert(performanceAlerts).values({
        name: input.name,
        alertType: input.alertType,
        target: input.target,
        metric: input.metric,
        threshold: input.threshold,
        operator: input.operator,
        evaluationWindow: input.evaluationWindow,
        cooldownMinutes: input.cooldownMinutes,
        notificationChannels: input.notificationChannels,
        severity: input.severity,
        isEnabled: "true",
      });
      
      await refreshConfigsCache();
      return { success: true };
    }),
  
  // Update alert config
  updateConfig: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(255).optional(),
      threshold: z.number().min(0).optional(),
      operator: z.enum(["gt", "gte", "lt", "lte", "eq"]).optional(),
      evaluationWindow: z.number().min(1).max(60).optional(),
      cooldownMinutes: z.number().min(1).max(60).optional(),
      notificationChannels: z.string().optional(),
      severity: z.enum(["info", "warning", "critical"]).optional(),
      isEnabled: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const { id, isEnabled, ...rest } = input;
      
      const updateData: Record<string, unknown> = { ...rest };
      if (isEnabled !== undefined) {
        updateData.isEnabled = isEnabled ? "true" : "false";
      }
      
      await db!
        .update(performanceAlerts)
        .set(updateData)
        .where(eq(performanceAlerts.id, id));
      
      await refreshConfigsCache();
      return { success: true };
    }),
  
  // Delete alert config
  deleteConfig: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db!.delete(performanceAlerts).where(eq(performanceAlerts.id, input.id));
      await refreshConfigsCache();
      return { success: true };
    }),
  
  // Get alert history
  getHistory: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).optional().default(50),
      alertId: z.number().optional(),
      status: z.enum(["triggered", "acknowledged", "resolved"]).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      
      let query = db!.select().from(alertHistory);
      
      const conditions = [];
      if (input.alertId) {
        conditions.push(eq(alertHistory.alertId, input.alertId));
      }
      if (input.status) {
        conditions.push(eq(alertHistory.status, input.status));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as typeof query;
      }
      
      return await query.orderBy(desc(alertHistory.triggeredAt)).limit(input.limit);
    }),
  
  // Get alert stats
  getStats: protectedProcedure
    .input(z.object({
      days: z.number().min(1).max(90).optional().default(7),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);
      
      const bySeverity = await db!
        .select({
          severity: performanceAlerts.severity,
          count: sql<number>`COUNT(*)`,
        })
        .from(alertHistory)
        .innerJoin(performanceAlerts, eq(alertHistory.alertId, performanceAlerts.id))
        .where(gte(alertHistory.triggeredAt, startDate))
        .groupBy(performanceAlerts.severity);
      
      const byStatus = await db!
        .select({
          status: alertHistory.status,
          count: sql<number>`COUNT(*)`,
        })
        .from(alertHistory)
        .where(gte(alertHistory.triggeredAt, startDate))
        .groupBy(alertHistory.status);
      
      const unacknowledged = await db!
        .select({ count: sql<number>`COUNT(*)` })
        .from(alertHistory)
        .where(eq(alertHistory.status, "triggered"));
      
      return {
        bySeverity,
        byStatus,
        unacknowledgedCount: unacknowledged[0]?.count || 0,
      };
    }),
  
  // Acknowledge alert
  acknowledgeAlert: protectedProcedure
    .input(z.object({
      id: z.number(),
      userId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      
      await db!
        .update(alertHistory)
        .set({
          status: "acknowledged",
          acknowledgedBy: input.userId || null,
          acknowledgedAt: new Date(),
        })
        .where(eq(alertHistory.id, input.id));
      
      return { success: true };
    }),
  
  // Resolve alert
  resolveAlert: protectedProcedure
    .input(z.object({
      id: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      
      await db!
        .update(alertHistory)
        .set({
          status: "resolved",
          resolvedAt: new Date(),
          resolutionNotes: input.notes || null,
        })
        .where(eq(alertHistory.id, input.id));
      
      return { success: true };
    }),
  
  // Acknowledge all triggered alerts
  acknowledgeAll: protectedProcedure
    .input(z.object({ userId: z.number().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      
      await db!
        .update(alertHistory)
        .set({
          status: "acknowledged",
          acknowledgedBy: input.userId || null,
          acknowledgedAt: new Date(),
        })
        .where(eq(alertHistory.status, "triggered"));
      
      return { success: true };
    }),
  
  // Test alert
  testAlert: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const configs = await db!
        .select()
        .from(performanceAlerts)
        .where(eq(performanceAlerts.id, input.id))
        .limit(1);
      
      if (configs.length === 0) {
        throw new Error("Alert config not found");
      }
      
      const config = configs[0];
      const testValue = config.threshold + 10;
      
      // Insert test alert
      await db!.insert(alertHistory).values({
        alertId: config.id,
        currentValue: testValue,
        thresholdValue: config.threshold,
        triggeredTarget: "[TEST]",
        status: "triggered",
      });
      
      // Send test notifications
      const cacheConfig: AlertConfigCache = {
        id: config.id,
        name: `[TEST] ${config.name}`,
        alertType: config.alertType,
        target: config.target || "*",
        metric: config.metric,
        threshold: config.threshold,
        operator: config.operator || "gt",
        evaluationWindow: config.evaluationWindow || 5,
        cooldownMinutes: 0, // No cooldown for test
        isEnabled: true,
        notificationChannels: (config.notificationChannels || "email").split(","),
        severity: config.severity,
        lastTriggeredAt: null,
      };
      
      const notifications: Promise<void>[] = [];
      if (cacheConfig.notificationChannels.includes("email")) {
        notifications.push(sendAlertEmail(cacheConfig, testValue, "[TEST]"));
      }
      if (cacheConfig.notificationChannels.includes("telegram")) {
        notifications.push(sendTelegramAlert(cacheConfig, testValue, "[TEST]"));
      }
      
      await Promise.all(notifications);
      
      return { success: true };
    }),
  
  // Refresh cache
  refreshCache: protectedProcedure.mutation(async () => {
    await refreshConfigsCache();
    return { success: true, count: alertConfigsCache.length };
  }),
});

// Initialize cache on module load
refreshConfigsCache();
