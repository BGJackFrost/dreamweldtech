/**
 * Admin Audit Log Service
 * Ghi log chi tiết các thao tác quản trị
 */

import { getDb } from "./db";
import { adminAuditLog } from "../drizzle/schema";
import { eq, and, gte, lte, desc, sql, like } from "drizzle-orm";

// Action types
export type AuditAction = 
  | "create"
  | "update"
  | "delete"
  | "view"
  | "export"
  | "import"
  | "publish"
  | "unpublish"
  | "approve"
  | "reject"
  | "archive"
  | "restore"
  | "login"
  | "logout"
  | "settings_change"
  | "permission_change"
  | "bulk_action";

// Resource types
export type ResourceType = 
  | "product"
  | "news"
  | "case_study"
  | "portfolio"
  | "job"
  | "partner"
  | "faq"
  | "testimonial"
  | "user"
  | "role"
  | "setting"
  | "media"
  | "category"
  | "tag"
  | "comment"
  | "contact"
  | "application"
  | "notification"
  | "report"
  | "system";

interface AuditLogEntry {
  userId: number;
  username?: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId?: number;
  resourceName?: string;
  description?: string;
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
  changedFields?: string[];
  ipAddress?: string;
  userAgent?: string;
  status?: "success" | "failed" | "partial";
  errorMessage?: string;
  durationMs?: number;
}

/**
 * Log an admin action
 */
export async function logAuditAction(entry: AuditLogEntry): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const result = await db.insert(adminAuditLog).values({
      userId: entry.userId,
      username: entry.username,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      resourceName: entry.resourceName,
      description: entry.description || generateDescription(entry),
      previousValues: entry.previousValues ? JSON.stringify(entry.previousValues) : null,
      newValues: entry.newValues ? JSON.stringify(entry.newValues) : null,
      changedFields: entry.changedFields ? JSON.stringify(entry.changedFields) : null,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
      status: entry.status || "success",
      errorMessage: entry.errorMessage,
      durationMs: entry.durationMs,
    });
    
    return result[0].insertId;
  } catch (error) {
    console.error("[Audit Log] Error logging action:", error);
    return null;
  }
}

/**
 * Generate default description for action
 */
function generateDescription(entry: AuditLogEntry): string {
  const actionLabels: Record<AuditAction, string> = {
    create: "Tạo mới",
    update: "Cập nhật",
    delete: "Xóa",
    view: "Xem",
    export: "Xuất",
    import: "Nhập",
    publish: "Xuất bản",
    unpublish: "Hủy xuất bản",
    approve: "Phê duyệt",
    reject: "Từ chối",
    archive: "Lưu trữ",
    restore: "Khôi phục",
    login: "Đăng nhập",
    logout: "Đăng xuất",
    settings_change: "Thay đổi cài đặt",
    permission_change: "Thay đổi quyền",
    bulk_action: "Thao tác hàng loạt",
  };
  
  const resourceLabels: Record<ResourceType, string> = {
    product: "sản phẩm",
    news: "tin tức",
    case_study: "case study",
    portfolio: "portfolio",
    job: "việc làm",
    partner: "đối tác",
    faq: "FAQ",
    testimonial: "đánh giá",
    user: "người dùng",
    role: "vai trò",
    setting: "cài đặt",
    media: "media",
    category: "danh mục",
    tag: "tag",
    comment: "bình luận",
    contact: "liên hệ",
    application: "đơn ứng tuyển",
    notification: "thông báo",
    report: "báo cáo",
    system: "hệ thống",
  };
  
  const action = actionLabels[entry.action] || entry.action;
  const resource = resourceLabels[entry.resourceType] || entry.resourceType;
  const name = entry.resourceName ? ` "${entry.resourceName}"` : "";
  
  return `${action} ${resource}${name}`;
}

/**
 * Get audit log entries
 */
