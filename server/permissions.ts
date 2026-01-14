import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { adminRoles, userAdminRoles, users, activityLogs } from "../drizzle/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import { verifyToken } from "./adminAuth";

// ============================================
// PERMISSION DEFINITIONS
// ============================================

/**
 * Permission categories and their specific permissions
 * Format: category.action
 */
export const PERMISSIONS = {
  // Dashboard
  "dashboard.view": "Xem dashboard",
  "dashboard.analytics": "Xem thống kê chi tiết",
  
  // Products
  "products.view": "Xem danh sách sản phẩm",
  "products.create": "Tạo sản phẩm mới",
  "products.edit": "Chỉnh sửa sản phẩm",
  "products.delete": "Xóa sản phẩm",
  "products.categories": "Quản lý danh mục sản phẩm",
  
  // News/Blog
  "news.view": "Xem danh sách tin tức",
  "news.create": "Tạo bài viết mới",
  "news.edit": "Chỉnh sửa bài viết",
  "news.delete": "Xóa bài viết",
  "news.publish": "Xuất bản bài viết",
  
  // Contacts & Quotes
  "contacts.view": "Xem liên hệ",
  "contacts.reply": "Trả lời liên hệ",
  "contacts.delete": "Xóa liên hệ",
  "quotes.view": "Xem yêu cầu báo giá",
  "quotes.reply": "Trả lời báo giá",
  "quotes.delete": "Xóa báo giá",
  
  // Job Applications
  "applications.view": "Xem đơn ứng tuyển",
  "applications.manage": "Quản lý đơn ứng tuyển",
  "applications.delete": "Xóa đơn ứng tuyển",
  "jobs.view": "Xem vị trí tuyển dụng",
  "jobs.create": "Tạo vị trí tuyển dụng",
  "jobs.edit": "Chỉnh sửa vị trí tuyển dụng",
  "jobs.delete": "Xóa vị trí tuyển dụng",
  
  // Case Studies
  "casestudies.view": "Xem case studies",
  "casestudies.create": "Tạo case study mới",
  "casestudies.edit": "Chỉnh sửa case study",
  "casestudies.delete": "Xóa case study",
  
  // Newsletter
  "newsletter.view": "Xem danh sách đăng ký",
  "newsletter.export": "Xuất danh sách email",
  "newsletter.delete": "Xóa đăng ký",
  
  // Users & Roles
  "users.view": "Xem danh sách người dùng",
  "users.create": "Tạo người dùng mới",
  "users.edit": "Chỉnh sửa người dùng",
  "users.delete": "Xóa người dùng",
  "users.roles": "Quản lý vai trò người dùng",
  "roles.view": "Xem danh sách vai trò",
  "roles.create": "Tạo vai trò mới",
  "roles.edit": "Chỉnh sửa vai trò",
  "roles.delete": "Xóa vai trò",
  
  // Settings
  "settings.view": "Xem cài đặt",
  "settings.edit": "Chỉnh sửa cài đặt",
  "settings.seo": "Quản lý SEO",
  "settings.security": "Quản lý bảo mật",
  
  // Media
  "media.view": "Xem thư viện media",
  "media.upload": "Upload file",
  "media.delete": "Xóa file",
  
  // Reports
  "reports.view": "Xem báo cáo",
  "reports.export": "Xuất báo cáo",
  "reports.schedule": "Lên lịch báo cáo",
  
  // System
  "system.logs": "Xem logs hệ thống",
  "system.backup": "Sao lưu dữ liệu",
  "system.maintenance": "Bảo trì hệ thống",
} as const;

export type Permission = keyof typeof PERMISSIONS;

