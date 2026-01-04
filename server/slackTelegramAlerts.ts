/**
 * Slack and Telegram Alert Service
 * Sends notifications to Slack channels and Telegram chats
 */

// Alert types
export type AlertSeverity = "info" | "warning" | "critical";

export interface AlertPayload {
  title: string;
  message: string;
  severity: AlertSeverity;
  metrics?: {
    cpu?: number;
    memory?: number;
    disk?: number;
    responseTime?: number;
    errorRate?: number;
  };
  hostname?: string;
  timestamp?: string;
}

// Slack colors based on severity
const SLACK_COLORS: Record<AlertSeverity, string> = {
  info: "#36a64f",
  warning: "#ffcc00",
  critical: "#ff0000",
};

// Telegram emoji based on severity
const TELEGRAM_EMOJI: Record<AlertSeverity, string> = {
  info: "ℹ️",
  warning: "⚠️",
  critical: "🚨",
};

/**
 * Send alert to Slack via webhook
 */
export async function sendSlackAlert(payload: AlertPayload): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.log("[Slack Alert] SLACK_WEBHOOK_URL not configured");
    return false;
  }
  
  try {
    const fields = [];
    
    if (payload.metrics) {
      if (payload.metrics.cpu !== undefined) {
        fields.push({ title: "CPU", value: `${payload.metrics.cpu}%`, short: true });
      }
      if (payload.metrics.memory !== undefined) {
        fields.push({ title: "Memory", value: `${payload.metrics.memory}%`, short: true });
      }
      if (payload.metrics.disk !== undefined) {
        fields.push({ title: "Disk", value: `${payload.metrics.disk}%`, short: true });
      }
      if (payload.metrics.responseTime !== undefined) {
        fields.push({ title: "Response Time", value: `${payload.metrics.responseTime}ms`, short: true });
      }
      if (payload.metrics.errorRate !== undefined) {
        fields.push({ title: "Error Rate", value: `${payload.metrics.errorRate}%`, short: true });
      }
    }
    
    if (payload.hostname) {
      fields.push({ title: "Hostname", value: payload.hostname, short: true });
    }
    
    const slackPayload = {
      attachments: [
        {
          color: SLACK_COLORS[payload.severity],
          title: payload.title,
          text: payload.message,
          fields,
          footer: "Dreamweldtech Monitoring",
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };
    
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slackPayload),
    });
    
    if (response.ok) {
      console.log("[Slack Alert] Sent successfully");
      return true;
    } else {
      console.error("[Slack Alert] Failed:", response.status, await response.text());
      return false;
    }
  } catch (error) {
    console.error("[Slack Alert] Error:", error);
    return false;
  }
}

/**
 * Send alert to Telegram via bot
 */
export async function sendTelegramAlert(payload: AlertPayload): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  if (!botToken || !chatId) {
    console.log("[Telegram Alert] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured");
    return false;
  }
  
  try {
    const emoji = TELEGRAM_EMOJI[payload.severity];
    
    let metricsText = "";
    if (payload.metrics) {
      const parts = [];
      if (payload.metrics.cpu !== undefined) parts.push(`CPU: ${payload.metrics.cpu}%`);
      if (payload.metrics.memory !== undefined) parts.push(`Memory: ${payload.metrics.memory}%`);
      if (payload.metrics.disk !== undefined) parts.push(`Disk: ${payload.metrics.disk}%`);
      if (payload.metrics.responseTime !== undefined) parts.push(`Response: ${payload.metrics.responseTime}ms`);
      if (payload.metrics.errorRate !== undefined) parts.push(`Errors: ${payload.metrics.errorRate}%`);
      if (parts.length > 0) {
        metricsText = `\n\n📊 *Metrics:*\n${parts.join("\n")}`;
      }
    }
    
    const hostnameText = payload.hostname ? `\n🖥 *Server:* ${payload.hostname}` : "";
    
    const text = `${emoji} *${payload.title}*\n\n${payload.message}${metricsText}${hostnameText}\n\n🕐 ${payload.timestamp || new Date().toLocaleString("vi-VN")}`;
    
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
      }),
    });
    
    const result = await response.json();
    
    if (result.ok) {
      console.log("[Telegram Alert] Sent successfully");
      return true;
    } else {
      console.error("[Telegram Alert] Failed:", result.description);
      return false;
    }
  } catch (error) {
    console.error("[Telegram Alert] Error:", error);
    return false;
  }
}

/**
 * Send alert to all configured channels
 */
export async function sendMultiChannelAlert(payload: AlertPayload): Promise<{
  slack: boolean;
  telegram: boolean;
}> {
  const [slack, telegram] = await Promise.all([
    sendSlackAlert(payload),
    sendTelegramAlert(payload),
  ]);
  
  return { slack, telegram };
}

/**
 * Test Slack webhook connection
 */
export async function testSlackConnection(): Promise<{ success: boolean; message: string }> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  
  if (!webhookUrl) {
    return { success: false, message: "SLACK_WEBHOOK_URL not configured" };
  }
  
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "🔔 Test message from Dreamweldtech Monitoring - Connection successful!",
      }),
    });
    
    if (response.ok) {
      return { success: true, message: "Slack webhook connected successfully" };
    } else {
      return { success: false, message: `Slack webhook error: ${response.status}` };
    }
  } catch (error) {
    return { success: false, message: `Slack connection error: ${error}` };
  }
}

/**
 * Test Telegram bot connection
 */
export async function testTelegramConnection(): Promise<{ success: boolean; message: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  if (!botToken) {
    return { success: false, message: "TELEGRAM_BOT_TOKEN not configured" };
  }
  
  if (!chatId) {
    return { success: false, message: "TELEGRAM_CHAT_ID not configured" };
  }
  
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: "🔔 Test message from Dreamweldtech Monitoring - Connection successful!",
      }),
    });
    
    const result = await response.json();
    
    if (result.ok) {
      return { success: true, message: "Telegram bot connected successfully" };
    } else {
      return { success: false, message: `Telegram error: ${result.description}` };
    }
  } catch (error) {
    return { success: false, message: `Telegram connection error: ${error}` };
  }
}

/**
 * Check which alert channels are configured
 */
export function getConfiguredChannels(): {
  email: boolean;
  slack: boolean;
  telegram: boolean;
} {
  return {
    email: !!(process.env.ADMIN_ALERT_EMAIL || process.env.OWNER_EMAIL),
    slack: !!process.env.SLACK_WEBHOOK_URL,
    telegram: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
  };
}
