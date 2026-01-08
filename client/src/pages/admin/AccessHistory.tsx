import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  History, 
  ArrowLeft,
  Monitor,
  Smartphone,
  Tablet,
  LogIn,
  LogOut,
  Key,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Trash2
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import { vi } from "date-fns/locale";

const ACTION_ICONS: Record<string, any> = {
  login: LogIn,
  login_failed: XCircle,
  logout: LogOut,
  password_change: Key,
  password_reset_request: Key,
  password_reset_complete: Key,
  "2fa_enable": Shield,
  "2fa_disable": Shield,
  "2fa_verify": Shield,
  "2fa_verify_failed": Shield,
  profile_update: Monitor,
  session_revoke: LogOut,
  session_revoke_all: LogOut,
  new_device_login: Smartphone,
  suspicious_activity: AlertTriangle,
};

const ACTION_LABELS: Record<string, string> = {
  login: "Đăng nhập",
  login_failed: "Đăng nhập thất bại",
  logout: "Đăng xuất",
  password_change: "Đổi mật khẩu",
  password_reset_request: "Yêu cầu reset mật khẩu",
  password_reset_complete: "Reset mật khẩu",
  "2fa_enable": "Bật 2FA",
  "2fa_disable": "Tắt 2FA",
  "2fa_verify": "Xác thực 2FA",
  "2fa_verify_failed": "Xác thực 2FA thất bại",
  profile_update: "Cập nhật profile",
  session_revoke: "Thu hồi phiên",
  session_revoke_all: "Thu hồi tất cả phiên",
  new_device_login: "Đăng nhập thiết bị mới",
  suspicious_activity: "Hoạt động đáng ngờ",
};

const STATUS_COLORS: Record<string, string> = {
  success: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  blocked: "bg-yellow-100 text-yellow-800",
};

const RISK_COLORS: Record<string, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

export default function AccessHistory() {
  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const limit = 20;

  // Get access history
  const historyQuery = trpc.security.accessHistory.list.useQuery({
    limit,
    offset: page * limit,
    actionType: actionFilter !== "all" ? actionFilter : undefined,
    status: statusFilter !== "all" ? statusFilter as any : undefined,
  });

  // Get known devices
  const devicesQuery = trpc.security.accessHistory.devices.useQuery();

  // Remove device mutation
  const removeDeviceMutation = trpc.security.accessHistory.removeDevice.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        devicesQuery.refetch();
      } else {
        toast.error(data.message);
      }
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType) {
      case "mobile":
        return <Smartphone className="h-4 w-4" />;
      case "tablet":
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const formatDate = (date: Date | string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: vi });
  };

  const formatFullDate = (date: Date | string) => {
    return format(new Date(date), "dd/MM/yyyy HH:mm:ss", { locale: vi });
  };

  if (historyQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const { history, total } = historyQuery.data || { history: [], total: 0 };
  const devices = devicesQuery.data || [];
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại Dashboard
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <History className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Lịch sử truy cập</h1>
          <p className="text-muted-foreground">Xem lịch sử hoạt động và thiết bị đã đăng nhập</p>
        </div>
      </div>

      {/* Known Devices */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Thiết bị đã biết</CardTitle>
          <CardDescription>
            Các thiết bị đã từng đăng nhập vào tài khoản của bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Chưa có thiết bị nào được ghi nhận</p>
          ) : (
            <div className="space-y-3">
              {devices.map((device: any) => (
                <div key={device.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      {getDeviceIcon(device.deviceType)}
                    </div>
                    <div>
                      <div className="font-medium">{device.deviceName || "Thiết bị không xác định"}</div>
                      <div className="text-sm text-muted-foreground">
                        {device.browser} • {device.os}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Lần cuối: {formatDate(device.lastSeenAt)}
                        {device.lastIpAddress && ` • IP: ${device.lastIpAddress}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {device.isTrusted === "true" && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Tin cậy
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeDeviceMutation.mutate({ deviceId: device.id })}
                      disabled={removeDeviceMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Lịch sử hoạt động</CardTitle>
              <CardDescription>
                Tổng cộng {total} hoạt động
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Loại hoạt động" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="login">Đăng nhập</SelectItem>
                  <SelectItem value="login_failed">Đăng nhập thất bại</SelectItem>
                  <SelectItem value="logout">Đăng xuất</SelectItem>
                  <SelectItem value="password_change">Đổi mật khẩu</SelectItem>
                  <SelectItem value="2fa_enable">Bật 2FA</SelectItem>
                  <SelectItem value="2fa_disable">Tắt 2FA</SelectItem>
                  <SelectItem value="new_device_login">Thiết bị mới</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="success">Thành công</SelectItem>
                  <SelectItem value="failed">Thất bại</SelectItem>
                  <SelectItem value="blocked">Bị chặn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Không có hoạt động nào</p>
          ) : (
            <div className="space-y-3">
              {history.map((item: any) => {
                const ActionIcon = ACTION_ICONS[item.actionType] || History;
                return (
                  <div key={item.id} className="flex items-start gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`p-2 rounded-lg ${
                      item.status === "success" ? "bg-green-100 text-green-700" :
                      item.status === "failed" ? "bg-red-100 text-red-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      <ActionIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">
                          {ACTION_LABELS[item.actionType] || item.actionType}
                        </span>
                        <Badge variant="secondary" className={STATUS_COLORS[item.status]}>
                          {item.status === "success" ? "Thành công" : 
                           item.status === "failed" ? "Thất bại" : "Bị chặn"}
                        </Badge>
                        {item.riskLevel !== "low" && (
                          <Badge variant="secondary" className={RISK_COLORS[item.riskLevel]}>
                            {item.riskLevel === "medium" ? "Rủi ro TB" : "Rủi ro cao"}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span title={formatFullDate(item.createdAt)}>
                          {formatDate(item.createdAt)}
                        </span>
                        {item.browser && (
                          <span>{item.browser}</span>
                        )}
                        {item.ipAddress && (
                          <span>IP: {item.ipAddress}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Trang {page + 1} / {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Sau
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
