import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  MemoryStick, 
  Server, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Pause,
  Play,
  Mail,
  Bell
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAdminTranslation } from "@/hooks/useAdminTranslation";
import { toast } from "sonner";

// Progress bar with color based on value
function MetricProgress({ value, warning = 70, critical = 90 }: { value: number; warning?: number; critical?: number }) {
  const color = value >= critical ? "bg-red-500" : value >= warning ? "bg-yellow-500" : "bg-green-500";
  
  return (
    <div className="relative w-full">
      <Progress value={value} className="h-3" />
      <div 
        className={`absolute top-0 left-0 h-3 rounded-full transition-all ${color}`} 
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

// Format bytes to human readable
function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let unitIndex = 0;
  let value = bytes;
  
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

// Format uptime
function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export default function ServerMonitoring() {
  const { adminT } = useAdminTranslation();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  
  // Fetch metrics
  const { data: metrics, refetch, isLoading } = trpc.monitoring.getMetrics.useQuery(undefined, {
    refetchInterval: autoRefresh ? refreshInterval : false,
  });
  
  // Fetch thresholds
  const { data: thresholds } = trpc.monitoring.getThresholds.useQuery();
  
  // Fetch cooldown status
  const { data: cooldownStatus, refetch: refetchCooldown } = trpc.monitoring.getCooldownStatus.useQuery();
  
  // Test alert mutation
  const testAlertMutation = trpc.monitoring.testAlertEmail.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Email cảnh báo test đã được gửi!");
      } else {
        toast.error(data.message || "Không thể gửi email test");
      }
      refetchCooldown();
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
  
  // Clear cooldown mutation
  const clearCooldownMutation = trpc.monitoring.clearCooldown.useMutation({
    onSuccess: () => {
      toast.success("Đã xóa cooldown");
      refetchCooldown();
    },
  });
  
  // Determine overall status
  const getOverallStatus = () => {
    if (!metrics) return "unknown";
    
    const { system, app } = metrics;
    
    if (system.cpu.usage >= 95 || system.memory.usage >= 98 || app.errorRate >= 20) {
      return "critical";
    }
    if (system.cpu.usage >= 70 || system.memory.usage >= 80 || app.errorRate >= 5) {
      return "warning";
    }
    return "healthy";
  };
  
  const status = getOverallStatus();
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {(adminT as any).monitoring?.title || "Giám Sát Máy Chủ"}
          </h1>
          <p className="text-muted-foreground">
            {(adminT as any).monitoring?.description || "Giám sát thời gian thực tình trạng máy chủ và ứng dụng"}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Status badge */}
          <Badge 
            variant={status === "healthy" ? "default" : status === "warning" ? "secondary" : "destructive"}
            className="gap-1"
          >
            {status === "healthy" && <CheckCircle className="h-3 w-3" />}
            {status === "warning" && <AlertTriangle className="h-3 w-3" />}
            {status === "critical" && <XCircle className="h-3 w-3" />}
            {status === "healthy" ? "Bình thường" : status === "warning" ? "Cảnh báo" : "Nghiêm trọng"}
          </Badge>
          
          {/* Auto refresh toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
            {autoRefresh ? "Tạm dừng" : "Tiếp tục"}
          </Button>
          
          {/* Manual refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Cpu className="h-4 w-4 text-blue-500" />
              CPU
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.system.cpu.usage || 0}%</div>
            <MetricProgress 
              value={metrics?.system.cpu.usage || 0} 
              warning={thresholds?.cpu.warning} 
              critical={thresholds?.cpu.critical} 
            />
            <p className="text-xs text-muted-foreground mt-1">
              {metrics?.system.cpu.cores} cores @ {metrics?.system.cpu.speed}MHz
            </p>
          </CardContent>
        </Card>
        
        {/* Memory */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MemoryStick className="h-4 w-4 text-green-500" />
              Bộ nhớ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.system.memory.usage || 0}%</div>
            <MetricProgress 
              value={metrics?.system.memory.usage || 0} 
              warning={thresholds?.memory.warning} 
              critical={thresholds?.memory.critical} 
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formatBytes(metrics?.system.memory.used || 0)} / {formatBytes(metrics?.system.memory.total || 0)}
            </p>
          </CardContent>
        </Card>
        
        {/* Response Time */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-500" />
              Thời gian phản hồi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.app.avgResponseTime || 0}ms</div>
            <MetricProgress 
              value={Math.min((metrics?.app.avgResponseTime || 0) / 30, 100)} 
              warning={33} 
              critical={100} 
            />
            <p className="text-xs text-muted-foreground mt-1">
              {metrics?.app.requestsPerMinute || 0} req/phút
            </p>
          </CardContent>
        </Card>
        
        {/* Error Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Tỷ lệ lỗi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.app.errorRate || 0}%</div>
            <MetricProgress 
              value={metrics?.app.errorRate || 0} 
              warning={thresholds?.errorRate.warning} 
              critical={thresholds?.errorRate.critical} 
            />
            <p className="text-xs text-muted-foreground mt-1">
              {metrics?.app.errorCount || 0} / {metrics?.app.totalRequests || 0} requests
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="alerts">Cảnh báo Email</TabsTrigger>
          <TabsTrigger value="errors">Lỗi gần đây</TabsTrigger>
          <TabsTrigger value="system">Thông tin hệ thống</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* App Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Ứng dụng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Uptime</span>
                  <span className="font-medium">{formatUptime(metrics?.app.uptime || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tổng requests</span>
                  <span className="font-medium">{metrics?.app.totalRequests || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Requests/phút</span>
                  <span className="font-medium">{metrics?.app.requestsPerMinute || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Số lỗi</span>
                  <span className="font-medium text-red-500">{metrics?.app.errorCount || 0}</span>
                </div>
              </CardContent>
            </Card>
            
            {/* System Load */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Tải hệ thống
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Load Average (1m)</span>
                  <span className="font-medium">{metrics?.system.loadAverage[0]?.toFixed(2) || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Load Average (5m)</span>
                  <span className="font-medium">{metrics?.system.loadAverage[1]?.toFixed(2) || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Load Average (15m)</span>
                  <span className="font-medium">{metrics?.system.loadAverage[2]?.toFixed(2) || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">System Uptime</span>
                  <span className="font-medium">{formatUptime((metrics?.system.uptime || 0) * 1000)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Cảnh báo qua Email
              </CardTitle>
              <CardDescription>
                Hệ thống tự động gửi email khi phát hiện sự cố nghiêm trọng (CPU &gt; 90%, Memory &gt; 95%, Error Rate &gt; 10%)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Thresholds */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {thresholds && Object.entries(thresholds).map(([key, value]) => (
                  <div key={key} className="p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium capitalize">{key}</div>
                    <div className="text-xs text-muted-foreground">
                      Warning: {value.warning}{key === "responseTime" ? "ms" : "%"}
                    </div>
                    <div className="text-xs text-red-500">
                      Critical: {value.critical}{key === "responseTime" ? "ms" : "%"}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Cooldown Status */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Trạng thái Cooldown (15 phút)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  {cooldownStatus && Object.entries(cooldownStatus).map(([key, status]) => (
                    <div key={key} className={`p-2 rounded ${status.inCooldown ? "bg-yellow-100 dark:bg-yellow-900/20" : "bg-green-100 dark:bg-green-900/20"}`}>
                      <div className="font-medium">{key.replace("_", " ")}</div>
                      <div className="text-xs">
                        {status.inCooldown 
                          ? `Còn ${Math.ceil(status.remainingMs / 60000)} phút` 
                          : "Sẵn sàng"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-2">
                <Button 
                  onClick={() => testAlertMutation.mutate()}
                  disabled={testAlertMutation.isPending}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {testAlertMutation.isPending ? "Đang gửi..." : "Gửi Email Test"}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => clearCooldownMutation.mutate({})}
                  disabled={clearCooldownMutation.isPending}
                >
                  Xóa tất cả Cooldown
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground">
                <strong>Lưu ý:</strong> Để nhận email cảnh báo, cần cấu hình biến môi trường <code>ADMIN_ALERT_EMAIL</code> hoặc <code>OWNER_EMAIL</code> trong Settings → Secrets.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Errors Tab */}
        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lỗi gần đây</CardTitle>
              <CardDescription>10 lỗi gần nhất được ghi nhận</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics?.app.recentErrors && metrics.app.recentErrors.length > 0 ? (
                <div className="space-y-2">
                  {metrics.app.recentErrors.map((error, index) => (
                    <div key={index} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-red-700 dark:text-red-400">{error.path}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(error.timestamp).toLocaleString("vi-VN")}
                        </span>
                      </div>
                      <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>Không có lỗi nào được ghi nhận</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* System Tab */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin hệ thống</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Hostname</span>
                    <span className="font-medium">{metrics?.system.hostname}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Platform</span>
                    <span className="font-medium">{metrics?.system.platform}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Architecture</span>
                    <span className="font-medium">{metrics?.system.arch}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Node.js Version</span>
                    <span className="font-medium">{metrics?.system.nodeVersion}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">CPU Model</span>
                    <span className="font-medium text-sm">{metrics?.system.cpu.model}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">CPU Cores</span>
                    <span className="font-medium">{metrics?.system.cpu.cores}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Total Memory</span>
                    <span className="font-medium">{formatBytes(metrics?.system.memory.total || 0)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Free Memory</span>
                    <span className="font-medium">{formatBytes(metrics?.system.memory.free || 0)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Last updated */}
      <div className="text-center text-sm text-muted-foreground">
        Cập nhật lần cuối: {metrics?.timestamp ? new Date(metrics.timestamp).toLocaleString("vi-VN") : "N/A"}
        {autoRefresh && <span className="ml-2">(Tự động làm mới mỗi {refreshInterval / 1000}s)</span>}
      </div>
    </div>
  );
}
