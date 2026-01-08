import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Shield, ShieldAlert, ShieldCheck, ShieldOff, 
  Lock, Unlock, Globe, Key, 
  AlertTriangle, AlertCircle, Info,
  TrendingUp, TrendingDown, Activity,
  Loader2
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function SecurityDashboard() {
  const { data: stats, isLoading: statsLoading } = trpc.advancedSecurity.dashboard.stats.useQuery();
  const { data: trends } = trpc.advancedSecurity.dashboard.trends.useQuery({ days: 30 });
  const { data: alerts } = trpc.advancedSecurity.dashboard.alerts.useQuery();

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getAlertIcon = (level: string) => {
    switch (level) {
      case "critical":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getAlertVariant = (level: string) => {
    switch (level) {
      case "critical":
        return "destructive";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Security Dashboard</h1>
        <p className="text-muted-foreground">Tổng hợp các chỉ số bảo mật hệ thống</p>
      </div>

      {/* Security Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Alert key={index} variant={getAlertVariant(alert.level) as any}>
              {getAlertIcon(alert.level)}
              <AlertTitle className="ml-2">
                {alert.level === "critical" ? "Cảnh báo nghiêm trọng" : 
                 alert.level === "warning" ? "Cảnh báo" : "Thông tin"}
              </AlertTitle>
              <AlertDescription className="ml-2">{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng đăng nhập</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalLogins || 0}</div>
            <p className="text-xs text-muted-foreground">30 ngày qua</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ thành công</CardTitle>
            {(stats?.loginSuccessRate || 0) >= 90 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.loginSuccessRate || 0}%</div>
            <Progress value={stats?.loginSuccessRate || 0} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đăng nhập thất bại</CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats?.failedLogins || 0}</div>
            <p className="text-xs text-muted-foreground">30 ngày qua</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoạt động đáng ngờ</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats?.suspiciousActivities || 0}</div>
            <p className="text-xs text-muted-foreground">IP với nhiều lần thất bại</p>
          </CardContent>
        </Card>
      </div>

      {/* IP & Security Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IP bị chặn</CardTitle>
            <ShieldOff className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.blockedIps || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IP whitelist</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.whitelistedIps || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IP đang khóa</CardTitle>
            <Lock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.lockedIps || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quốc gia bị chặn</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.geoBlockedCountries || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Security Features Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yêu cầu reset mật khẩu</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.passwordResets || 0}</div>
            <p className="text-xs text-muted-foreground">30 ngày qua</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">2FA đã bật</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.twoFactorEnabled || 0}</div>
            <p className="text-xs text-muted-foreground">Tài khoản</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trạng thái bảo mật</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Tốt</div>
            <p className="text-xs text-muted-foreground">Hệ thống hoạt động bình thường</p>
          </CardContent>
        </Card>
      </div>

      {/* Login Trends Chart */}
      {trends && trends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Xu hướng đăng nhập</CardTitle>
            <CardDescription>Thống kê đăng nhập 30 ngày qua</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="successfulLogins" 
                    stroke="#22c55e" 
                    name="Thành công"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="failedLogins" 
                    stroke="#ef4444" 
                    name="Thất bại"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="blockedRequests" 
                    stroke="#f59e0b" 
                    name="Bị chặn"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Failed Logins & Blocked IPs */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>IP đăng nhập thất bại nhiều nhất</CardTitle>
            <CardDescription>Top IP có nhiều lần đăng nhập thất bại</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP</TableHead>
                  <TableHead>Số lần</TableHead>
                  <TableHead>Lần cuối</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats?.recentFailedLogins?.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono">{item.ipAddress}</TableCell>
                    <TableCell>
                      <Badge variant={item.attempts >= 5 ? "destructive" : "secondary"}>
                        {item.attempts}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(item.lastAttempt).toLocaleString("vi-VN")}
                    </TableCell>
                  </TableRow>
                ))}
                {(!stats?.recentFailedLogins || stats.recentFailedLogins.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Không có dữ liệu
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>IP bị chặn gần đây</CardTitle>
            <CardDescription>Danh sách IP mới bị thêm vào blacklist</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP</TableHead>
                  <TableHead>Lý do</TableHead>
                  <TableHead>Thời gian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats?.recentBlockedIps?.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono">{item.ipAddress}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{item.reason}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(item.blockedAt).toLocaleString("vi-VN")}
                    </TableCell>
                  </TableRow>
                ))}
                {(!stats?.recentBlockedIps || stats.recentBlockedIps.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Không có IP bị chặn
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Top Blocked Countries */}
      {stats?.topBlockedCountries && stats.topBlockedCountries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top quốc gia bị chặn</CardTitle>
            <CardDescription>Các quốc gia có nhiều lượt truy cập bị chặn nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.topBlockedCountries.map((country, index) => (
                <Badge key={index} variant="outline" className="text-sm">
                  <Globe className="h-3 w-3 mr-1" />
                  {country.countryName}: {country.hitCount} lượt
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
