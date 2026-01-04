/**
 * Scheduled Reports Service
 * 
 * Manages automated performance reports sent via email on a schedule.
 * Supports daily, weekly, and monthly reports with customizable metrics.
 */

import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { scheduledReports, metricsHistory, uptimeMonthlyStats } from "../drizzle/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import sgMail from "@sendgrid/mail";

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Types
export interface ReportMetrics {
  cpu: { avg: number; max: number; min: number };
  memory: { avg: number; max: number; min: number };
  responseTime: { avg: number; max: number; min: number };
  errorRate: { avg: number; max: number; min: number };
  uptime: { availability: number; incidents: number; mttr: number };
}

export interface ScheduledReportConfig {
  id: number;
  name: string;
  reportType: "daily" | "weekly" | "monthly";
  dayOfWeek: number;
  dayOfMonth: number;
  sendHour: number;
  timezone: string;
  recipients: string;
  includeMetrics: string;
  includePeriodComparison: boolean;
  includeCharts: boolean;
  isEnabled: boolean;
  lastSentAt: Date | null;
  nextSendAt: Date | null;
}

/**
 * Calculate next send time based on report configuration
 */
function calculateNextSendTime(config: ScheduledReportConfig): Date {
  const now = new Date();
  const next = new Date();
  next.setHours(config.sendHour, 0, 0, 0);
  
  switch (config.reportType) {
    case "daily":
      // If today's send time has passed, schedule for tomorrow
      if (now.getHours() >= config.sendHour) {
        next.setDate(next.getDate() + 1);
      }
      break;
      
    case "weekly":
      // Find next occurrence of the specified day of week
      const currentDay = now.getDay();
      let daysUntilNext = config.dayOfWeek - currentDay;
      if (daysUntilNext <= 0 || (daysUntilNext === 0 && now.getHours() >= config.sendHour)) {
        daysUntilNext += 7;
      }
      next.setDate(now.getDate() + daysUntilNext);
      break;
      
    case "monthly":
      // Schedule for the specified day of month
      next.setDate(config.dayOfMonth);
      if (now.getDate() > config.dayOfMonth || 
          (now.getDate() === config.dayOfMonth && now.getHours() >= config.sendHour)) {
        next.setMonth(next.getMonth() + 1);
      }
      break;
  }
  
  return next;
}

/**
 * Get metrics for a date range
 */