export async function getAuditLog(options?: {
  userId?: number;
  action?: AuditAction;
  resourceType?: ResourceType;
  resourceId?: number;
  status?: "success" | "failed" | "partial";
  startDate?: Date;
  endDate?: Date;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ logs: any[]; total: number }> {
  const db = await getDb();
  if (!db) return { logs: [], total: 0 };
  
  try {
    const conditions = [];
    
    if (options?.userId) {
      conditions.push(eq(adminAuditLog.userId, options.userId));
    }
    if (options?.action) {
      conditions.push(eq(adminAuditLog.action, options.action));
    }
    if (options?.resourceType) {
      conditions.push(eq(adminAuditLog.resourceType, options.resourceType));
    }
    if (options?.resourceId) {
      conditions.push(eq(adminAuditLog.resourceId, options.resourceId));
    }
    if (options?.status) {
      conditions.push(eq(adminAuditLog.status, options.status));
    }
    if (options?.startDate) {
      conditions.push(gte(adminAuditLog.createdAt, options.startDate));
    }
    if (options?.endDate) {
      conditions.push(lte(adminAuditLog.createdAt, options.endDate));
    }
    if (options?.search) {
      conditions.push(like(adminAuditLog.description, `%${options.search}%`));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const [logs, countResult] = await Promise.all([
      db.select()
        .from(adminAuditLog)
        .where(whereClause)
        .orderBy(desc(adminAuditLog.createdAt))
        .limit(options?.limit || 50)
        .offset(options?.offset || 0),
      db.select({ count: sql<number>`count(*)` })
        .from(adminAuditLog)
        .where(whereClause),
    ]);
    
    // Parse JSON fields
    const parsedLogs = logs.map(log => ({
      ...log,
      previousValues: log.previousValues ? JSON.parse(log.previousValues) : null,
      newValues: log.newValues ? JSON.parse(log.newValues) : null,
      changedFields: log.changedFields ? JSON.parse(log.changedFields) : null,
    }));
    
    return {
      logs: parsedLogs,
      total: countResult[0]?.count || 0,
    };
  } catch (error) {
    console.error("[Audit Log] Error getting audit log:", error);
    return { logs: [], total: 0 };
  }
}

/**
 * Get audit log for a specific resource
 */
export async function getResourceAuditLog(
  resourceType: ResourceType,
  resourceId: number,
  limit: number = 20
): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const logs = await db.select()
      .from(adminAuditLog)
      .where(and(
        eq(adminAuditLog.resourceType, resourceType),
        eq(adminAuditLog.resourceId, resourceId)
      ))
      .orderBy(desc(adminAuditLog.createdAt))
      .limit(limit);
    
    return logs.map(log => ({
      ...log,
      previousValues: log.previousValues ? JSON.parse(log.previousValues) : null,
      newValues: log.newValues ? JSON.parse(log.newValues) : null,
      changedFields: log.changedFields ? JSON.parse(log.changedFields) : null,
    }));
  } catch (error) {
    console.error("[Audit Log] Error getting resource audit log:", error);
    return [];
  }
}

/**
 * Get user activity summary
 */
export async function getUserActivitySummary(
  userId: number,
  days: number = 30
): Promise<{
  totalActions: number;
  actionsByType: Record<string, number>;
  resourcesByType: Record<string, number>;
  recentActions: any[];
}> {
  const db = await getDb();
  if (!db) {
    return {
      totalActions: 0,
      actionsByType: {},
      resourcesByType: {},
      recentActions: [],
    };
  }
  
  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const logs = await db.select()
      .from(adminAuditLog)
      .where(and(
        eq(adminAuditLog.userId, userId),
        gte(adminAuditLog.createdAt, startDate)
      ))
      .orderBy(desc(adminAuditLog.createdAt));
    
    const actionsByType: Record<string, number> = {};
    const resourcesByType: Record<string, number> = {};
    
    logs.forEach(log => {
      actionsByType[log.action] = (actionsByType[log.action] || 0) + 1;
      resourcesByType[log.resourceType] = (resourcesByType[log.resourceType] || 0) + 1;
    });
    
    return {
      totalActions: logs.length,
      actionsByType,
      resourcesByType,
      recentActions: logs.slice(0, 10),
    };
  } catch (error) {
    console.error("[Audit Log] Error getting user activity summary:", error);
    return {
      totalActions: 0,
      actionsByType: {},
      resourcesByType: {},
      recentActions: [],
    };
  }
}

/**
 * Helper to create audit log middleware
 */
export function createAuditMiddleware(
  resourceType: ResourceType,
  getResourceName?: (data: any) => string
) {
  return {
    logCreate: async (
      userId: number,
      username: string,
      resourceId: number,
      newValues: any,
      ipAddress?: string,
      userAgent?: string
    ) => {
      await logAuditAction({
        userId,
        username,
        action: "create",
        resourceType,
        resourceId,
        resourceName: getResourceName ? getResourceName(newValues) : undefined,
        newValues,
        ipAddress,
        userAgent,
      });
    },
    
    logUpdate: async (
      userId: number,
      username: string,
      resourceId: number,
      previousValues: any,
      newValues: any,
      changedFields: string[],
      ipAddress?: string,
      userAgent?: string
    ) => {
      await logAuditAction({
        userId,
        username,
        action: "update",
        resourceType,
        resourceId,
        resourceName: getResourceName ? getResourceName(newValues) : undefined,
        previousValues,
        newValues,
        changedFields,
        ipAddress,
        userAgent,
      });
    },
    
    logDelete: async (
      userId: number,
      username: string,
      resourceId: number,
      previousValues: any,
      ipAddress?: string,
      userAgent?: string
    ) => {
      await logAuditAction({
        userId,
        username,
        action: "delete",
        resourceType,
        resourceId,
        resourceName: getResourceName ? getResourceName(previousValues) : undefined,
        previousValues,
        ipAddress,
        userAgent,
      });
    },
  };
}

/**
 * Clean up old audit logs (older than specified days)
 */
export async function cleanupOldAuditLogs(retentionDays: number = 90): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  try {
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const result = await db.delete(adminAuditLog)
      .where(sql`${adminAuditLog.createdAt} < ${cutoff}`);
    
    return result[0]?.affectedRows || 0;
  } catch (error) {
    console.error("[Audit Log] Error cleaning up old logs:", error);
    return 0;
  }
}


/**
 * Export audit log to CSV format
 */
