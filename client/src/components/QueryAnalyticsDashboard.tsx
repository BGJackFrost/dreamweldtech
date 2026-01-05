/**
 * Query Analytics Dashboard
 * 
 * Displays database query performance analytics.
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Database,
  Clock,
  AlertTriangle,
  RefreshCw,
  Activity,
  Zap,
  Table as TableIcon,
  TrendingUp,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// Colors
const COLORS = {
  primary: "#0ea5e9",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
};

const PIE_COLORS = ["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

// Format time
function formatTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// Get time color
function getTimeColor(ms: number): string {
  if (ms < 50) return "text-green-600";
  if (ms < 200) return "text-yellow-600";
  if (ms < 500) return "text-orange-600";
  return "text-red-600";
}

// Query type colors
function getQueryTypeColor(type: string): string {
  switch (type.toUpperCase()) {
    case "SELECT": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "INSERT": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "UPDATE": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "DELETE": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }
}

export default function QueryAnalyticsDashboard() {
  const [days, setDays] = useState(7);
  
  // Fetch data
  const { data: overallStats, isLoading: loadingOverall, refetch: refetchOverall } = 
    trpc.queryAnalytics.getOverallStats.useQuery({ days });
  
  const { data: statsByType } = 
    trpc.queryAnalytics.getStatsByType.useQuery({ days });
  
  const { data: statsByTable } = 
    trpc.queryAnalytics.getStatsByTable.useQuery({ days });
  
  const { data: slowestQueries } = 
    trpc.queryAnalytics.getSlowestQueries.useQuery({ days, limit: 10 });
  
  const { data: dailyTrend } = 
    trpc.queryAnalytics.getDailyTrend.useQuery({ days });
  
  const { data: trackingStatus } = 
    trpc.queryAnalytics.getTrackingStatus.useQuery();
  
  // Mutations
  const triggerAggregation = trpc.queryAnalytics.triggerAggregation.useMutation({
    onSuccess: () => {
      toast.success("Đã kích hoạt tổng hợp dữ liệu");
      refetchOverall();
    },
    onError: (error: { message: string }) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
  
  const toggleTracking = trpc.queryAnalytics.toggleTracking.useMutation({
    onSuccess: (data: { isTracking: boolean }) => {
      toast.success(data.isTracking ? "Đã bật tracking" : "Đã tắt tracking");
    },
    onError: (error: { message: string }) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
  
  // Prepare chart data
  const trendChartData = dailyTrend?.map((d: { dateKey: string; totalQueries: number; avgExecutionTime: number; p95ExecutionTime: number }) => ({
    date: d.dateKey.slice(5),
    "Tổng queries": d.totalQueries,
    "Avg Time (ms)": d.avgExecutionTime,
    "P95 (ms)": d.p95ExecutionTime,
  })) || [];
  
  const typeChartData = statsByType?.map((s: { queryType: string; totalQueries: number }) => ({
    name: s.queryType,
    value: s.totalQueries,
  })) || [];
  
  if (loadingOverall) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Query Analytics
          </h3>
          <p className="text-sm text-muted-foreground">
            Phân tích hiệu suất truy vấn database
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={days.toString()} onValueChange={(v) => setDays(parseInt(v))}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">24 giờ</SelectItem>
              <SelectItem value="7">7 ngày</SelectItem>
              <SelectItem value="30">30 ngày</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => triggerAggregation.mutate()}
            disabled={triggerAggregation.isPending}
          >
            <RefreshCw className={`h-4 w-4 ${triggerAggregation.isPending ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng queries</p>
                <p className="text-2xl font-bold">{overallStats?.totalQueries?.toLocaleString() || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Time</p>
                <p className={`text-2xl font-bold ${getTimeColor(overallStats?.avgExecutionTime || 0)}`}>
                  {formatTime(overallStats?.avgExecutionTime || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                <TableIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tables</p>
                <p className="text-2xl font-bold">{overallStats?.uniqueTables || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Error Rate</p>
                <p className="text-2xl font-bold">{overallStats?.errorRate || "0.00"}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="tables">Theo bảng</TabsTrigger>
          <TabsTrigger value="slow">Queries chậm</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Trend Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Xu hướng theo ngày</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={trendChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="Tổng queries" 
                      stroke={COLORS.primary}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Query Type Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Phân bố theo loại query</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={typeChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {typeChartData.map((_: unknown, index: number) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          {/* Query Types Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Thống kê theo loại Query</CardTitle>
            </CardHeader>
            <CardContent>
              {statsByType && statsByType.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loại</TableHead>
                      <TableHead className="text-right">Tổng</TableHead>
                      <TableHead className="text-right">Avg Time</TableHead>
                      <TableHead className="text-right">P95</TableHead>
                      <TableHead className="text-right">Error Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statsByType.map((s: { queryType: string; totalQueries: number; avgExecutionTime: number; p95ExecutionTime: number; errorRate: string }, i: number) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Badge className={getQueryTypeColor(s.queryType)}>
                            {s.queryType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {s.totalQueries.toLocaleString()}
                        </TableCell>
                        <TableCell className={`text-right ${getTimeColor(s.avgExecutionTime)}`}>
                          {formatTime(s.avgExecutionTime)}
                        </TableCell>
                        <TableCell className="text-right text-yellow-600">
                          {formatTime(s.p95ExecutionTime)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={parseFloat(s.errorRate) > 1 ? "destructive" : "secondary"}>
                            {s.errorRate}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Chưa có dữ liệu</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tables Tab */}
        <TabsContent value="tables" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Thống kê theo Bảng</CardTitle>
            </CardHeader>
            <CardContent>
              {statsByTable && statsByTable.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bảng</TableHead>
                      <TableHead className="text-right">Queries</TableHead>
                      <TableHead className="text-right">Avg Time</TableHead>
                      <TableHead className="text-right">P95</TableHead>
                      <TableHead className="text-right">P99</TableHead>
                      <TableHead className="text-right">Rows</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {statsByTable.map((s: { tableName: string | null; totalQueries: number; avgExecutionTime: number; p95ExecutionTime: number; p99ExecutionTime: number; totalRows: number }, i: number) => (
                      <TableRow key={i}>
                        <TableCell>
                          <code className="text-sm bg-muted px-1 rounded">{s.tableName || "unknown"}</code>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {s.totalQueries.toLocaleString()}
                        </TableCell>
                        <TableCell className={`text-right ${getTimeColor(s.avgExecutionTime)}`}>
                          {formatTime(s.avgExecutionTime)}
                        </TableCell>
                        <TableCell className="text-right text-yellow-600">
                          {formatTime(s.p95ExecutionTime)}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {formatTime(s.p99ExecutionTime)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {s.totalRows.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <TableIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Chưa có dữ liệu</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Slow Queries Tab */}
        <TabsContent value="slow" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                Queries chậm nhất (P95)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {slowestQueries && slowestQueries.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Query</TableHead>
                      <TableHead className="text-right">P95</TableHead>
                      <TableHead className="text-right">P99</TableHead>
                      <TableHead className="text-right">Max</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {slowestQueries.map((q: { queryType: string; tableName: string | null; p95ExecutionTime: number; p99ExecutionTime: number; maxExecutionTime: number; totalQueries: number }, i: number) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className={getQueryTypeColor(q.queryType)}>
                              {q.queryType}
                            </Badge>
                            <code className="text-sm">{q.tableName || "unknown"}</code>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-yellow-600 font-medium">
                          {formatTime(q.p95ExecutionTime)}
                        </TableCell>
                        <TableCell className="text-right text-orange-600">
                          {formatTime(q.p99ExecutionTime)}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {formatTime(q.maxExecutionTime)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {q.totalQueries.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Zap className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p className="text-muted-foreground">Không có queries chậm</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Tracking Status */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Query Tracking</p>
                <p className="text-sm text-muted-foreground">
                  Buffer: {trackingStatus?.bufferSize || 0} records
                </p>
              </div>
            </div>
            <Switch
              checked={trackingStatus?.isTracking || false}
              onCheckedChange={(checked) => toggleTracking.mutate({ enabled: checked })}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <Database className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Về Query Analytics</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Hệ thống theo dõi hiệu suất của tất cả database queries. Dữ liệu được tổng hợp hàng ngày 
                với các percentiles (P50, P95, P99) để xác định queries cần tối ưu. Queries có P95 cao 
                thường là ứng cử viên tốt cho việc thêm index hoặc tối ưu logic.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
