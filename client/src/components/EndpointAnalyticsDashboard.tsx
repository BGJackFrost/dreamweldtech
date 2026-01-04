/**
 * API Endpoint Analytics Dashboard
 * 
 * Displays detailed response time analytics for each API endpoint.
 * Includes charts for percentiles (p50, p95, p99), trends, and comparisons.
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
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
  Activity,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Search,
  RefreshCw,
  Download,
  ChevronRight,
  Zap,
  Server,
  BarChart3,
  Timer,
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
  p50: "#22c55e",
  p95: "#f59e0b",
  p99: "#ef4444",
};

const PIE_COLORS = ["#22c55e", "#ef4444", "#f59e0b", "#8b5cf6", "#0ea5e9"];

// Format response time
function formatResponseTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// Get status color based on response time
function getResponseTimeColor(ms: number): string {
  if (ms < 100) return "text-green-600";
  if (ms < 300) return "text-yellow-600";
  if (ms < 1000) return "text-orange-600";
  return "text-red-600";
}

// Get error rate color
function getErrorRateColor(rate: number): string {
  if (rate < 1) return "text-green-600";
  if (rate < 5) return "text-yellow-600";
  return "text-red-600";
}

// Method badge color
function getMethodColor(method: string): string {
  switch (method.toUpperCase()) {
    case "GET": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "POST": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "PUT": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "DELETE": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "PATCH": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }
}

export default function EndpointAnalyticsDashboard() {
  const [days, setDays] = useState(7);
  const [search, setSearch] = useState("");
  const [selectedEndpoint, setSelectedEndpoint] = useState<{ endpoint: string; method: string } | null>(null);
  
  // Fetch data
  const { data: endpoints, isLoading: loadingEndpoints, refetch: refetchEndpoints } = 
    trpc.endpointMetrics.getEndpoints.useQuery({ days, search });
  
  const { data: overallStats, isLoading: loadingOverall } = 
    trpc.endpointMetrics.getOverallStats.useQuery({ days });
  
  const { data: slowestEndpoints } = 
    trpc.endpointMetrics.getSlowestEndpoints.useQuery({ days, limit: 5 });
  
  const { data: errorProneEndpoints } = 
    trpc.endpointMetrics.getErrorProneEndpoints.useQuery({ days, limit: 5 });
  
  const { data: endpointDetail, isLoading: loadingDetail } = 
    trpc.endpointMetrics.getEndpointDetail.useQuery(
      { endpoint: selectedEndpoint?.endpoint || "", method: selectedEndpoint?.method || "", days },
      { enabled: !!selectedEndpoint }
    );
  
  const triggerAggregation = trpc.endpointMetrics.triggerAggregation.useMutation({
    onSuccess: () => {
      toast.success("Đã kích hoạt tổng hợp dữ liệu");
      refetchEndpoints();
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
  
  // Export CSV
  const handleExportCSV = () => {
    if (!endpoints || endpoints.length === 0) {
      toast.error("Không có dữ liệu để xuất");
      return;
    }
    
    const headers = ["Endpoint", "Method", "Total Requests", "Avg Response Time (ms)", "P50 (ms)", "P95 (ms)", "P99 (ms)", "Error Rate (%)"];
    const rows = endpoints.map(e => [
      e.endpoint,
      e.method,
      e.totalRequests,
      e.avgResponseTime,
      e.p50ResponseTime,
      e.p95ResponseTime,
      e.p99ResponseTime,
      e.errorRate,
    ]);
    
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `endpoint-metrics-${days}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Đã xuất file CSV");
  };
  
  // Prepare chart data for endpoint detail
  const dailyChartData = useMemo(() => {
    if (!endpointDetail?.dailyStats) return [];
    return endpointDetail.dailyStats.map(s => ({
      date: s.date,
      "Trung bình": s.avgResponseTime,
      "P50": s.p50ResponseTime,
      "P95": s.p95ResponseTime,
      "P99": s.p99ResponseTime,
      "Requests": s.totalRequests,
      "Error Rate": s.errorRate,
    }));
  }, [endpointDetail]);
  
  const hourlyChartData = useMemo(() => {
    if (!endpointDetail?.hourlyDistribution) return [];
    // Fill missing hours with 0
    const hourMap = new Map(endpointDetail.hourlyDistribution.map(h => [h.hour, h]));
    return Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, "0")}:00`,
      count: hourMap.get(i)?.count || 0,
      avgTime: hourMap.get(i)?.avgTime || 0,
    }));
  }, [endpointDetail]);
  
  if (loadingEndpoints || loadingOverall) {
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
            <Activity className="h-5 w-5" />
            Phân tích API Endpoints
          </h3>
          <p className="text-sm text-muted-foreground">
            Theo dõi thời gian phản hồi và hiệu suất của từng API endpoint
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
              <SelectItem value="90">90 ngày</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={handleExportCSV}>
            <Download className="h-4 w-4" />
          </Button>
          
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
      
      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Server className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tổng requests</p>
                <p className="text-2xl font-bold">{overallStats?.totalRequests?.toLocaleString() || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                <Timer className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Response</p>
                <p className={`text-2xl font-bold ${getResponseTimeColor(overallStats?.avgResponseTime || 0)}`}>
                  {formatResponseTime(overallStats?.avgResponseTime || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Endpoints</p>
                <p className="text-2xl font-bold">{overallStats?.uniqueEndpoints || 0}</p>
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
                <p className={`text-2xl font-bold ${getErrorRateColor(parseFloat(overallStats?.errorRate || "0"))}`}>
                  {overallStats?.errorRate || "0.00"}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Top Issues */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Slowest Endpoints */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              Endpoints chậm nhất (P95)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {slowestEndpoints && slowestEndpoints.length > 0 ? (
              <div className="space-y-3">
                {slowestEndpoints.map((e, i) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedEndpoint({ endpoint: e.endpoint, method: e.method })}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge className={`${getMethodColor(e.method)} text-xs`}>
                        {e.method}
                      </Badge>
                      <span className="text-sm truncate">{e.endpoint}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${getResponseTimeColor(e.p95ResponseTime)}`}>
                        {formatResponseTime(e.p95ResponseTime)}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Chưa có dữ liệu
              </p>
            )}
          </CardContent>
        </Card>
        
        {/* Error Prone Endpoints */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Endpoints lỗi nhiều nhất
            </CardTitle>
          </CardHeader>
          <CardContent>
            {errorProneEndpoints && errorProneEndpoints.length > 0 ? (
              <div className="space-y-3">
                {errorProneEndpoints.map((e, i) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedEndpoint({ endpoint: e.endpoint, method: e.method })}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge className={`${getMethodColor(e.method)} text-xs`}>
                        {e.method}
                      </Badge>
                      <span className="text-sm truncate">{e.endpoint}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${getErrorRateColor(parseFloat(e.errorRate))}`}>
                        {e.errorRate}%
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <Zap className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm text-muted-foreground">Không có endpoint lỗi</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Endpoints Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-base">Danh sách Endpoints</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm endpoint..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {endpoints && endpoints.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Endpoint</TableHead>
                    <TableHead className="text-right">Requests</TableHead>
                    <TableHead className="text-right">Avg</TableHead>
                    <TableHead className="text-right">P50</TableHead>
                    <TableHead className="text-right">P95</TableHead>
                    <TableHead className="text-right">P99</TableHead>
                    <TableHead className="text-right">Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {endpoints.map((e, i) => (
                    <TableRow 
                      key={i} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedEndpoint({ endpoint: e.endpoint, method: e.method })}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getMethodColor(e.method)} text-xs`}>
                            {e.method}
                          </Badge>
                          <span className="text-sm truncate max-w-[300px]">{e.endpoint}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {e.totalRequests.toLocaleString()}
                      </TableCell>
                      <TableCell className={`text-right ${getResponseTimeColor(e.avgResponseTime)}`}>
                        {formatResponseTime(e.avgResponseTime)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatResponseTime(e.p50ResponseTime)}
                      </TableCell>
                      <TableCell className="text-right text-yellow-600">
                        {formatResponseTime(e.p95ResponseTime)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {formatResponseTime(e.p99ResponseTime)}
                      </TableCell>
                      <TableCell className={`text-right ${getErrorRateColor(parseFloat(e.errorRate))}`}>
                        {e.errorRate}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">Chưa có dữ liệu</h3>
              <p className="text-muted-foreground">
                Dữ liệu sẽ được thu thập khi có API requests
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Endpoint Detail Dialog */}
      <Dialog open={!!selectedEndpoint} onOpenChange={() => setSelectedEndpoint(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge className={`${getMethodColor(selectedEndpoint?.method || "")}`}>
                {selectedEndpoint?.method}
              </Badge>
              <span className="truncate">{selectedEndpoint?.endpoint}</span>
            </DialogTitle>
            <DialogDescription>
              Chi tiết hiệu suất trong {days} ngày qua
            </DialogDescription>
          </DialogHeader>
          
          {loadingDetail ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : endpointDetail ? (
            <Tabs defaultValue="trend" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="trend">Xu hướng</TabsTrigger>
                <TabsTrigger value="hourly">Theo giờ</TabsTrigger>
                <TabsTrigger value="distribution">Phân bố</TabsTrigger>
              </TabsList>
              
              {/* Trend Tab */}
              <TabsContent value="trend" className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Response Time theo ngày</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={dailyChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(v) => v.slice(5)}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(v) => `${v}ms`}
                        />
                        <Tooltip 
                          formatter={(value: number) => [`${value}ms`, ""]}
                          labelFormatter={(label) => `Ngày: ${label}`}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="P50" 
                          stroke={COLORS.p50} 
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="P95" 
                          stroke={COLORS.p95} 
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="P99" 
                          stroke={COLORS.p99} 
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Số lượng Requests & Error Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={dailyChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(v) => v.slice(5)}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="Requests" 
                          fill={COLORS.primary}
                          stroke={COLORS.primary}
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Hourly Tab */}
              <TabsContent value="hourly" className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Phân bố theo giờ (hôm nay)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={hourlyChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="hour" 
                          tick={{ fontSize: 10 }}
                          interval={2}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Bar 
                          dataKey="count" 
                          name="Requests"
                          fill={COLORS.primary}
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Avg Response Time theo giờ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={hourlyChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="hour" 
                          tick={{ fontSize: 10 }}
                          interval={2}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(v) => `${v}ms`}
                        />
                        <Tooltip formatter={(value: number) => [`${value}ms`, "Avg Time"]} />
                        <Line 
                          type="monotone" 
                          dataKey="avgTime" 
                          stroke={COLORS.warning}
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Distribution Tab */}
              <TabsContent value="distribution" className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Phân bố Response Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={endpointDetail.responseTimeDistribution}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="range" 
                          tick={{ fontSize: 10 }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar 
                          dataKey="count" 
                          name="Requests"
                          fill={COLORS.purple}
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-sm text-muted-foreground">P50 (Median)</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatResponseTime(endpointDetail.dailyStats[endpointDetail.dailyStats.length - 1]?.p50ResponseTime || 0)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-sm text-muted-foreground">P95</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {formatResponseTime(endpointDetail.dailyStats[endpointDetail.dailyStats.length - 1]?.p95ResponseTime || 0)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-sm text-muted-foreground">P99</p>
                      <p className="text-2xl font-bold text-red-600">
                        {formatResponseTime(endpointDetail.dailyStats[endpointDetail.dailyStats.length - 1]?.p99ResponseTime || 0)}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Không có dữ liệu cho endpoint này
            </p>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <Activity className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Về Endpoint Analytics</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Hệ thống tự động thu thập thời gian phản hồi của tất cả API endpoints. 
                Dữ liệu được tổng hợp hàng ngày với các percentiles (P50, P95, P99) để giúp bạn 
                xác định các endpoints cần tối ưu. P95 là chỉ số quan trọng nhất - 95% requests 
                sẽ có response time thấp hơn giá trị này.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
