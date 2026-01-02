import { Request, Response, NextFunction } from 'express';
import { getDb } from './db';
import { activityLogs } from '../drizzle/schema';

export interface ActivityLogEntry {
  action: 'create' | 'update' | 'delete' | 'export' | 'import' | 'login' | 'logout' | 'view';
  entityType: string;
  entityId?: number;
  entityName?: string;
  status: 'success' | 'failure';
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Extract action from HTTP method
 */
function getActionFromMethod(method: string): ActivityLogEntry['action'] {
  switch (method) {
    case 'POST':
      return 'create';
    case 'GET':
      return 'view';
    case 'PUT':
    case 'PATCH':
      return 'update';
    case 'DELETE':
      return 'delete';
    default:
      return 'view';
  }
}

/**
 * Extract entity type from request path
 */
function getEntityTypeFromPath(path: string): string {
  const segments = path.split('/').filter(Boolean);
  if (segments.length >= 3 && segments[0] === 'api') {
    return segments[1]; // e.g., 'products', 'news', 'contacts'
  }
  return 'unknown';
}

/**
 * Get client IP address
 */
function getClientIp(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
    (req.socket.remoteAddress as string) ||
    'unknown'
  );
}

/**
 * Log activity to database
 */
export async function logActivity(entry: ActivityLogEntry, userId?: number) {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[ActivityLogger] Database connection failed');
      return;
    }
    
    await db.insert(activityLogs).values({
      userId: userId || 0,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId || undefined,
      entityName: entry.entityName || undefined,
      status: entry.status === 'success' ? 'success' : 'failed',
      newValues: entry.details ? JSON.stringify(entry.details) : undefined,
      ipAddress: entry.ipAddress || 'unknown',
      userAgent: entry.userAgent || 'unknown',
    });
  } catch (error) {
    console.error('[ActivityLogger] Error logging activity:', error);
  }
}

/**
 * Activity logging middleware
 */
export function createActivityLogger() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip logging for certain paths
    if (req.path.startsWith('/health') || req.path.startsWith('/metrics')) {
      return next();
    }

    const originalSend = res.send;
    const startTime = Date.now();
    const clientIp = getClientIp(req);
    const userAgent = req.get('user-agent') || 'unknown';

    res.send = function (data: any) {
      const duration = Date.now() - startTime;
      const isSuccess = res.statusCode < 400;
      const isModifyingRequest = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);

      // Log modifying requests (POST, PUT, PATCH, DELETE)
      if (isModifyingRequest) {
        const action = getActionFromMethod(req.method);
        const entityType = getEntityTypeFromPath(req.path);
        const userId = (req as any).user?.id;

        logActivity(
          {
            action,
            entityType,
            status: isSuccess ? 'success' : 'failure',
            ipAddress: clientIp,
            userAgent,
            details: {
              method: req.method,
              path: req.path,
              statusCode: res.statusCode,
              duration,
              query: req.query,
            },
          },
          userId
        );
      }

      // Log auth actions
      if (req.path.includes('/auth/login')) {
        const userId = (req as any).user?.id;
        logActivity(
          {
            action: 'login',
            entityType: 'auth',
            status: isSuccess ? 'success' : 'failure',
            ipAddress: clientIp,
            userAgent,
            details: {
              email: req.body?.email,
              statusCode: res.statusCode,
            },
          },
          userId
        );
      }

      if (req.path.includes('/auth/logout')) {
        const userId = (req as any).user?.id;
        logActivity(
          {
            action: 'logout',
            entityType: 'auth',
            status: 'success',
            ipAddress: clientIp,
            userAgent,
          },
          userId
        );
      }

      return originalSend.call(this, data);
    };

    next();
  };
}

/**
 * Log specific activity manually
 */
export async function logCustomActivity(
  action: ActivityLogEntry['action'],
  entityType: string,
  details: Record<string, any>,
  userId?: number
) {
  await logActivity(
    {
      action,
      entityType,
      status: 'success',
      details,
    },
    userId
  );
}