// Permission categories for grouping in UI
export const PERMISSION_CATEGORIES = {
  dashboard: {
    name: "Dashboard",
    permissions: ["dashboard.view", "dashboard.analytics"],
  },
  products: {
    name: "Sản phẩm",
    permissions: ["products.view", "products.create", "products.edit", "products.delete", "products.categories"],
  },
  news: {
    name: "Tin tức",
    permissions: ["news.view", "news.create", "news.edit", "news.delete", "news.publish"],
  },
  contacts: {
    name: "Liên hệ & Báo giá",
    permissions: ["contacts.view", "contacts.reply", "contacts.delete", "quotes.view", "quotes.reply", "quotes.delete"],
  },
  applications: {
    name: "Tuyển dụng",
    permissions: ["applications.view", "applications.manage", "applications.delete", "jobs.view", "jobs.create", "jobs.edit", "jobs.delete"],
  },
  casestudies: {
    name: "Case Studies",
    permissions: ["casestudies.view", "casestudies.create", "casestudies.edit", "casestudies.delete"],
  },
  newsletter: {
    name: "Newsletter",
    permissions: ["newsletter.view", "newsletter.export", "newsletter.delete"],
  },
  users: {
    name: "Người dùng & Vai trò",
    permissions: ["users.view", "users.create", "users.edit", "users.delete", "users.roles", "roles.view", "roles.create", "roles.edit", "roles.delete"],
  },
  settings: {
    name: "Cài đặt",
    permissions: ["settings.view", "settings.edit", "settings.seo", "settings.security"],
  },
  media: {
    name: "Media",
    permissions: ["media.view", "media.upload", "media.delete"],
  },
  reports: {
    name: "Báo cáo",
    permissions: ["reports.view", "reports.export", "reports.schedule"],
  },
  system: {
    name: "Hệ thống",
    permissions: ["system.logs", "system.backup", "system.maintenance"],
  },
} as const;

// Default roles with their permissions
export const DEFAULT_ROLES = {
  super_admin: {
    name: "Super Admin",
    description: "Quyền cao nhất, có thể truy cập tất cả chức năng",
    permissions: Object.keys(PERMISSIONS) as Permission[],
    isSystem: true,
  },
  admin: {
    name: "Admin",
    description: "Quản trị viên, có thể quản lý nội dung và người dùng",
    permissions: [
      "dashboard.view", "dashboard.analytics",
      "products.view", "products.create", "products.edit", "products.delete", "products.categories",
      "news.view", "news.create", "news.edit", "news.delete", "news.publish",
      "contacts.view", "contacts.reply", "contacts.delete",
      "quotes.view", "quotes.reply", "quotes.delete",
      "applications.view", "applications.manage", "applications.delete",
      "jobs.view", "jobs.create", "jobs.edit", "jobs.delete",
      "casestudies.view", "casestudies.create", "casestudies.edit", "casestudies.delete",
      "newsletter.view", "newsletter.export", "newsletter.delete",
      "users.view", "users.create", "users.edit",
      "settings.view", "settings.edit", "settings.seo",
      "media.view", "media.upload", "media.delete",
      "reports.view", "reports.export",
    ] as Permission[],
    isSystem: true,
  },
  editor: {
    name: "Editor",
    description: "Biên tập viên, có thể quản lý nội dung",
    permissions: [
      "dashboard.view",
      "products.view", "products.create", "products.edit",
      "news.view", "news.create", "news.edit", "news.publish",
      "contacts.view", "contacts.reply",
      "quotes.view", "quotes.reply",
      "casestudies.view", "casestudies.create", "casestudies.edit",
      "media.view", "media.upload",
    ] as Permission[],
    isSystem: true,
  },
  viewer: {
    name: "Viewer",
    description: "Chỉ có quyền xem",
    permissions: [
      "dashboard.view",
      "products.view",
      "news.view",
      "contacts.view",
      "quotes.view",
      "applications.view",
      "jobs.view",
      "casestudies.view",
      "newsletter.view",
      "media.view",
      "reports.view",
    ] as Permission[],
    isSystem: true,
  },
};

// ============================================
// PERMISSION CHECK FUNCTIONS
// ============================================

/**
 * Get user's permissions from their roles
 */
export async function getUserPermissions(userId: number): Promise<Permission[]> {
  const db = await getDb();
  if (!db) return [];

  // Get user's roles
  const userRoles = await db
    .select({
      roleId: userAdminRoles.roleId,
    })
    .from(userAdminRoles)
    .where(eq(userAdminRoles.userId, userId));

  if (userRoles.length === 0) {
    // Check if user is admin by role field in users table (legacy support)
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user?.role === "admin") {
      // Return all permissions for legacy admin
      return Object.keys(PERMISSIONS) as Permission[];
    }
    if (user?.role === "editor") {
      return DEFAULT_ROLES.editor.permissions;
    }
    return [];
  }

  // Get permissions from roles
  const roleIds = userRoles.map(r => r.roleId);
  const roles = await db
    .select({
      permissions: adminRoles.permissions,
    })
    .from(adminRoles)
    .where(inArray(adminRoles.id, roleIds));

  // Merge all permissions
  const allPermissions = new Set<Permission>();
  for (const role of roles) {
    if (role.permissions) {
      const perms = JSON.parse(role.permissions) as Permission[];
      perms.forEach(p => allPermissions.add(p));
    }
  }

  return Array.from(allPermissions);
}

