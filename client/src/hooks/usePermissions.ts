import { useState, useEffect, useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc";

// Permission types matching server-side definitions
export type Permission =
  | "dashboard.view" | "dashboard.analytics"
  | "products.view" | "products.create" | "products.edit" | "products.delete" | "products.categories"
  | "news.view" | "news.create" | "news.edit" | "news.delete" | "news.publish"
  | "contacts.view" | "contacts.reply" | "contacts.delete"
  | "quotes.view" | "quotes.reply" | "quotes.delete"
  | "applications.view" | "applications.manage" | "applications.delete"
  | "jobs.view" | "jobs.create" | "jobs.edit" | "jobs.delete"
  | "casestudies.view" | "casestudies.create" | "casestudies.edit" | "casestudies.delete"
  | "newsletter.view" | "newsletter.export" | "newsletter.delete"
  | "users.view" | "users.create" | "users.edit" | "users.delete" | "users.roles"
  | "roles.view" | "roles.create" | "roles.edit" | "roles.delete"
  | "settings.view" | "settings.edit" | "settings.seo" | "settings.security"
  | "media.view" | "media.upload" | "media.delete"
  | "reports.view" | "reports.export" | "reports.schedule"
  | "system.logs" | "system.backup" | "system.maintenance";

// Permission descriptions for UI
export const PERMISSION_LABELS: Record<Permission, string> = {
  "dashboard.view": "Xem dashboard",
  "dashboard.analytics": "Xem thống kê chi tiết",
  "products.view": "Xem danh sách sản phẩm",
  "products.create": "Tạo sản phẩm mới",
  "products.edit": "Chỉnh sửa sản phẩm",
  "products.delete": "Xóa sản phẩm",
  "products.categories": "Quản lý danh mục sản phẩm",
  "news.view": "Xem danh sách tin tức",
  "news.create": "Tạo bài viết mới",
  "news.edit": "Chỉnh sửa bài viết",
  "news.delete": "Xóa bài viết",
  "news.publish": "Xuất bản bài viết",
  "contacts.view": "Xem liên hệ",
  "contacts.reply": "Trả lời liên hệ",
  "contacts.delete": "Xóa liên hệ",
  "quotes.view": "Xem yêu cầu báo giá",
  "quotes.reply": "Trả lời báo giá",
  "quotes.delete": "Xóa báo giá",
  "applications.view": "Xem đơn ứng tuyển",
  "applications.manage": "Quản lý đơn ứng tuyển",
  "applications.delete": "Xóa đơn ứng tuyển",
  "jobs.view": "Xem vị trí tuyển dụng",
  "jobs.create": "Tạo vị trí tuyển dụng",
  "jobs.edit": "Chỉnh sửa vị trí tuyển dụng",
  "jobs.delete": "Xóa vị trí tuyển dụng",
  "casestudies.view": "Xem case studies",
  "casestudies.create": "Tạo case study mới",
  "casestudies.edit": "Chỉnh sửa case study",
  "casestudies.delete": "Xóa case study",
  "newsletter.view": "Xem danh sách đăng ký",
  "newsletter.export": "Xuất danh sách email",
  "newsletter.delete": "Xóa đăng ký",
  "users.view": "Xem danh sách người dùng",
  "users.create": "Tạo người dùng mới",
  "users.edit": "Chỉnh sửa người dùng",
  "users.delete": "Xóa người dùng",
  "users.roles": "Quản lý vai trò người dùng",
  "roles.view": "Xem danh sách vai trò",
  "roles.create": "Tạo vai trò mới",
  "roles.edit": "Chỉnh sửa vai trò",
  "roles.delete": "Xóa vai trò",
  "settings.view": "Xem cài đặt",
  "settings.edit": "Chỉnh sửa cài đặt",
  "settings.seo": "Quản lý SEO",
  "settings.security": "Quản lý bảo mật",
  "media.view": "Xem thư viện media",
  "media.upload": "Upload file",
  "media.delete": "Xóa file",
  "reports.view": "Xem báo cáo",
  "reports.export": "Xuất báo cáo",
  "reports.schedule": "Lên lịch báo cáo",
  "system.logs": "Xem logs hệ thống",
  "system.backup": "Sao lưu dữ liệu",
  "system.maintenance": "Bảo trì hệ thống",
};

// Menu permission mapping
export const MENU_PERMISSIONS: Record<string, Permission[]> = {
  "/admin": ["dashboard.view"],
  "/admin/homepage": ["settings.edit"],
  "/admin/products": ["products.view"],
  "/admin/categories": ["products.categories"],
  "/admin/news": ["news.view"],
  "/admin/faq": ["settings.edit"],
  "/admin/case-studies": ["casestudies.view"],
  "/admin/portfolio": ["media.view"],
  "/admin/partners": ["settings.edit"],
  "/admin/newsletter": ["newsletter.view"],
  "/admin/email-campaign": ["newsletter.view"],
  "/admin/contacts": ["contacts.view"],
  "/admin/jobs": ["jobs.view"],
  "/admin/applications": ["applications.view"],
  "/admin/users": ["users.view"],
  "/admin/admin-users": ["users.view", "users.create"],
  "/admin/roles": ["roles.view"],
  "/admin/reports": ["reports.view"],
  "/admin/backup": ["system.backup"],
  "/admin/site-settings": ["settings.edit"],
  "/admin/banners": ["settings.edit"],
  "/admin/multi-language-settings": ["settings.edit"],
  "/admin/translations": ["settings.edit"],
  "/admin/bulk-import-export": ["system.backup"],
  "/admin/activity-log": ["system.logs"],
  "/admin/notification-center": ["dashboard.view"],
  "/admin/permission-matrix": ["roles.view"],
  "/admin/settings": ["settings.view"],
  "/admin/security/2fa": ["settings.security"],
  "/admin/security/sessions": ["settings.security"],
  "/admin/security/change-password": ["settings.security"],
  "/admin/security/history": ["system.logs"],
  "/admin/security/ip-control": ["settings.security"],
  "/admin/security/audit-log": ["system.logs"],
  "/admin/security/geo-blocking": ["settings.security"],
  "/admin/security/dashboard": ["settings.security"],
  "/admin/security/score": ["settings.security"],
  "/admin/security/settings": ["settings.security"],
};

interface UsePermissionsResult {
  permissions: Permission[];
  loading: boolean;
  error: Error | null;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  canAccessMenu: (href: string) => boolean;
  refetch: () => void;
}

/**
 * Hook to check user permissions
 * Uses tRPC to fetch permissions from server and provides helper functions
 */
export function usePermissions(): UsePermissionsResult {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch permissions from server
  const { data, isLoading, error: queryError, refetch } = trpc.permissions.getUserPermissions.useQuery(
    undefined,
    {
      retry: 1,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      refetchOnWindowFocus: false,
    }
  );

  useEffect(() => {
    if (data?.permissions) {
      setPermissions(data.permissions as Permission[]);
    }
    setLoading(isLoading);
    if (queryError) {
      setError(new Error(queryError.message));
      // If error (e.g., not logged in), grant no permissions
      setPermissions([]);
    }
  }, [data, isLoading, queryError]);

  // Check if user has a specific permission
  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      return permissions.includes(permission);
    },
    [permissions]
  );

  // Check if user has any of the specified permissions
  const hasAnyPermission = useCallback(
    (perms: Permission[]): boolean => {
      return perms.some((p) => permissions.includes(p));
    },
    [permissions]
  );

  // Check if user has all of the specified permissions
  const hasAllPermissions = useCallback(
    (perms: Permission[]): boolean => {
      return perms.every((p) => permissions.includes(p));
    },
    [permissions]
  );

  // Check if user can access a menu item
  const canAccessMenu = useCallback(
    (href: string): boolean => {
      const requiredPerms = MENU_PERMISSIONS[href];
      if (!requiredPerms || requiredPerms.length === 0) {
        // No permissions required, allow access
        return true;
      }
      return hasAnyPermission(requiredPerms);
    },
    [hasAnyPermission]
  );

  return useMemo(
    () => ({
      permissions,
      loading,
      error,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      canAccessMenu,
      refetch,
    }),
    [permissions, loading, error, hasPermission, hasAnyPermission, hasAllPermissions, canAccessMenu, refetch]
  );
}

/**
 * Component wrapper that only renders children if user has required permission
 */
interface PermissionGateProps {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGate({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children,
}: PermissionGateProps): React.ReactNode {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions();

  if (loading) {
    return null; // Or a loading spinner
  }

  // Single permission check
  if (permission) {
    return hasPermission(permission) ? children : fallback;
  }

  // Multiple permissions check
  if (permissions && permissions.length > 0) {
    const hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
    return hasAccess ? children : fallback;
  }

  // No permissions specified, render children
  return children;
}

export default usePermissions;
