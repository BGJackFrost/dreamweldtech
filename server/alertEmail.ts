import { sendEmailNotification } from "./email";
import { getDb } from "./db";
import { activityLogs, notificationCenter } from "../drizzle/schema";
import { sendMultiChannelAlert, getConfiguredChannels } from "./slackTelegramAlerts";

// Alert types
export type AlertType = "cpu" | "memory" | "disk" | "responseTime" | "errorRate" | "serverDown";

export interface AlertConfig {
  type: AlertType;
  threshold: number;
  currentValue: number;
  unit: string;
  severity: "warning" | "critical";
}

// Cooldown tracking (in-memory, resets on server restart)
const alertCooldowns: Map<string, number> = new Map();
const COOLDOWN_PERIOD = 15 * 60 * 1000; // 15 minutes

// Default thresholds
export const DEFAULT_THRESHOLDS = {
  cpu: { warning: 70, critical: 90 },
  memory: { warning: 80, critical: 95 },
  disk: { warning: 80, critical: 95 },
  responseTime: { warning: 1000, critical: 3000 }, // ms
  errorRate: { warning: 5, critical: 10 }, // percentage
};

// Alert labels in Vietnamese
const ALERT_LABELS: Record<AlertType, string> = {
  cpu: "CPU",
  memory: "Bộ nhớ RAM",
  disk: "Ổ đĩa",
  responseTime: "Thời gian phản hồi",
  errorRate: "Tỷ lệ lỗi",
  serverDown: "Máy chủ",
};

// Check if alert is in cooldown
function isInCooldown(alertKey: string): boolean {
  const lastAlert = alertCooldowns.get(alertKey);
  if (!lastAlert) return false;
  return Date.now() - lastAlert < COOLDOWN_PERIOD;
}

// Set cooldown for alert
function setCooldown(alertKey: string): void {
  alertCooldowns.set(alertKey, Date.now());
}

// Get admin emails from environment or database
async function getAdminEmails(): Promise<string[]> {
  // Default admin email from environment
  const defaultEmail = process.env.ADMIN_ALERT_EMAIL || process.env.OWNER_EMAIL;
  
  if (defaultEmail) {
    return [defaultEmail];
  }
  
  // Fallback: try to get from database (users with admin role)
  try {
    const db = await getDb();
    if (!db) return [];
    
    // For now, return empty if no admin email configured
    // In production, you would query admin users from database
    return [];
  } catch {
    return [];
  }
}

