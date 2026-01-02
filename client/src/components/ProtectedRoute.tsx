import { ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermissions?: string[];
  requiredRole?: "admin" | "editor" | "viewer";
}

// Mock permission checking function - replace with real implementation
function checkPermission(userRole: string, requiredPermissions?: string[], requiredRole?: string): boolean {
  if (requiredRole) {
    const roleHierarchy: Record<string, number> = {
      admin: 3,
      editor: 2,
      viewer: 1,
    };
    return (roleHierarchy[userRole] || 0) >= (roleHierarchy[requiredRole] || 0);
  }

  if (requiredPermissions && requiredPermissions.length > 0) {
    // Mock: check if user has any of the required permissions
    // In real implementation, fetch from user context or API
    return true;
  }

  return true;
}

export function ProtectedRoute({ children, requiredPermissions, requiredRole }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

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
            <Button onClick={() => setLocation("/login")} className="w-full">
              Đăng nhập
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasPermission = checkPermission(user.role || "viewer", requiredPermissions, requiredRole);

  if (!hasPermission) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Truy cập bị từ chối
            </CardTitle>
            <CardDescription>Bạn không có quyền truy cập trang này</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">
              Yêu cầu quyền hạn: {requiredRole || requiredPermissions?.join(", ") || "admin"}
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
