import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import os from "os";
import { checkAndSendAlerts, getCooldownStatus, clearCooldown, DEFAULT_THRESHOLDS } from "./alertEmail";
import { testSlackConnection, testTelegramConnection, getConfiguredChannels } from "./slackTelegramAlerts";

// In-memory metrics storage
let appMetrics = {
  totalRequests: 0,
  errorCount: 0,
  totalResponseTime: 0,
  requestsPerMinute: 0,
  lastMinuteRequests: 0,
  lastMinuteTimestamp: Date.now(),
  recentErrors: [] as Array<{ timestamp: string; message: string; path: string }>,
  startTime: Date.now(),
};

// Track request for metrics
export function trackRequest(responseTime: number, isError: boolean = false, errorMessage?: string, path?: string) {
  appMetrics.totalRequests++;
  appMetrics.totalResponseTime += responseTime;
  
  if (isError) {
    appMetrics.errorCount++;
    appMetrics.recentErrors.unshift({
      timestamp: new Date().toISOString(),
      message: errorMessage || "Unknown error",
      path: path || "unknown",
    });
    // Keep only last 50 errors
    if (appMetrics.recentErrors.length > 50) {
      appMetrics.recentErrors = appMetrics.recentErrors.slice(0, 50);
    }
  }
  
  // Calculate requests per minute
  const now = Date.now();
  if (now - appMetrics.lastMinuteTimestamp >= 60000) {
    appMetrics.requestsPerMinute = appMetrics.lastMinuteRequests;
    appMetrics.lastMinuteRequests = 1;
    appMetrics.lastMinuteTimestamp = now;
  } else {
    appMetrics.lastMinuteRequests++;
  }
}

// Get system metrics
function getSystemMetrics() {
  const cpus = os.cpus();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  
  // Calculate CPU usage
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
    cpu: {
      usage: cpuUsage,
      cores: cpus.length,
      model: cpus[0]?.model || "Unknown",
      speed: cpus[0]?.speed || 0,
    },
    memory: {
      total: totalMemory,
      used: usedMemory,
      free: freeMemory,
      usage: memoryUsage,
    },
    loadAverage: os.loadavg(),
    uptime: os.uptime(),
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    nodeVersion: process.version,
  };
}

// Get application metrics
function getAppMetrics() {
  const uptime = Date.now() - appMetrics.startTime;
  const avgResponseTime = appMetrics.totalRequests > 0 
    ? Math.round(appMetrics.totalResponseTime / appMetrics.totalRequests) 
    : 0;
  const errorRate = appMetrics.totalRequests > 0 
    ? Math.round((appMetrics.errorCount / appMetrics.totalRequests) * 100 * 100) / 100 
    : 0;
  
  return {
    uptime,
    totalRequests: appMetrics.totalRequests,
    errorCount: appMetrics.errorCount,
    errorRate,
    avgResponseTime,
    requestsPerMinute: appMetrics.requestsPerMinute,
    recentErrors: appMetrics.recentErrors.slice(0, 10),
  };
}

// Check alerts and send emails
async function checkAlerts() {
  const system = getSystemMetrics();
  const app = getAppMetrics();
  
  await checkAndSendAlerts({
    cpu: system.cpu.usage,
    memory: system.memory.usage,
    disk: 50, // Placeholder - would need to implement disk check
    responseTime: app.avgResponseTime,
    errorRate: app.errorRate,
    hostname: system.hostname,
  });
}

// Monitoring router
export const monitoringRouter = router({
  // Get all metrics
  getMetrics: protectedProcedure.query(async () => {
    const system = getSystemMetrics();
    const app = getAppMetrics();
    
    // Check alerts in background
    checkAlerts().catch(console.error);
    
    return {
      system,
      app,
      timestamp: new Date().toISOString(),
    };
  }),
  
  // Get system info only
  getSystemInfo: protectedProcedure.query(() => {
    return getSystemMetrics();
  }),
  
  // Get app metrics only
  getAppMetrics: protectedProcedure.query(() => {
    return getAppMetrics();
  }),
  
  // Get alert thresholds
  getThresholds: protectedProcedure.query(() => {
    return DEFAULT_THRESHOLDS;
  }),
  
  // Get cooldown status
  getCooldownStatus: protectedProcedure.query(() => {
    return getCooldownStatus();
  }),
  
  // Clear cooldown (for testing)
  clearCooldown: protectedProcedure
    .input(z.object({ alertKey: z.string().optional() }))
    .mutation(({ input }) => {
      clearCooldown(input.alertKey);
      return { success: true };
    }),
  
  // Test alert email
  testAlertEmail: protectedProcedure.mutation(async () => {
    const system = getSystemMetrics();
    
    // Force send a test alert
    const { sendAlertEmail } = await import("./alertEmail");
    
    const result = await sendAlertEmail([
      {
        type: "cpu",
        threshold: 90,
        currentValue: 95,
        unit: "%",
        severity: "critical",
      },
    ], system.hostname);
    
    return { success: result, message: result ? "Test alert sent" : "Failed to send test alert (check admin email config)" };
  }),
  
  // Get configured alert channels
  getAlertChannels: protectedProcedure.query(() => {
    return getConfiguredChannels();
  }),
  
  // Test Slack connection
  testSlack: protectedProcedure.mutation(async () => {
    return await testSlackConnection();
  }),
  
  // Test Telegram connection
  testTelegram: protectedProcedure.mutation(async () => {
    return await testTelegramConnection();
  }),
  
  // Health check (public)
  health: publicProcedure.query(() => {
    const system = getSystemMetrics();
    const app = getAppMetrics();
    
    const status = system.cpu.usage < 90 && system.memory.usage < 95 && app.errorRate < 10
      ? "healthy"
      : system.cpu.usage >= 95 || system.memory.usage >= 98 || app.errorRate >= 20
        ? "critical"
        : "warning";
    
    return {
      status,
      uptime: app.uptime,
      timestamp: new Date().toISOString(),
    };
  }),
});

export type MonitoringRouter = typeof monitoringRouter;
