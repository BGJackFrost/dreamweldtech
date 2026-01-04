/**
 * Health Check Module
 * 
 * Provides a public endpoint for uptime monitoring services
 * like UptimeRobot, Pingdom, or custom monitoring solutions.
 * 
 * Endpoint: GET /api/health
 * 
 * Returns:
 * - status: 'healthy' | 'degraded' | 'unhealthy'
 * - uptime: Server uptime in seconds
 * - timestamp: Current server time (ISO 8601)
 * - database: Database connection status
 * - memory: Memory usage statistics
 * - version: Application version
 */

import { getDb } from './db';
import { sql } from 'drizzle-orm';

// Server start time for uptime calculation
const serverStartTime = Date.now();

// Application version (from package.json or env)
const APP_VERSION = process.env.npm_package_version || '1.0.0';

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  uptimeFormatted: string;
  timestamp: string;
  version: string;
  database: {
    status: 'connected' | 'disconnected' | 'error';
    latency?: number;
    error?: string;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
    usedFormatted: string;
    totalFormatted: string;
  };
  checks: {
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message?: string;
    duration?: number;
  }[];
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  let value = bytes;
  
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  
  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Format uptime to human readable string
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);
  
  return parts.join(' ');
}

/**
 * Check database connection
 */
async function checkDatabase(): Promise<{
  status: 'connected' | 'disconnected' | 'error';
  latency?: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    // Simple query to check database connection
    const db = await getDb();
    if (!db) {
      return {
        status: 'disconnected',
        error: 'Database not configured'
      };
    }
    await db.execute(sql`SELECT 1 as health_check`);
    const latency = Date.now() - startTime;
    
    return {
      status: 'connected',
      latency
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown database error'
    };
  }
}

/**
 * Get memory usage statistics
 */
function getMemoryUsage(): HealthCheckResponse['memory'] {
  const memoryUsage = process.memoryUsage();
  const used = memoryUsage.heapUsed;
  const total = memoryUsage.heapTotal;
  const percentage = (used / total) * 100;
  
  return {
    used,
    total,
    percentage: Math.round(percentage * 100) / 100,
    usedFormatted: formatBytes(used),
    totalFormatted: formatBytes(total)
  };
}

/**
 * Main health check function
 */
export async function performHealthCheck(): Promise<HealthCheckResponse> {
  const checks: HealthCheckResponse['checks'] = [];
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  // Calculate uptime
  const uptimeSeconds = (Date.now() - serverStartTime) / 1000;
  
  // Check database
  const dbStart = Date.now();
  const dbStatus = await checkDatabase();
  const dbDuration = Date.now() - dbStart;
  
  checks.push({
    name: 'database',
    status: dbStatus.status === 'connected' ? 'pass' : 'fail',
    message: dbStatus.status === 'connected' 
      ? `Connected (${dbStatus.latency}ms latency)` 
      : dbStatus.error,
    duration: dbDuration
  });
  
  if (dbStatus.status !== 'connected') {
    overallStatus = 'unhealthy';
  }
  
  // Check memory
  const memory = getMemoryUsage();
  
  if (memory.percentage > 90) {
    checks.push({
      name: 'memory',
      status: 'fail',
      message: `Memory usage critical: ${memory.percentage.toFixed(1)}%`
    });
    overallStatus = 'unhealthy';
  } else if (memory.percentage > 80) {
    checks.push({
      name: 'memory',
      status: 'warn',
      message: `Memory usage high: ${memory.percentage.toFixed(1)}%`
    });
    if (overallStatus === 'healthy') {
      overallStatus = 'degraded';
    }
  } else {
    checks.push({
      name: 'memory',
      status: 'pass',
      message: `Memory usage normal: ${memory.percentage.toFixed(1)}%`
    });
  }
  
  // Check uptime (warn if just started)
  if (uptimeSeconds < 60) {
    checks.push({
      name: 'uptime',
      status: 'warn',
      message: 'Server recently started'
    });
    if (overallStatus === 'healthy') {
      overallStatus = 'degraded';
    }
  } else {
    checks.push({
      name: 'uptime',
      status: 'pass',
      message: `Running for ${formatUptime(uptimeSeconds)}`
    });
  }
  
  return {
    status: overallStatus,
    uptime: Math.floor(uptimeSeconds),
    uptimeFormatted: formatUptime(uptimeSeconds),
    timestamp: new Date().toISOString(),
    version: APP_VERSION,
    database: dbStatus,
    memory,
    checks
  };
}

/**
 * Simple health check (for load balancers)
 * Returns just status code without detailed info
 */
export async function performSimpleHealthCheck(): Promise<{
  status: 'ok' | 'error';
  timestamp: string;
}> {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    await db.execute(sql`SELECT 1`);
    return {
      status: 'ok',
      timestamp: new Date().toISOString()
    };
  } catch {
    return {
      status: 'error',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get server metrics for monitoring dashboards
 */
export function getServerMetrics() {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  return {
    uptime: process.uptime(),
    memory: {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external,
      arrayBuffers: memoryUsage.arrayBuffers
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system
    },
    pid: process.pid,
    platform: process.platform,
    nodeVersion: process.version
  };
}