export async function exportAuditLogToCsv(options?: {
  userId?: number;
  action?: AuditAction;
  resourceType?: ResourceType;
  status?: "success" | "failed" | "partial";
  startDate?: Date;
  endDate?: Date;
  search?: string;
}): Promise<string> {
  const { logs } = await getAuditLog({
    ...options,
    limit: 10000, // Max export limit
    offset: 0,
  });

  // CSV header
  const headers = [
    "ID",
    "Thời gian",
    "Người dùng",
    "User ID",
    "Thao tác",
    "Loại tài nguyên",
    "ID tài nguyên",
    "Tên tài nguyên",
    "Mô tả",
    "Trạng thái",
    "IP",
    "Các trường thay đổi",
    "Lỗi",
  ];

  // Format date for CSV
  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    return new Date(date).toLocaleString("vi-VN");
  };

  // Escape CSV field
  const escapeField = (value: any): string => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Build CSV rows
  const rows = logs.map(log => [
    log.id,
    formatDate(log.createdAt),
    log.username || "",
    log.userId,
    log.action,
    log.resourceType,
    log.resourceId || "",
    log.resourceName || "",
    log.description || "",
    log.status || "success",
    log.ipAddress || "",
    Array.isArray(log.changedFields) ? log.changedFields.join("; ") : "",
    log.errorMessage || "",
  ].map(escapeField).join(","));

  return [headers.join(","), ...rows].join("\n");
}

/**
 * Export audit log to JSON format
 */
export async function exportAuditLogToJson(options?: {
  userId?: number;
  action?: AuditAction;
  resourceType?: ResourceType;
  status?: "success" | "failed" | "partial";
  startDate?: Date;
  endDate?: Date;
  search?: string;
}): Promise<string> {
  const { logs, total } = await getAuditLog({
    ...options,
    limit: 10000, // Max export limit
    offset: 0,
  });

  return JSON.stringify({
    exportDate: new Date().toISOString(),
    totalRecords: total,
    filters: options || {},
    logs: logs.map(log => ({
      id: log.id,
      timestamp: log.createdAt,
      user: {
        id: log.userId,
        name: log.username,
      },
      action: log.action,
      resource: {
        type: log.resourceType,
        id: log.resourceId,
        name: log.resourceName,
      },
      description: log.description,
      status: log.status,
      changes: {
        fields: log.changedFields,
        previous: log.previousValues,
        new: log.newValues,
      },
      metadata: {
        ip: log.ipAddress,
        userAgent: log.userAgent,
        duration: log.durationMs,
      },
      error: log.errorMessage,
    })),
  }, null, 2);
}

/**
 * Get audit log summary for export
 */
export async function getAuditLogSummary(options?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<{
  totalActions: number;
  byAction: Record<string, number>;
  byResource: Record<string, number>;
  byStatus: Record<string, number>;
  byUser: { userId: number; username: string; count: number }[];
  topResources: { resourceType: string; resourceId: number; resourceName: string; count: number }[];
}> {
  const db = await getDb();
  if (!db) {
    return {
      totalActions: 0,
      byAction: {},
      byResource: {},
      byStatus: {},
      byUser: [],
      topResources: [],
    };
  }

  try {
    const conditions = [];
    if (options?.startDate) {
      conditions.push(gte(adminAuditLog.createdAt, options.startDate));
    }
    if (options?.endDate) {
      conditions.push(lte(adminAuditLog.createdAt, options.endDate));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get all logs for summary
    const logs = await db.select()
      .from(adminAuditLog)
      .where(whereClause);

    const byAction: Record<string, number> = {};
    const byResource: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const userCounts: Record<number, { username: string; count: number }> = {};
    const resourceCounts: Record<string, { resourceType: string; resourceId: number; resourceName: string; count: number }> = {};

    logs.forEach(log => {
      // By action
      byAction[log.action] = (byAction[log.action] || 0) + 1;
      
      // By resource
      byResource[log.resourceType] = (byResource[log.resourceType] || 0) + 1;
      
      // By status
      const status = log.status || "success";
      byStatus[status] = (byStatus[status] || 0) + 1;
      
      // By user
      if (!userCounts[log.userId]) {
        userCounts[log.userId] = { username: log.username || `User ${log.userId}`, count: 0 };
      }
      userCounts[log.userId].count++;
      
      // By resource (specific)
      if (log.resourceId) {
        const key = `${log.resourceType}-${log.resourceId}`;
        if (!resourceCounts[key]) {
          resourceCounts[key] = {
            resourceType: log.resourceType,
            resourceId: log.resourceId,
            resourceName: log.resourceName || "",
            count: 0,
          };
        }
        resourceCounts[key].count++;
      }
    });

    return {
      totalActions: logs.length,
      byAction,
      byResource,
      byStatus,
      byUser: Object.entries(userCounts)
        .map(([userId, data]) => ({ userId: parseInt(userId), ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      topResources: Object.values(resourceCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    };
  } catch (error) {
    console.error("[Audit Log] Error getting summary:", error);
    return {
      totalActions: 0,
      byAction: {},
      byResource: {},
      byStatus: {},
      byUser: [],
      topResources: [],
    };
  }
}
