import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./_core/context";
import { getUserPermissions, hasPermission, hasAnyPermission, hasAllPermissions, Permission } from "./permissions";

/**
 * Server-side permission middleware for tRPC procedures
 * This ensures that even if client-side checks are bypassed, 
 * the server will still enforce permissions
 */

// Initialize tRPC for middleware creation
const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

/**
 * Create a middleware that checks if user has a specific permission
 */
export const createPermissionMiddleware = (permission: Permission) => {
  return t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (!ctx.user?.id) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Bạn cần đăng nhập để thực hiện thao tác này",
      });
    }

    const has = await hasPermission(ctx.user.id, permission);
    if (!has) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Bạn không có quyền "${permission}" để thực hiện thao tác này`,
      });
    }

    return next({
      ctx: {
        ...ctx,
        permission,
      },
    });
  });
};

/**
 * Create a middleware that checks if user has any of the specified permissions
 */
export const createAnyPermissionMiddleware = (permissions: Permission[]) => {
  return t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (!ctx.user?.id) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Bạn cần đăng nhập để thực hiện thao tác này",
      });
    }

    const has = await hasAnyPermission(ctx.user.id, permissions);
    if (!has) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Bạn cần có ít nhất một trong các quyền: ${permissions.join(", ")}`,
      });
    }

    return next({
      ctx: {
        ...ctx,
        permissions,
      },
    });
  });
};

/**
 * Create a middleware that checks if user has all of the specified permissions
 */
export const createAllPermissionsMiddleware = (permissions: Permission[]) => {
  return t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (!ctx.user?.id) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Bạn cần đăng nhập để thực hiện thao tác này",
      });
    }

    const has = await hasAllPermissions(ctx.user.id, permissions);
    if (!has) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Bạn cần có tất cả các quyền: ${permissions.join(", ")}`,
      });
    }

    return next({
      ctx: {
        ...ctx,
        permissions,
      },
    });
  });
};

// Require user middleware (base)
const requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ 
      code: "UNAUTHORIZED", 
      message: "Bạn cần đăng nhập để thực hiện thao tác này" 
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// Base protected procedure
const protectedProcedureBase = t.procedure.use(requireUser);

/**
 * Create a protected procedure with permission check
 * Usage: permissionProcedure("products.create").mutation(...)
 */
export const permissionProcedure = (permission: Permission) => {
  return protectedProcedureBase.use(createPermissionMiddleware(permission));
};

/**
 * Create a protected procedure that requires any of the specified permissions
 * Usage: anyPermissionProcedure(["products.edit", "products.create"]).mutation(...)
 */
export const anyPermissionProcedure = (permissions: Permission[]) => {
  return protectedProcedureBase.use(createAnyPermissionMiddleware(permissions));
};

/**
 * Create a protected procedure that requires all of the specified permissions
 * Usage: allPermissionsProcedure(["users.view", "users.edit"]).mutation(...)
 */
export const allPermissionsProcedure = (permissions: Permission[]) => {
  return protectedProcedureBase.use(createAllPermissionsMiddleware(permissions));
};

/**
 * Helper to wrap existing procedures with permission check
 * This can be used to add permission checks to existing routers
 */
export async function checkPermissionOrThrow(userId: number, permission: Permission): Promise<void> {
  const has = await hasPermission(userId, permission);
  if (!has) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Bạn không có quyền "${permission}" để thực hiện thao tác này`,
    });
  }
}

/**
 * Helper to check any permission or throw
 */
export async function checkAnyPermissionOrThrow(userId: number, permissions: Permission[]): Promise<void> {
  const has = await hasAnyPermission(userId, permissions);
  if (!has) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Bạn cần có ít nhất một trong các quyền: ${permissions.join(", ")}`,
    });
  }
}

/**
 * Permission check decorator for use in mutations
 * Returns the user's permissions for further checks if needed
 */
export async function withPermissionCheck(
  userId: number | undefined,
  permission: Permission
): Promise<Permission[]> {
  if (!userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Bạn cần đăng nhập để thực hiện thao tác này",
    });
  }

  const userPermissions = await getUserPermissions(userId);
  if (!userPermissions.includes(permission)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Bạn không có quyền "${permission}" để thực hiện thao tác này`,
    });
  }

  return userPermissions;
}
