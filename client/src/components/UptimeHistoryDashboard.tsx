/**
 * Uptime History Dashboard Component
 * 
 * Displays uptime history with monthly availability percentages,
 * incident tracking, and visual status indicators.
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Activity,
  RefreshCw,
  Calendar,
  Zap,
  Shield
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// Status colors
const STATUS_COLORS = {
  up: "bg-green-500",
  down: "bg-red-500",
  degraded: "bg-yellow-500",
  unknown: "bg-gray-400",
};

const STATUS_LABELS = {
  up: "Hoạt động",
  down: "Ngừng hoạt động",
  degraded: "Chậm",
  unknown: "Không xác định",
};

// Availability color based on percentage
function getAvailabilityColor(percentage: number): string {
  if (percentage >= 99.9) return "text-green-600";
  if (percentage >= 99) return "text-green-500";
  if (percentage >= 95) return "text-yellow-500";
  if (percentage >= 90) return "text-orange-500";
  return "text-red-500";
}

function getAvailabilityBgColor(percentage: number): string {
  if (percentage >= 99.9) return "bg-green-100 dark:bg-green-900/20";
  if (percentage >= 99) return "bg-green-50 dark:bg-green-900/10";
  if (percentage >= 95) return "bg-yellow-50 dark:bg-yellow-900/10";
  if (percentage >= 90) return "bg-orange-50 dark:bg-orange-900/10";
  return "bg-red-50 dark:bg-red-900/10";
}

// Format duration
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h`;
  return `${Math.round(seconds / 86400)}d`;
}

// Month name in Vietnamese
function getMonthName(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  const monthNames = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];
  return `${monthNames[parseInt(month) - 1]} ${year}`;
}

// Monthly availability bar
function MonthlyBar({ 
  yearMonth, 
  availability, 
  incidents,
  isCurrentMonth 
}: { 
  yearMonth: string;
  availability: number;
  incidents: number;
  isCurrentMonth: boolean;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex flex-col items-center gap-1 ${isCurrentMonth ? "opacity-100" : "opacity-80"}`}>
            <div 
              className={`w-8 h-24 rounded-t-sm ${getAvailabilityBgColor(availability)} border border-border relative overflow-hidden`}
            >
              <div 
                className={`absolute bottom-0 left-0 right-0 ${availability >= 99 ? "bg-green-500" : availability >= 95 ? "bg-yellow-500" : "bg-red-500"}`}
                style={{ height: `${availability}%` }}
              />
              {incidents > 0 && (
                <div className="absolute top-1 left-1/2 -translate-x-1/2">
                  <span className="text-[10px] font-bold text-red-600">{incidents}</span>
                </div>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground">
              {yearMonth.split("-")[1]}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-medium">{getMonthName(yearMonth)}</p>
            <p className={getAvailabilityColor(availability)}>
              Availability: {availability.toFixed(2)}%
            </p>
            {incidents > 0 && (
              <p className="text-red-500">Sự cố: {incidents}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Status indicator dot
function StatusDot({ status }: { status: "up" | "down" | "degraded" | "unknown" }) {
  return (
    <span className={`inline-block w-3 h-3 rounded-full ${STATUS_COLORS[status]} animate-pulse`} />
  );
}

export default function UptimeHistoryDashboard() {
  const [months, setMonths] = useState(12);
  
  // Fetch data
  const { data: monthlyStats, isLoading: loadingStats, refetch: refetchStats } = 
    trpc.uptimeHistory.getMonthlyStats.useQuery({ months });
  
  const { data: overallStats, isLoading: loadingOverall } = 
    trpc.uptimeHistory.getOverallAvailability.useQuery();
  
  const { data: streak, isLoading: loadingStreak } = 
    trpc.uptimeHistory.getStreak.useQuery();
  
  const { data: publicStatus, isLoading: loadingStatus, refetch: refetchStatus } = 
    trpc.uptimeHistory.getPublicStatus.useQuery();
  
  const triggerCheckMutation = trpc.uptimeHistory.triggerCheck.useMutation({
    onSuccess: () => {
      toast.success("Đã kiểm tra uptime");
      refetchStats();
      refetchStatus();
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
  
  // Calculate stats
  const stats = useMemo(() => {
    if (!monthlyStats || monthlyStats.length === 0) {
      return {
        avgAvailability: 100,
        totalIncidents: 0,
        totalDowntime: 0,
        avgMttr: 0,
      };
    }
    
    const totalChecks = monthlyStats.reduce((sum, m) => sum + m.totalChecks, 0);
    const successfulChecks = monthlyStats.reduce((sum, m) => sum + m.successfulChecks, 0);
    const avgAvailability = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 100;
    const totalIncidents = monthlyStats.reduce((sum, m) => sum + m.incidentCount, 0);
    const totalDowntime = monthlyStats.reduce((sum, m) => sum + m.totalDowntimeSeconds, 0);
    const avgMttr = totalIncidents > 0 ? totalDowntime / totalIncidents : 0;
    
    return { avgAvailability, totalIncidents, totalDowntime, avgMttr };
  }, [monthlyStats]);
  
  // Current month
  const currentYearMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);
  
  if (loadingStats || loadingOverall || loadingStreak || loadingStatus) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Uptime History Dashboard
          </h3>
          <p className="text-sm text-muted-foreground">
            Theo dõi tình trạng hoạt động và availability của hệ thống
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={months.toString()} onValueChange={(v) => setMonths(parseInt(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 tháng</SelectItem>
              <SelectItem value="6">6 tháng</SelectItem>
              <SelectItem value="12">12 tháng</SelectItem>
              <SelectItem value="24">24 tháng</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => triggerCheckMutation.mutate()}
            disabled={triggerCheckMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${triggerCheckMutation.isPending ? "animate-spin" : ""}`} />
            Kiểm tra ngay
          </Button>
        </div>
      </div>
      
      {/* Current Status Banner */}
      <Card className={`${publicStatus?.status === "up" ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800" : publicStatus?.status === "down" ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800" : "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800"}`}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusDot status={publicStatus?.status as "up" | "down" | "degraded" || "unknown"} />
              <div>
                <p className="font-semibold">
                  {STATUS_LABELS[publicStatus?.status as keyof typeof STATUS_LABELS] || "Không xác định"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Kiểm tra lần cuối: {publicStatus?.lastChecked 
                    ? new Date(publicStatus.lastChecked).toLocaleString("vi-VN")
                    : "Chưa có dữ liệu"}
                </p>
              </div>
            </div>
            
            {publicStatus?.responseTime && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Response Time</p>
                <p className={`text-lg font-bold ${publicStatus.responseTime > 1000 ? "text-yellow-600" : "text-green-600"}`}>
                  {publicStatus.responseTime}ms
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Availability */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              Availability tổng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getAvailabilityColor(overallStats?.availability || 100)}`}>
              {(overallStats?.availability || 100).toFixed(4)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overallStats?.totalChecks || 0} lần kiểm tra
            </p>
          </CardContent>
        </Card>
        
        {/* Uptime Streak */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Uptime liên tục
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {streak?.days || 0} ngày
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {streak?.since 
                ? `Từ ${new Date(streak.since).toLocaleDateString("vi-VN")}`
                : "Không có downtime"}
            </p>
          </CardContent>
        </Card>
        
        {/* Total Incidents */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Sự cố ({months} tháng)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${stats.totalIncidents > 0 ? "text-orange-600" : "text-green-600"}`}>
              {stats.totalIncidents}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Downtime: {formatDuration(stats.totalDowntime)}
            </p>
          </CardContent>
        </Card>
        
        {/* MTTR */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-500" />
              MTTR trung bình
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {formatDuration(Math.round(stats.avgMttr))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Mean Time To Recovery
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Monthly Availability Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Availability theo tháng
          </CardTitle>
          <CardDescription>
            Tỷ lệ hoạt động và số sự cố trong {months} tháng gần nhất
          </CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyStats && monthlyStats.length > 0 ? (
            <div className="flex items-end justify-center gap-2 overflow-x-auto py-4">
              {[...monthlyStats].reverse().map((stat) => (
                <MonthlyBar
                  key={stat.yearMonth}
                  yearMonth={stat.yearMonth}
                  availability={stat.availabilityPercentage}
                  incidents={stat.incidentCount}
                  isCurrentMonth={stat.yearMonth === currentYearMonth}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Chưa có dữ liệu uptime</p>
              <p className="text-sm">Hệ thống sẽ tự động thu thập dữ liệu</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Monthly Details Table */}
      {monthlyStats && monthlyStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Chi tiết theo tháng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Tháng</th>
                    <th className="text-right py-2 px-3">Availability</th>
                    <th className="text-right py-2 px-3">Kiểm tra</th>
                    <th className="text-right py-2 px-3">Thành công</th>
                    <th className="text-right py-2 px-3">Sự cố</th>
                    <th className="text-right py-2 px-3">Downtime</th>
                    <th className="text-right py-2 px-3">Avg Response</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyStats.map((stat) => (
                    <tr key={stat.yearMonth} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-3 font-medium">
                        {getMonthName(stat.yearMonth)}
                        {stat.yearMonth === currentYearMonth && (
                          <Badge variant="secondary" className="ml-2 text-xs">Hiện tại</Badge>
                        )}
                      </td>
                      <td className={`text-right py-2 px-3 font-bold ${getAvailabilityColor(stat.availabilityPercentage)}`}>
                        {stat.availabilityPercentage.toFixed(2)}%
                      </td>
                      <td className="text-right py-2 px-3">{stat.totalChecks}</td>
                      <td className="text-right py-2 px-3 text-green-600">{stat.successfulChecks}</td>
                      <td className={`text-right py-2 px-3 ${stat.incidentCount > 0 ? "text-red-600 font-medium" : ""}`}>
                        {stat.incidentCount}
                      </td>
                      <td className="text-right py-2 px-3">
                        {formatDuration(stat.totalDowntimeSeconds)}
                      </td>
                      <td className="text-right py-2 px-3">
                        {stat.avgResponseTime}ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* SLA Indicator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            SLA Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { label: "99.99% (52.6 phút downtime/năm)", target: 99.99 },
              { label: "99.9% (8.76 giờ downtime/năm)", target: 99.9 },
              { label: "99% (3.65 ngày downtime/năm)", target: 99 },
              { label: "95% (18.25 ngày downtime/năm)", target: 95 },
            ].map((sla) => {
              const current = overallStats?.availability || 100;
              const met = current >= sla.target;
              
              return (
                <div key={sla.target} className="flex items-center gap-4">
                  <div className="w-8">
                    {met ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{sla.label}</span>
                      <span className={`text-sm ${met ? "text-green-600" : "text-red-600"}`}>
                        {met ? "Đạt" : "Chưa đạt"}
                      </span>
                    </div>
                    <Progress value={Math.min((current / sla.target) * 100, 100)} className="h-2" />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