/**
 * Check if user has a specific permission
 */
export async function hasPermission(userId: number, permission: Permission): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 */
export async function hasAnyPermission(userId: number, permissions: Permission[]): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId);
  return permissions.some(p => userPermissions.includes(p));
}

/**
 * Check if user has all of the specified permissions
 */
export async function hasAllPermissions(userId: number, permissions: Permission[]): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId);
  return permissions.every(p => userPermissions.includes(p));
}

// Helper function to log role audit
async function logRoleAudit(userId: number, action: "create" | "update" | "delete", resourceType: string, resourceId: number, details: string) {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(activityLogs).values({
      userId,
      action,
      entityType: resourceType,
      entityId: resourceId,
      entityName: details,
      status: "success",
    });
  } catch (error) {
    console.error("[RoleAudit] Error logging:", error);
  }
}

// ============================================
// PERMISSION ROUTER
// ============================================

export const permissionsRouter = router({
  // Get all permission definitions
  getPermissions: publicProcedure.query(async () => {
    return {
      permissions: PERMISSIONS,
      categories: PERMISSION_CATEGORIES,
    };
  }),

  // Get user's permissions (protected)
  getUserPermissions: protectedProcedure.query(async ({ ctx }) => {
    const permissions = await getUserPermissions(ctx.user?.id || 0);
    return { permissions };
  }),

  // Check if user has permission
  checkPermission: protectedProcedure
    .input(z.object({ permission: z.string() }))
    .query(async ({ input, ctx }) => {
      const has = await hasPermission(ctx.user?.id || 0, input.permission as Permission);
      return { hasPermission: has };
    }),

  // List all roles (protected)
  listRoles: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(adminRoles);
  }),

  // List users with their roles
  listUsersWithRoles: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const allUsers = await db.select().from(users);
    
    // Get roles for each user
    const usersWithRoles = await Promise.all(
      allUsers.map(async (user) => {
        const userRolesData = await db
          .select({
            id: adminRoles.id,
            name: adminRoles.name,
            description: adminRoles.description,
            permissions: adminRoles.permissions,
            isSystem: adminRoles.isSystem,
          })
          .from(userAdminRoles)
          .innerJoin(adminRoles, eq(userAdminRoles.roleId, adminRoles.id))
          .where(eq(userAdminRoles.userId, user.id));

        return {
          ...user,
          adminRoles: userRolesData,
        };
      })
    );

    return usersWithRoles;
  }),

  // Create role (protected)
  createRole: protectedProcedure
    .input(z.object({
      name: z.string().min(2),
      description: z.string().optional(),
      permissions: z.array(z.string()),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database không khả dụng");

      // Check if role name exists
      const [existing] = await db
        .select()
        .from(adminRoles)
        .where(eq(adminRoles.name, input.name))
        .limit(1);

      if (existing) {
        throw new Error("Tên vai trò đã tồn tại");
      }

      const [newRole] = await db
        .insert(adminRoles)
        .values({
          name: input.name,
          description: input.description || null,
          permissions: JSON.stringify(input.permissions),
          isSystem: "false",
        })
        .$returningId();

      // Log audit
      await logRoleAudit(ctx.user?.id || 0, "create", "role", newRole.id, `Tạo vai trò: ${input.name}`);

      return { success: true, roleId: newRole.id };
    }),

  // Update role (protected)
  updateRole: protectedProcedure
    .input(z.object({
      roleId: z.number(),
      name: z.string().min(2).optional(),
      description: z.string().optional(),
      permissions: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database không khả dụng");

      const [role] = await db
        .select()
        .from(adminRoles)
        .where(eq(adminRoles.id, input.roleId))
        .limit(1);

      if (!role) throw new Error("Không tìm thấy vai trò");

      if (role.isSystem === "true" && input.name && input.name !== role.name) {
        throw new Error("Không thể đổi tên vai trò hệ thống");
      }

      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (input.name) updates.name = input.name;
      if (input.description !== undefined) updates.description = input.description;
      if (input.permissions) updates.permissions = JSON.stringify(input.permissions);

      await db.update(adminRoles).set(updates).where(eq(adminRoles.id, input.roleId));

      // Log audit
      await logRoleAudit(ctx.user?.id || 0, "update", "role", input.roleId, `Cập nhật vai trò: ${role.name}`);

      return { success: true };
    }),

  // Delete role (protected)
  deleteRole: protectedProcedure
    .input(z.object({ roleId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database không khả dụng");

      const [role] = await db
        .select()
        .from(adminRoles)
        .where(eq(adminRoles.id, input.roleId))
        .limit(1);

      if (!role) throw new Error("Không tìm thấy vai trò");
      if (role.isSystem === "true") throw new Error("Không thể xóa vai trò hệ thống");

      const usersWithRole = await db
        .select({ id: userAdminRoles.id })
        .from(userAdminRoles)
        .where(eq(userAdminRoles.roleId, input.roleId))
        .limit(1);

      if (usersWithRole.length > 0) {
        throw new Error("Không thể xóa vai trò đang được sử dụng");
      }

      await db.delete(adminRoles).where(eq(adminRoles.id, input.roleId));

      // Log audit
      await logRoleAudit(ctx.user?.id || 0, "delete", "role", input.roleId, `Xóa vai trò: ${role.name}`);

      return { success: true };
    }),

  // Assign role to user (protected)
  assignRoleToUser: protectedProcedure
    .input(z.object({
      userId: z.number(),
      roleId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database không khả dụng");

      const [existing] = await db
        .select()
        .from(userAdminRoles)
        .where(and(
          eq(userAdminRoles.userId, input.userId),
          eq(userAdminRoles.roleId, input.roleId)
        ))
        .limit(1);

      if (existing) throw new Error("Người dùng đã có vai trò này");

      await db.insert(userAdminRoles).values({
        userId: input.userId,
        roleId: input.roleId,
        assignedBy: ctx.user?.id || 0,
      });

      // Log audit
      await logRoleAudit(ctx.user?.id || 0, "create", "user_role", input.userId, `Gán vai trò ${input.roleId} cho user ${input.userId}`);

      return { success: true };
    }),

  // Remove role from user (protected)
  removeRoleFromUser: protectedProcedure
    .input(z.object({
      userId: z.number(),
      roleId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database không khả dụng");

      await db
        .delete(userAdminRoles)
        .where(and(
          eq(userAdminRoles.userId, input.userId),
          eq(userAdminRoles.roleId, input.roleId)
        ));

      // Log audit
      await logRoleAudit(ctx.user?.id || 0, "delete", "user_role", input.userId, `Gỡ vai trò ${input.roleId} khỏi user ${input.userId}`);

      return { success: true };
    }),

  // Get role audit log
  getRoleAuditLog: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(50) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const logs = await db
          .select()
          .from(activityLogs)
          .where(eq(activityLogs.entityType, "role"))
          .orderBy(desc(activityLogs.createdAt))
          .limit(input.limit);

        return logs.map(log => ({
          id: log.id,
          action: log.action,
          resourceType: log.entityType,
          resourceId: log.entityId,
          details: log.entityName || log.changes || "-",
          createdAt: log.createdAt,
          userName: `User ${log.userId}`,
        }));
      } catch {
        return [];
      }
    }),

  // Initialize default roles (run once during setup)
  initializeDefaultRoles: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database không khả dụng");

    // Check if user is admin
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, ctx.user?.id || 0))
      .limit(1);

    if (user?.role !== "admin") {
      throw new Error("Chỉ admin mới có thể khởi tạo vai trò mặc định");
    }

    const results: string[] = [];

    for (const [, roleData] of Object.entries(DEFAULT_ROLES)) {
      // Check if role exists
      const [existing] = await db
        .select()
        .from(adminRoles)
        .where(eq(adminRoles.name, roleData.name))
        .limit(1);

      if (!existing) {
        await db.insert(adminRoles).values({
          name: roleData.name,
          description: roleData.description,
          permissions: JSON.stringify(roleData.permissions),
          isSystem: roleData.isSystem ? "true" : "false",
        });
        results.push(`Tạo vai trò: ${roleData.name}`);
      } else {
        // Update permissions for existing system roles
        if (existing.isSystem === "true") {
          await db
            .update(adminRoles)
            .set({
              permissions: JSON.stringify(roleData.permissions),
              description: roleData.description,
            })
            .where(eq(adminRoles.id, existing.id));
          results.push(`Cập nhật vai trò: ${roleData.name}`);
        }
      }
    }

    return {
      success: true,
      message: results.length > 0 ? results.join(", ") : "Tất cả vai trò đã tồn tại",
    };
  }),
});

export type PermissionsRouter = typeof permissionsRouter;
