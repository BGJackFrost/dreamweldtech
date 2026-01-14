import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { users, adminRoles, userAdminRoles, activityLogs } from "../drizzle/schema";
import { eq, and, desc, sql, like, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { checkPermissionOrThrow } from "./permissionMiddleware";

// ============================================
// ADMIN USERS ROUTER
// ============================================

export const adminUsersRouter = router({
  // List all admin users with their roles
  list: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      search: z.string().optional(),
      roleId: z.number().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      // Check permission
      await checkPermissionOrThrow(ctx.user.id, "users.view");
      
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const page = input?.page || 1;
      const limit = input?.limit || 20;
      const offset = (page - 1) * limit;
      
      // Build where conditions
      let whereConditions = sql`1=1`;
      
      if (input?.search) {
        const searchTerm = `%${input.search}%`;
        whereConditions = sql`${whereConditions} AND (u.name LIKE ${searchTerm} OR u.email LIKE ${searchTerm} OR u.username LIKE ${searchTerm})`;
      }
      
      // Get users with their roles
      const usersWithRoles = await db.execute(sql`
        SELECT 
          u.id,
          u.openId,
          u.username,
          u.name,
          u.email,
          u.loginMethod,
          u.role,
          u.createdAt,
          u.updatedAt,
          u.lastSignedIn,
          GROUP_CONCAT(DISTINCT ar.id) as roleIds,
          GROUP_CONCAT(DISTINCT ar.name) as roleNames
        FROM users u
        LEFT JOIN user_admin_roles uar ON u.id = uar.userId
        LEFT JOIN admin_roles ar ON uar.roleId = ar.id
        WHERE ${whereConditions}
        GROUP BY u.id
        ORDER BY u.createdAt DESC
        LIMIT ${limit} OFFSET ${offset}
      `);
      
      // Get total count
      const countResult = await db.execute(sql`
        SELECT COUNT(DISTINCT u.id) as total
        FROM users u
        LEFT JOIN user_admin_roles uar ON u.id = uar.userId
        WHERE ${whereConditions}
      `);
      
      const total = (countResult as any)[0]?.[0]?.total || 0;
      
      // Format results
      const formattedUsers = (usersWithRoles as any)[0]?.map((user: any) => ({
        id: user.id,
        openId: user.openId,
        username: user.username,
        name: user.name,
        email: user.email,
        loginMethod: user.loginMethod,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastSignedIn: user.lastSignedIn,
        adminRoles: user.roleIds ? user.roleIds.split(",").map((id: string, index: number) => ({
          id: parseInt(id),
          name: user.roleNames?.split(",")[index] || "",
        })) : [],
      })) || [];
      
      return {
        users: formattedUsers,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }),

  // Get single admin user by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      await checkPermissionOrThrow(ctx.user.id, "users.view");
      
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const userResult = await db.select().from(users).where(eq(users.id, input.id)).limit(1);
      if (userResult.length === 0) {
        throw new Error("User not found");
      }
      
      const user = userResult[0];
      
      // Get user's admin roles
      const userRoles = await db.execute(sql`
        SELECT ar.id, ar.name, ar.description, ar.permissions
        FROM user_admin_roles uar
        JOIN admin_roles ar ON uar.roleId = ar.id
        WHERE uar.userId = ${input.id}
      `);
      
      return {
        ...user,
        passwordHash: undefined, // Don't expose password hash
        adminRoles: (userRoles as any)[0] || [],
      };
    }),

  // Create new admin user (local account)
  create: protectedProcedure
    .input(z.object({
      username: z.string().min(3).max(100),
      password: z.string().min(8),
      name: z.string().min(1).max(255),
      email: z.string().email().optional(),
      role: z.enum(["user", "editor", "admin"]).default("admin"),
      adminRoleIds: z.array(z.number()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await checkPermissionOrThrow(ctx.user.id, "users.create");
      
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check if username already exists
      const existingUser = await db.select().from(users).where(eq(users.username, input.username)).limit(1);
      if (existingUser.length > 0) {
        throw new Error("Username already exists");
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(input.password, 12);
      
      // Generate a unique openId for local users
      const openId = `local_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // Create user
      const result = await db.insert(users).values({
        openId,
        username: input.username,
        passwordHash,
        name: input.name,
        email: input.email || null,
        loginMethod: "local",
        role: input.role,
      });
      
      const newUserId = (result as any)[0]?.insertId;
      
      // Assign admin roles if provided
      if (input.adminRoleIds && input.adminRoleIds.length > 0 && newUserId) {
        for (const roleId of input.adminRoleIds) {
          await db.insert(userAdminRoles).values({
            userId: newUserId,
            roleId,
            assignedBy: ctx.user.id,
          });
        }
      }
      
      // Log activity
      await db.insert(activityLogs).values({
        userId: ctx.user.id,
        action: "create",
        entityType: "admin_user",
        entityId: newUserId,
        entityName: input.username,
        ipAddress: ctx.req?.ip || ctx.req?.headers?.['x-forwarded-for']?.toString() || null,
      });
      
      return {
        success: true,
        message: "Admin user created successfully",
        userId: newUserId,
      };
    }),

  // Update admin user
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      username: z.string().min(3).max(100).optional(),
      password: z.string().min(8).optional(),
      name: z.string().min(1).max(255).optional(),
      email: z.string().email().optional().nullable(),
      role: z.enum(["user", "editor", "admin"]).optional(),
      adminRoleIds: z.array(z.number()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await checkPermissionOrThrow(ctx.user.id, "users.edit");
      
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check if user exists
      const existingUser = await db.select().from(users).where(eq(users.id, input.id)).limit(1);
      if (existingUser.length === 0) {
        throw new Error("User not found");
      }
      
      // Check if username is being changed and if it already exists
      if (input.username && input.username !== existingUser[0].username) {
        const usernameExists = await db.select().from(users).where(eq(users.username, input.username)).limit(1);
        if (usernameExists.length > 0) {
          throw new Error("Username already exists");
        }
      }
      
      // Build update object
      const updateData: any = {};
      if (input.username) updateData.username = input.username;
      if (input.name) updateData.name = input.name;
      if (input.email !== undefined) updateData.email = input.email;
      if (input.role) updateData.role = input.role;
      if (input.password) {
        updateData.passwordHash = await bcrypt.hash(input.password, 12);
      }
      
      // Update user
      if (Object.keys(updateData).length > 0) {
        await db.update(users).set(updateData).where(eq(users.id, input.id));
      }
      
      // Update admin roles if provided
      if (input.adminRoleIds !== undefined) {
        // Remove existing roles
        await db.delete(userAdminRoles).where(eq(userAdminRoles.userId, input.id));
        
        // Add new roles
        for (const roleId of input.adminRoleIds) {
          await db.insert(userAdminRoles).values({
            userId: input.id,
            roleId,
            assignedBy: ctx.user.id,
          });
        }
      }
      
      // Log activity
      await db.insert(activityLogs).values({
        userId: ctx.user.id,
        action: "update",
        entityType: "admin_user",
        entityId: input.id,
        entityName: existingUser[0].username || existingUser[0].name || null,
        ipAddress: ctx.req?.ip || ctx.req?.headers?.['x-forwarded-for']?.toString() || null,
      });
      
      return {
        success: true,
        message: "Admin user updated successfully",
      };
    }),

  // Delete admin user
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await checkPermissionOrThrow(ctx.user.id, "users.delete");
      
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check if user exists
      const existingUser = await db.select().from(users).where(eq(users.id, input.id)).limit(1);
      if (existingUser.length === 0) {
        throw new Error("User not found");
      }
      
      // Prevent deleting yourself
      if (input.id === ctx.user.id) {
        throw new Error("Cannot delete your own account");
      }
      
      // Delete user's admin roles first
      await db.delete(userAdminRoles).where(eq(userAdminRoles.userId, input.id));
      
      // Delete user
      await db.delete(users).where(eq(users.id, input.id));
      
      // Log activity
      await db.insert(activityLogs).values({
        userId: ctx.user.id,
        action: "delete",
        entityType: "admin_user",
        entityId: input.id,
        entityName: existingUser[0].username || existingUser[0].name || null,
        ipAddress: ctx.req?.ip || ctx.req?.headers?.['x-forwarded-for']?.toString() || null,
      });
      
      return {
        success: true,
        message: "Admin user deleted successfully",
      };
    }),

  // Get all available admin roles for dropdown
  getAvailableRoles: protectedProcedure
    .query(async ({ ctx }) => {
      await checkPermissionOrThrow(ctx.user.id, "users.view");
      
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const roles = await db.select({
        id: adminRoles.id,
        name: adminRoles.name,
        description: adminRoles.description,
        isSystem: adminRoles.isSystem,
      }).from(adminRoles).orderBy(adminRoles.name);
      
      return roles;
    }),

  // Assign role to user
  assignRole: protectedProcedure
    .input(z.object({
      userId: z.number(),
      roleId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      await checkPermissionOrThrow(ctx.user.id, "users.roles");
      
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check if assignment already exists
      const existing = await db.select().from(userAdminRoles)
        .where(and(
          eq(userAdminRoles.userId, input.userId),
          eq(userAdminRoles.roleId, input.roleId)
        ))
        .limit(1);
      
      if (existing.length > 0) {
        throw new Error("User already has this role");
      }
      
      // Assign role
      await db.insert(userAdminRoles).values({
        userId: input.userId,
        roleId: input.roleId,
        assignedBy: ctx.user.id,
      });
      
      // Get role name for logging
      const role = await db.select().from(adminRoles).where(eq(adminRoles.id, input.roleId)).limit(1);
      const user = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      
      // Log activity
      await db.insert(activityLogs).values({
        userId: ctx.user.id,
        action: "assign_role",
        entityType: "admin_user",
        entityId: input.userId,
        entityName: `${user[0]?.username || user[0]?.name} - ${role[0]?.name}`,
        ipAddress: ctx.req?.ip || ctx.req?.headers?.['x-forwarded-for']?.toString() || null,
      });
      
      return {
        success: true,
        message: "Role assigned successfully",
      };
    }),

  // Remove role from user
  removeRole: protectedProcedure
    .input(z.object({
      userId: z.number(),
      roleId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      await checkPermissionOrThrow(ctx.user.id, "users.roles");
      
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Remove role
      await db.delete(userAdminRoles)
        .where(and(
          eq(userAdminRoles.userId, input.userId),
          eq(userAdminRoles.roleId, input.roleId)
        ));
      
      // Get role name for logging
      const role = await db.select().from(adminRoles).where(eq(adminRoles.id, input.roleId)).limit(1);
      const user = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      
      // Log activity
      await db.insert(activityLogs).values({
        userId: ctx.user.id,
        action: "remove_role",
        entityType: "admin_user",
        entityId: input.userId,
        entityName: `${user[0]?.username || user[0]?.name} - ${role[0]?.name}`,
        ipAddress: ctx.req?.ip || ctx.req?.headers?.['x-forwarded-for']?.toString() || null,
      });
      
      return {
        success: true,
        message: "Role removed successfully",
      };
    }),

  // Reset user password
  resetPassword: protectedProcedure
    .input(z.object({
      userId: z.number(),
      newPassword: z.string().min(8),
    }))
    .mutation(async ({ ctx, input }) => {
      await checkPermissionOrThrow(ctx.user.id, "users.edit");
      
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check if user exists
      const existingUser = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (existingUser.length === 0) {
        throw new Error("User not found");
      }
      
      // Hash new password
      const passwordHash = await bcrypt.hash(input.newPassword, 12);
      
      // Update password
      await db.update(users)
        .set({ passwordHash })
        .where(eq(users.id, input.userId));
      
      // Log activity
      await db.insert(activityLogs).values({
        userId: ctx.user.id,
        action: "reset_password",
        entityType: "admin_user",
        entityId: input.userId,
        entityName: existingUser[0].username || existingUser[0].name || null,
        ipAddress: ctx.req?.ip || ctx.req?.headers?.['x-forwarded-for']?.toString() || null,
      });
      
      return {
        success: true,
        message: "Password reset successfully",
      };
    }),

  // Get user statistics
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      await checkPermissionOrThrow(ctx.user.id, "users.view");
      
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Get total users
      const totalResult = await db.select({ count: sql<number>`count(*)` }).from(users);
      const total = totalResult[0]?.count || 0;
      
      // Get users by role
      const byRoleResult = await db.execute(sql`
        SELECT role, COUNT(*) as count
        FROM users
        GROUP BY role
      `);
      
      // Get users with admin roles
      const withAdminRolesResult = await db.execute(sql`
        SELECT COUNT(DISTINCT userId) as count
        FROM user_admin_roles
      `);
      
      // Get recent signins (last 7 days)
      const recentSigninsResult = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM users
        WHERE lastSignedIn >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      `);
      
      return {
        total,
        byRole: (byRoleResult as any)[0] || [],
        withAdminRoles: (withAdminRolesResult as any)[0]?.[0]?.count || 0,
        recentSignins: (recentSigninsResult as any)[0]?.[0]?.count || 0,
      };
    }),
});