// Generate alert email HTML
function generateAlertEmailHtml(alerts: AlertConfig[], hostname: string): string {
  const alertRows = alerts.map(alert => {
    const severityColor = alert.severity === "critical" ? "#dc2626" : "#f59e0b";
    const severityLabel = alert.severity === "critical" ? "NGHIÊM TRỌNG" : "CẢNH BÁO";
    
    return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <span style="display: inline-block; padding: 4px 8px; background-color: ${severityColor}; color: white; border-radius: 4px; font-size: 12px; font-weight: bold;">
            ${severityLabel}
          </span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 500;">
          ${ALERT_LABELS[alert.type]}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <span style="color: ${severityColor}; font-weight: bold;">${alert.currentValue}${alert.unit}</span>
          <span style="color: #6b7280;"> / Ngưỡng: ${alert.threshold}${alert.unit}</span>
        </td>
      </tr>
    `;
  }).join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">⚠️ Cảnh Báo Hệ Thống</h1>
        <p style="margin: 10px 0 0; opacity: 0.9;">Dreamweldtech Server Monitoring</p>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="margin: 0 0 20px; color: #4b5563;">
          Hệ thống đã phát hiện <strong>${alerts.length} cảnh báo</strong> cần được xử lý:
        </p>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f9fafb;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-weight: 600;">Mức độ</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-weight: 600;">Loại</th>
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-weight: 600;">Giá trị</th>
            </tr>
          </thead>
          <tbody>
            ${alertRows}
          </tbody>
        </table>
        
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; color: #92400e;">
            <strong>Thông tin máy chủ:</strong><br>
            Hostname: ${hostname}<br>
            Thời gian: ${new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.VITE_APP_URL || "https://dreamweldtech.vn"}/admin/monitoring" 
             style="display: inline-block; background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Xem Chi Tiết Monitoring
          </a>
        </div>
      </div>
      
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 0 0 12px 12px; text-align: center; border: 1px solid #e5e7eb; border-top: none;">
        <p style="margin: 0; color: #6b7280; font-size: 14px;">
          Email này được gửi tự động từ hệ thống giám sát Dreamweldtech.<br>
          Bạn sẽ không nhận email cảnh báo tương tự trong vòng 15 phút tiếp theo.
        </p>
      </div>
    </body>
    </html>
  `;
}

// Generate plain text version
function generateAlertEmailText(alerts: AlertConfig[], hostname: string): string {
  const alertLines = alerts.map(alert => {
    const severityLabel = alert.severity === "critical" ? "[NGHIÊM TRỌNG]" : "[CẢNH BÁO]";
    return `${severityLabel} ${ALERT_LABELS[alert.type]}: ${alert.currentValue}${alert.unit} (Ngưỡng: ${alert.threshold}${alert.unit})`;
  }).join("\n");

  return `
CẢNH BÁO HỆ THỐNG - Dreamweldtech

Hệ thống đã phát hiện ${alerts.length} cảnh báo cần được xử lý:

${alertLines}

Thông tin máy chủ:
- Hostname: ${hostname}
- Thời gian: ${new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}

Truy cập Admin Panel để xem chi tiết: ${process.env.VITE_APP_URL || "https://dreamweldtech.vn"}/admin/monitoring

---
Email này được gửi tự động từ hệ thống giám sát Dreamweldtech.
Bạn sẽ không nhận email cảnh báo tương tự trong vòng 15 phút tiếp theo.
  `.trim();
}

// Send alert email
export async function sendAlertEmail(alerts: AlertConfig[], hostname: string): Promise<boolean> {
  // Filter alerts that are not in cooldown
  const alertsToSend: AlertConfig[] = [];
  
  for (const alert of alerts) {
    const alertKey = `${alert.type}_${alert.severity}`;
    if (!isInCooldown(alertKey)) {
      alertsToSend.push(alert);
      setCooldown(alertKey);
    }
  }
  
  if (alertsToSend.length === 0) {
    console.log("[Alert Email] All alerts are in cooldown, skipping email");
    return false;
  }
  
  // Get admin emails
  const adminEmails = await getAdminEmails();
  
  if (adminEmails.length === 0) {
    console.log("[Alert Email] No admin emails configured, skipping email");
    return false;
  }
  
  // Generate email content
  const htmlContent = generateAlertEmailHtml(alertsToSend, hostname);
  const textContent = generateAlertEmailText(alertsToSend, hostname);
  
  // Determine subject based on severity
  const hasCritical = alertsToSend.some(a => a.severity === "critical");
  const subject = hasCritical 
    ? `🚨 [NGHIÊM TRỌNG] Cảnh báo hệ thống Dreamweldtech - ${alertsToSend.length} vấn đề`
    : `⚠️ [CẢNH BÁO] Cảnh báo hệ thống Dreamweldtech - ${alertsToSend.length} vấn đề`;
  
  try {
    // Send email to each admin
    for (const email of adminEmails) {
      await sendEmailNotification(
        { subject, html: htmlContent, text: textContent },
        email
      );
    }
    
    console.log(`[Alert Email] Sent ${alertsToSend.length} alerts to ${adminEmails.length} admin(s)`);
    
    // Also send to Slack and Telegram
    const slackTelegramResult = await sendMultiChannelAlert({
      title: hasCritical ? "CẢNH BÁO NGHIÊM TRỌNG" : "Cảnh báo hệ thống",
      message: alertsToSend.map(a => `${ALERT_LABELS[a.type]}: ${a.currentValue}${a.unit} (ngưỡng: ${a.threshold}${a.unit})`).join("\n"),
      severity: hasCritical ? "critical" : "warning",
      metrics: {
        cpu: alertsToSend.find(a => a.type === "cpu")?.currentValue,
        memory: alertsToSend.find(a => a.type === "memory")?.currentValue,
        disk: alertsToSend.find(a => a.type === "disk")?.currentValue,
        responseTime: alertsToSend.find(a => a.type === "responseTime")?.currentValue,
        errorRate: alertsToSend.find(a => a.type === "errorRate")?.currentValue,
      },
      hostname,
      timestamp: new Date().toLocaleString("vi-VN"),
    });
    
    console.log(`[Alert] Slack: ${slackTelegramResult.slack}, Telegram: ${slackTelegramResult.telegram}`);
    
    // Log to activity log
    try {
      const db = await getDb();
      if (db) {
        await db.insert(activityLogs).values({
          userId: 0, // System user
          action: "view", // Using 'view' as closest match for system monitoring
          entityType: "monitoring",
          entityId: 0,
          entityName: "System Alert",
          newValues: JSON.stringify({
            event: "system_alert",
            alerts: alertsToSend.map(a => ({
              type: a.type,
              severity: a.severity,
              value: a.currentValue,
              threshold: a.threshold,
            })),
            recipients: adminEmails,
          }),
          ipAddress: "system",
          userAgent: "Monitoring System",
          status: "success",
        });
        
        // Also create notification center entry
        await db.insert(notificationCenter).values({
          type: "system",
          title: hasCritical ? "Cảnh báo nghiêm trọng" : "Cảnh báo hệ thống",
          message: `Phát hiện ${alertsToSend.length} vấn đề cần xử lý`,
          metadata: JSON.stringify({ alerts: alertsToSend }),
          isRead: "false",
        });
      }
    } catch (logError) {
      console.error("[Alert Email] Failed to log activity:", logError);
    }
    
    return true;
  } catch (error) {
    console.error("[Alert Email] Failed to send alert email:", error);
    return false;
  }
}

// Check metrics and send alerts if needed
export async function checkAndSendAlerts(metrics: {
  cpu: number;
  memory: number;
  disk: number;
  responseTime: number;
  errorRate: number;
  hostname: string;
}): Promise<void> {
  const alerts: AlertConfig[] = [];
  
  // Check CPU
  if (metrics.cpu >= DEFAULT_THRESHOLDS.cpu.critical) {
    alerts.push({
      type: "cpu",
      threshold: DEFAULT_THRESHOLDS.cpu.critical,
      currentValue: metrics.cpu,
      unit: "%",
      severity: "critical",
    });
  } else if (metrics.cpu >= DEFAULT_THRESHOLDS.cpu.warning) {
    alerts.push({
      type: "cpu",
      threshold: DEFAULT_THRESHOLDS.cpu.warning,
      currentValue: metrics.cpu,
      unit: "%",
      severity: "warning",
    });
  }
  
  // Check Memory
  if (metrics.memory >= DEFAULT_THRESHOLDS.memory.critical) {
    alerts.push({
      type: "memory",
      threshold: DEFAULT_THRESHOLDS.memory.critical,
      currentValue: metrics.memory,
      unit: "%",
      severity: "critical",
    });
  } else if (metrics.memory >= DEFAULT_THRESHOLDS.memory.warning) {
    alerts.push({
      type: "memory",
      threshold: DEFAULT_THRESHOLDS.memory.warning,
      currentValue: metrics.memory,
      unit: "%",
      severity: "warning",
    });
  }
  
  // Check Disk
  if (metrics.disk >= DEFAULT_THRESHOLDS.disk.critical) {
    alerts.push({
      type: "disk",
      threshold: DEFAULT_THRESHOLDS.disk.critical,
      currentValue: metrics.disk,
      unit: "%",
      severity: "critical",
    });
  } else if (metrics.disk >= DEFAULT_THRESHOLDS.disk.warning) {
    alerts.push({
      type: "disk",
      threshold: DEFAULT_THRESHOLDS.disk.warning,
      currentValue: metrics.disk,
      unit: "%",
      severity: "warning",
    });
  }
  
  // Check Response Time
  if (metrics.responseTime >= DEFAULT_THRESHOLDS.responseTime.critical) {
    alerts.push({
      type: "responseTime",
      threshold: DEFAULT_THRESHOLDS.responseTime.critical,
      currentValue: metrics.responseTime,
      unit: "ms",
      severity: "critical",
    });
  } else if (metrics.responseTime >= DEFAULT_THRESHOLDS.responseTime.warning) {
    alerts.push({
      type: "responseTime",
      threshold: DEFAULT_THRESHOLDS.responseTime.warning,
      currentValue: metrics.responseTime,
      unit: "ms",
      severity: "warning",
    });
  }
  
  // Check Error Rate
  if (metrics.errorRate >= DEFAULT_THRESHOLDS.errorRate.critical) {
    alerts.push({
      type: "errorRate",
      threshold: DEFAULT_THRESHOLDS.errorRate.critical,
      currentValue: metrics.errorRate,
      unit: "%",
      severity: "critical",
    });
  } else if (metrics.errorRate >= DEFAULT_THRESHOLDS.errorRate.warning) {
    alerts.push({
      type: "errorRate",
      threshold: DEFAULT_THRESHOLDS.errorRate.warning,
      currentValue: metrics.errorRate,
      unit: "%",
      severity: "warning",
    });
  }
  
  // Only send email for critical alerts
  const criticalAlerts = alerts.filter(a => a.severity === "critical");
  
  if (criticalAlerts.length > 0) {
    await sendAlertEmail(criticalAlerts, metrics.hostname);
  }
}

// Get cooldown status for all alert types
export function getCooldownStatus(): Record<string, { inCooldown: boolean; remainingMs: number }> {
  const status: Record<string, { inCooldown: boolean; remainingMs: number }> = {};
  const now = Date.now();
  
  for (const type of Object.keys(DEFAULT_THRESHOLDS) as AlertType[]) {
    for (const severity of ["warning", "critical"] as const) {
      const key = `${type}_${severity}`;
      const lastAlert = alertCooldowns.get(key);
      
      if (lastAlert) {
        const elapsed = now - lastAlert;
        const remaining = Math.max(0, COOLDOWN_PERIOD - elapsed);
        status[key] = {
          inCooldown: remaining > 0,
          remainingMs: remaining,
        };
      } else {
        status[key] = {
          inCooldown: false,
          remainingMs: 0,
        };
      }
    }
  }
  
  return status;
}

// Clear cooldown for testing
export function clearCooldown(alertKey?: string): void {
  if (alertKey) {
    alertCooldowns.delete(alertKey);
  } else {
    alertCooldowns.clear();
  }
}