async function getMetricsForPeriod(startDate: Date, endDate: Date): Promise<ReportMetrics> {
  const db = await getDb();
  if (!db) {
    return getDefaultMetrics();
  }
  
  try {
    const results = await db.select({
      avgCpu: sql<number>`AVG(${metricsHistory.cpuUsage})`,
      maxCpu: sql<number>`MAX(${metricsHistory.cpuUsage})`,
      minCpu: sql<number>`MIN(${metricsHistory.cpuUsage})`,
      avgMemory: sql<number>`AVG(${metricsHistory.memoryUsage})`,
      maxMemory: sql<number>`MAX(${metricsHistory.memoryUsage})`,
      minMemory: sql<number>`MIN(${metricsHistory.memoryUsage})`,
      avgResponseTime: sql<number>`AVG(${metricsHistory.avgResponseTime})`,
      maxResponseTime: sql<number>`MAX(${metricsHistory.avgResponseTime})`,
      minResponseTime: sql<number>`MIN(${metricsHistory.avgResponseTime})`,
      avgErrorRate: sql<number>`AVG(${metricsHistory.errorRate})`,
      maxErrorRate: sql<number>`MAX(${metricsHistory.errorRate})`,
      minErrorRate: sql<number>`MIN(${metricsHistory.errorRate})`,
    })
    .from(metricsHistory)
    .where(and(
      gte(metricsHistory.timestamp, startDate),
      lte(metricsHistory.timestamp, endDate)
    ));
    
    const row = results[0];
    
    // Get uptime stats
    const yearMonth = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`;
    const uptimeStats = await db.select()
      .from(uptimeMonthlyStats)
      .where(eq(uptimeMonthlyStats.yearMonth, yearMonth))
      .limit(1);
    
    const uptime = uptimeStats[0];
    
    return {
      cpu: {
        avg: Number(row?.avgCpu) || 0,
        max: Number(row?.maxCpu) || 0,
        min: Number(row?.minCpu) || 0,
      },
      memory: {
        avg: Number(row?.avgMemory) || 0,
        max: Number(row?.maxMemory) || 0,
        min: Number(row?.minMemory) || 0,
      },
      responseTime: {
        avg: Number(row?.avgResponseTime) || 0,
        max: Number(row?.maxResponseTime) || 0,
        min: Number(row?.minResponseTime) || 0,
      },
      errorRate: {
        avg: Number(row?.avgErrorRate) || 0,
        max: Number(row?.maxErrorRate) || 0,
        min: Number(row?.minErrorRate) || 0,
      },
      uptime: {
        availability: uptime ? Number(uptime.availabilityPercentage) : 100,
        incidents: uptime?.incidentCount || 0,
        mttr: uptime?.mttr || 0,
      },
    };
  } catch (error) {
    console.error("[Scheduled Reports] Failed to get metrics:", error);
    return getDefaultMetrics();
  }
}

function getDefaultMetrics(): ReportMetrics {
  return {
    cpu: { avg: 0, max: 0, min: 0 },
    memory: { avg: 0, max: 0, min: 0 },
    responseTime: { avg: 0, max: 0, min: 0 },
    errorRate: { avg: 0, max: 0, min: 0 },
    uptime: { availability: 100, incidents: 0, mttr: 0 },
  };
}

/**
 * Generate HTML email template for performance report
 */
function generateReportEmailHtml(
  reportName: string,
  reportType: string,
  metrics: ReportMetrics,
  previousMetrics: ReportMetrics | null,
  includePeriodComparison: boolean,
  periodStart: Date,
  periodEnd: Date
): string {
  const formatDate = (d: Date) => d.toLocaleDateString("vi-VN", { 
    year: "numeric", 
    month: "long", 
    day: "numeric" 
  });
  
  const formatChange = (current: number, previous: number): string => {
    if (!previous) return "";
    const change = ((current - previous) / previous * 100).toFixed(1);
    const isPositive = current > previous;
    const color = isPositive ? "#ef4444" : "#22c55e"; // Red for increase, green for decrease (for resource usage)
    const arrow = isPositive ? "↑" : "↓";
    return `<span style="color: ${color}; font-size: 12px;">${arrow} ${Math.abs(Number(change))}%</span>`;
  };
  
  const reportTypeLabel = {
    daily: "Hàng ngày",
    weekly: "Hàng tuần",
    monthly: "Hàng tháng",
  }[reportType] || reportType;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Báo cáo hiệu suất - ${reportName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">📊 Báo cáo Hiệu suất</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">${reportName} - ${reportTypeLabel}</p>
    </div>
    
    <!-- Period Info -->
    <div style="background: white; padding: 20px; border-bottom: 1px solid #e5e7eb;">
      <p style="margin: 0; color: #6b7280; font-size: 14px;">
        <strong>Kỳ báo cáo:</strong> ${formatDate(periodStart)} - ${formatDate(periodEnd)}
      </p>
    </div>
    
    <!-- Metrics Grid -->
    <div style="background: white; padding: 20px;">
      <h2 style="margin: 0 0 20px 0; font-size: 18px; color: #1f2937;">Tổng quan Hiệu suất</h2>
      
      <!-- CPU -->
      <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 600; color: #374151;">🖥️ CPU</span>
          ${includePeriodComparison && previousMetrics ? formatChange(metrics.cpu.avg, previousMetrics.cpu.avg) : ""}
        </div>
        <div style="margin-top: 10px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
          <div>
            <div style="font-size: 12px; color: #6b7280;">Trung bình</div>
            <div style="font-size: 18px; font-weight: 600; color: #1f2937;">${metrics.cpu.avg.toFixed(1)}%</div>
          </div>
          <div>
            <div style="font-size: 12px; color: #6b7280;">Cao nhất</div>
            <div style="font-size: 18px; font-weight: 600; color: #ef4444;">${metrics.cpu.max.toFixed(1)}%</div>
          </div>
          <div>
            <div style="font-size: 12px; color: #6b7280;">Thấp nhất</div>
            <div style="font-size: 18px; font-weight: 600; color: #22c55e;">${metrics.cpu.min.toFixed(1)}%</div>
          </div>
        </div>
      </div>
      
      <!-- Memory -->
      <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 600; color: #374151;">💾 Bộ nhớ RAM</span>
          ${includePeriodComparison && previousMetrics ? formatChange(metrics.memory.avg, previousMetrics.memory.avg) : ""}
        </div>
        <div style="margin-top: 10px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
          <div>
            <div style="font-size: 12px; color: #6b7280;">Trung bình</div>
            <div style="font-size: 18px; font-weight: 600; color: #1f2937;">${metrics.memory.avg.toFixed(1)}%</div>
          </div>
          <div>
            <div style="font-size: 12px; color: #6b7280;">Cao nhất</div>
            <div style="font-size: 18px; font-weight: 600; color: #ef4444;">${metrics.memory.max.toFixed(1)}%</div>
          </div>
          <div>
            <div style="font-size: 12px; color: #6b7280;">Thấp nhất</div>
            <div style="font-size: 18px; font-weight: 600; color: #22c55e;">${metrics.memory.min.toFixed(1)}%</div>
          </div>
        </div>
      </div>
      
      <!-- Response Time -->
      <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 600; color: #374151;">⚡ Thời gian phản hồi</span>
          ${includePeriodComparison && previousMetrics ? formatChange(metrics.responseTime.avg, previousMetrics.responseTime.avg) : ""}
        </div>
        <div style="margin-top: 10px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
          <div>
            <div style="font-size: 12px; color: #6b7280;">Trung bình</div>
            <div style="font-size: 18px; font-weight: 600; color: #1f2937;">${metrics.responseTime.avg.toFixed(0)}ms</div>
          </div>
          <div>
            <div style="font-size: 12px; color: #6b7280;">Cao nhất</div>
            <div style="font-size: 18px; font-weight: 600; color: #ef4444;">${metrics.responseTime.max.toFixed(0)}ms</div>
          </div>
          <div>
            <div style="font-size: 12px; color: #6b7280;">Thấp nhất</div>
            <div style="font-size: 18px; font-weight: 600; color: #22c55e;">${metrics.responseTime.min.toFixed(0)}ms</div>
          </div>
        </div>
      </div>
      
      <!-- Uptime -->
      <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #bbf7d0;">
        <div style="font-weight: 600; color: #166534; margin-bottom: 10px;">🟢 Uptime & Availability</div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
          <div>
            <div style="font-size: 12px; color: #166534;">Availability</div>
            <div style="font-size: 24px; font-weight: 700; color: #15803d;">${metrics.uptime.availability.toFixed(2)}%</div>
          </div>
          <div>
            <div style="font-size: 12px; color: #166534;">Sự cố</div>
            <div style="font-size: 24px; font-weight: 700; color: ${metrics.uptime.incidents > 0 ? '#dc2626' : '#15803d'};">${metrics.uptime.incidents}</div>
          </div>
          <div>
            <div style="font-size: 12px; color: #166534;">MTTR</div>
            <div style="font-size: 24px; font-weight: 700; color: #15803d;">${Math.round(metrics.uptime.mttr / 60)}m</div>
          </div>
        </div>
      </div>
      
      <!-- Error Rate -->
      <div style="background: ${metrics.errorRate.avg > 5 ? '#fef2f2' : '#f9fafb'}; padding: 15px; border-radius: 8px; ${metrics.errorRate.avg > 5 ? 'border: 1px solid #fecaca;' : ''}">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 600; color: ${metrics.errorRate.avg > 5 ? '#dc2626' : '#374151'};">⚠️ Tỷ lệ lỗi</span>
          ${includePeriodComparison && previousMetrics ? formatChange(metrics.errorRate.avg, previousMetrics.errorRate.avg) : ""}
        </div>
        <div style="margin-top: 10px;">
          <div style="font-size: 12px; color: #6b7280;">Trung bình</div>
          <div style="font-size: 24px; font-weight: 700; color: ${metrics.errorRate.avg > 5 ? '#dc2626' : '#1f2937'};">${metrics.errorRate.avg.toFixed(2)}%</div>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
      <p style="margin: 0; color: #6b7280; font-size: 12px;">
        Báo cáo được tạo tự động bởi DreamWeldTech Monitoring System
      </p>
      <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 11px;">
        © ${new Date().getFullYear()} DreamWeldTech. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Send scheduled report email
 */
async function sendReportEmail(
  config: ScheduledReportConfig,
  metrics: ReportMetrics,
  previousMetrics: ReportMetrics | null,
  periodStart: Date,
  periodEnd: Date
): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log("[Scheduled Reports] SendGrid not configured, skipping email");
    return false;
  }
  
  const recipients = config.recipients.split(",").map(e => e.trim()).filter(Boolean);
  if (recipients.length === 0) {
    console.log("[Scheduled Reports] No recipients configured");
    return false;
  }
  
  const html = generateReportEmailHtml(
    config.name,
    config.reportType,
    metrics,
    previousMetrics,
    config.includePeriodComparison,
    periodStart,
    periodEnd
  );
  
  const reportTypeLabel = {
    daily: "Hàng ngày",
    weekly: "Hàng tuần",
    monthly: "Hàng tháng",
  }[config.reportType] || config.reportType;
  
  try {
    await sgMail.send({
      to: recipients,
      from: process.env.SENDGRID_FROM_EMAIL || "noreply@dreamweldtech.com",
      subject: `📊 Báo cáo Hiệu suất ${reportTypeLabel} - ${config.name}`,
      html,
    });
    
    console.log(`[Scheduled Reports] Sent report "${config.name}" to ${recipients.length} recipients`);
    return true;
  } catch (error) {
    console.error("[Scheduled Reports] Failed to send email:", error);
    return false;
  }
}

/**
 * Process a single scheduled report
 */
async function processReport(report: ScheduledReportConfig): Promise<void> {
  const now = new Date();
  
  // Calculate period dates based on report type
  let periodStart: Date;
  let periodEnd = new Date(now);
  let previousPeriodStart: Date | null = null;
  let previousPeriodEnd: Date | null = null;
  
  switch (report.reportType) {
    case "daily":
      periodStart = new Date(now);
      periodStart.setDate(periodStart.getDate() - 1);
      periodStart.setHours(0, 0, 0, 0);
      periodEnd.setHours(0, 0, 0, 0);
      
      if (report.includePeriodComparison) {
        previousPeriodEnd = new Date(periodStart);
        previousPeriodStart = new Date(periodStart);
        previousPeriodStart.setDate(previousPeriodStart.getDate() - 1);
      }
      break;
      
    case "weekly":
      periodStart = new Date(now);
      periodStart.setDate(periodStart.getDate() - 7);
      periodStart.setHours(0, 0, 0, 0);
      
      if (report.includePeriodComparison) {
        previousPeriodEnd = new Date(periodStart);
        previousPeriodStart = new Date(periodStart);
        previousPeriodStart.setDate(previousPeriodStart.getDate() - 7);
      }
      break;
      
    case "monthly":
      periodStart = new Date(now);
      periodStart.setMonth(periodStart.getMonth() - 1);
      periodStart.setDate(1);
      periodStart.setHours(0, 0, 0, 0);
      
      if (report.includePeriodComparison) {
        previousPeriodEnd = new Date(periodStart);
        previousPeriodStart = new Date(periodStart);
        previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);
      }
      break;
  }
  
  // Get metrics
  const metrics = await getMetricsForPeriod(periodStart, periodEnd);
  let previousMetrics: ReportMetrics | null = null;
  
  if (report.includePeriodComparison && previousPeriodStart && previousPeriodEnd) {
    previousMetrics = await getMetricsForPeriod(previousPeriodStart, previousPeriodEnd);
  }
  
  // Send email
  const sent = await sendReportEmail(report, metrics, previousMetrics, periodStart, periodEnd);
  
  // Update last sent time and next send time
  if (sent) {
    const db = await getDb();
    if (db) {
      const nextSendAt = calculateNextSendTime(report);
      await db.update(scheduledReports)
        .set({ 
          lastSentAt: now,
          nextSendAt,
        })
        .where(eq(scheduledReports.id, report.id));
    }
  }
}

/**
 * Check and process all due reports
 */
export async function processScheduledReports(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const now = new Date();
  
  try {
    // Get all enabled reports that are due
    const dueReports = await db.select()
      .from(scheduledReports)
      .where(and(
        eq(scheduledReports.isEnabled, "true"),
        lte(scheduledReports.nextSendAt, now)
      ));
    
    console.log(`[Scheduled Reports] Found ${dueReports.length} due reports`);
    
    for (const report of dueReports) {
      const config: ScheduledReportConfig = {
        id: report.id,
        name: report.name,
        reportType: report.reportType as "daily" | "weekly" | "monthly",
        dayOfWeek: report.dayOfWeek || 1,
        dayOfMonth: report.dayOfMonth || 1,
        sendHour: report.sendHour || 9,
        timezone: report.timezone || "Asia/Ho_Chi_Minh",
        recipients: report.recipients,
        includeMetrics: report.includeMetrics || "cpu,memory,responseTime,errorRate,uptime",
        includePeriodComparison: report.includePeriodComparison === "true",
        includeCharts: report.includeCharts === "true",
        isEnabled: report.isEnabled === "true",
        lastSentAt: report.lastSentAt,
        nextSendAt: report.nextSendAt,
      };
      
      await processReport(config);
    }
  } catch (error) {
    console.error("[Scheduled Reports] Error processing reports:", error);
  }
}

// Start scheduler (check every minute)
let schedulerInterval: NodeJS.Timeout | null = null;

export function startReportScheduler(): void {
  if (schedulerInterval) return;
  
  console.log("[Scheduled Reports] Starting scheduler...");
  schedulerInterval = setInterval(processScheduledReports, 60 * 1000); // Check every minute
  
  // Also run immediately on start
  processScheduledReports();
}

export function stopReportScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("[Scheduled Reports] Scheduler stopped");
  }
}

// Router
export const scheduledReportsRouter = router({
  // List all reports
  list: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    
    return await db.select()
      .from(scheduledReports)
      .orderBy(desc(scheduledReports.createdAt));
  }),
  
  // Get single report
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      
      const results = await db.select()
        .from(scheduledReports)
        .where(eq(scheduledReports.id, input.id))
        .limit(1);
      
      return results[0] || null;
    }),
  
  // Create new report
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      reportType: z.enum(["daily", "weekly", "monthly"]),
      dayOfWeek: z.number().min(0).max(6).optional(),
      dayOfMonth: z.number().min(1).max(28).optional(),
      sendHour: z.number().min(0).max(23).optional(),
      timezone: z.string().optional(),
      recipients: z.string().min(1),
      includeMetrics: z.string().optional(),
      includePeriodComparison: z.boolean().optional(),
      includeCharts: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const config: ScheduledReportConfig = {
        id: 0,
        name: input.name,
        reportType: input.reportType,
        dayOfWeek: input.dayOfWeek ?? 1,
        dayOfMonth: input.dayOfMonth ?? 1,
        sendHour: input.sendHour ?? 9,
        timezone: input.timezone ?? "Asia/Ho_Chi_Minh",
        recipients: input.recipients,
        includeMetrics: input.includeMetrics ?? "cpu,memory,responseTime,errorRate,uptime",
        includePeriodComparison: input.includePeriodComparison ?? true,
        includeCharts: input.includeCharts ?? true,
        isEnabled: true,
        lastSentAt: null,
        nextSendAt: null,
      };
      
      const nextSendAt = calculateNextSendTime(config);
      
      const result = await db.insert(scheduledReports).values({
        name: input.name,
        reportType: input.reportType,
        dayOfWeek: input.dayOfWeek ?? 1,
        dayOfMonth: input.dayOfMonth ?? 1,
        sendHour: input.sendHour ?? 9,
        timezone: input.timezone ?? "Asia/Ho_Chi_Minh",
        recipients: input.recipients,
        includeMetrics: input.includeMetrics ?? "cpu,memory,responseTime,errorRate,uptime",
        includePeriodComparison: input.includePeriodComparison ? "true" : "false",
        includeCharts: input.includeCharts ? "true" : "false",
        isEnabled: "true",
        nextSendAt,
        createdBy: ctx.user?.id,
      });
      
      return { success: true, id: result[0].insertId };
    }),
  
  // Update report
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(255).optional(),
      reportType: z.enum(["daily", "weekly", "monthly"]).optional(),
      dayOfWeek: z.number().min(0).max(6).optional(),
      dayOfMonth: z.number().min(1).max(28).optional(),
      sendHour: z.number().min(0).max(23).optional(),
      timezone: z.string().optional(),
      recipients: z.string().optional(),
      includeMetrics: z.string().optional(),
      includePeriodComparison: z.boolean().optional(),
      includeCharts: z.boolean().optional(),
      isEnabled: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const { id, ...updates } = input;
      const updateData: Record<string, unknown> = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.reportType !== undefined) updateData.reportType = updates.reportType;
      if (updates.dayOfWeek !== undefined) updateData.dayOfWeek = updates.dayOfWeek;
      if (updates.dayOfMonth !== undefined) updateData.dayOfMonth = updates.dayOfMonth;
      if (updates.sendHour !== undefined) updateData.sendHour = updates.sendHour;
      if (updates.timezone !== undefined) updateData.timezone = updates.timezone;
      if (updates.recipients !== undefined) updateData.recipients = updates.recipients;
      if (updates.includeMetrics !== undefined) updateData.includeMetrics = updates.includeMetrics;
      if (updates.includePeriodComparison !== undefined) {
        updateData.includePeriodComparison = updates.includePeriodComparison ? "true" : "false";
      }
      if (updates.includeCharts !== undefined) {
        updateData.includeCharts = updates.includeCharts ? "true" : "false";
      }
      if (updates.isEnabled !== undefined) {
        updateData.isEnabled = updates.isEnabled ? "true" : "false";
      }
      
      await db.update(scheduledReports)
        .set(updateData)
        .where(eq(scheduledReports.id, id));
      
      return { success: true };
    }),
  
  // Delete report
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.delete(scheduledReports)
        .where(eq(scheduledReports.id, input.id));
      
      return { success: true };
    }),
  
  // Send report now (manual trigger)
  sendNow: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const results = await db.select()
        .from(scheduledReports)
        .where(eq(scheduledReports.id, input.id))
        .limit(1);
      
      const report = results[0];
      if (!report) throw new Error("Report not found");
      
      const config: ScheduledReportConfig = {
        id: report.id,
        name: report.name,
        reportType: report.reportType as "daily" | "weekly" | "monthly",
        dayOfWeek: report.dayOfWeek || 1,
        dayOfMonth: report.dayOfMonth || 1,
        sendHour: report.sendHour || 9,
        timezone: report.timezone || "Asia/Ho_Chi_Minh",
        recipients: report.recipients,
        includeMetrics: report.includeMetrics || "cpu,memory,responseTime,errorRate,uptime",
        includePeriodComparison: report.includePeriodComparison === "true",
        includeCharts: report.includeCharts === "true",
        isEnabled: report.isEnabled === "true",
        lastSentAt: report.lastSentAt,
        nextSendAt: report.nextSendAt,
      };
      
      await processReport(config);
      
      return { success: true };
    }),
});

export type ScheduledReportsRouter = typeof scheduledReportsRouter;
