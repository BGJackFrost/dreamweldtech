import { ReactNode } from "react";
import { useLocation, Redirect } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { usePermissions, MENU_PERMISSIONS, Permission } from "@/hooks/usePermissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, ShieldX, Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean; // If true, requires ALL permissions; if false (default), requires ANY
  requiredRole?: "admin" | "editor" | "viewer";
  fallbackToAccessDenied?: boolean;
}

/**
 * ProtectedRoute component that checks user permissions before rendering children.
 * 
 * @param permission - Single permission to check
 * @param permissions - Array of permissions to check
 * @param requireAll - If true, all permissions are required; if false, any one is sufficient
 * @param requiredRole - Legacy role-based check (deprecated, use permissions instead)
 * @param fallbackToAccessDenied - If true, redirect to AccessDenied page; if false, show inline error
 */
export function ProtectedRoute({ 
  children, 
  permission,
  permissions,
  requireAll = false,
  requiredRole,
  fallbackToAccessDenied = false,
}: ProtectedRouteProps) {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading, permissions: userPermissions } = usePermissions();

  // Show loading state while checking permissions
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check if user is logged in
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Chưa đăng nhập
            </CardTitle>
            <CardDescription>Vui lòng đăng nhập để truy cập trang này</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/admin/login")} className="w-full">
              Đăng nhập
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check permissions
  let hasAccess = true;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions) 
      : hasAnyPermission(permissions);
  } else if (requiredRole) {
    // Legacy role-based check
    const roleHierarchy: Record<string, number> = {
      admin: 3,
      editor: 2,
      viewer: 1,
    };
    hasAccess = (roleHierarchy[user.role || "viewer"] || 0) >= (roleHierarchy[requiredRole] || 0);
  }

  // If user doesn't have required permission
  if (!hasAccess) {
    if (fallbackToAccessDenied) {
      return <Redirect to="/admin/access-denied" />;
    }

    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldX className="w-5 h-5 text-red-500" />
              Truy cập bị từ chối
            </CardTitle>
            <CardDescription>Bạn không có quyền truy cập trang này</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Yêu cầu quyền: {permission || permissions?.join(", ") || requiredRole || "admin"}
            </p>
            <Button onClick={() => setLocation("/admin")} variant="outline" className="w-full gap-2">
              <ArrowLeft className="w-4 h-4" />
              Quay lại Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Higher-order component version for wrapping route components
 */
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  permission: Permission
) {
  return function WithPermissionComponent(props: P) {
    return (
      <ProtectedRoute permission={permission}>
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };
}

/**
 * Hook to check if current route requires permission and user has it
 */
export function useRoutePermission(permission: Permission): {
  hasAccess: boolean;
  isLoading: boolean;
} {
  const { hasPermission, loading } = usePermissions();
  return {
    hasAccess: hasPermission(permission),
    isLoading: loading,
  };
}

/**
 * Get required permission for a given route path
 */
export function getRoutePermission(path: string): Permission[] | undefined {
  return MENU_PERMISSIONS[path];
}
