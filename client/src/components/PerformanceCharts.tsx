/**
 * Performance Charts Component
 * 
 * Displays interactive line charts for CPU, Memory, Response Time, and Error Rate
 * using data from the metrics history API.
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart,
  Bar
} from "recharts";
import { 
  Activity, 
  Cpu, 
  MemoryStick, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// Chart colors
const COLORS = {
  cpu: "#3b82f6", // blue
  memory: "#8b5cf6", // purple
  responseTime: "#f59e0b", // amber
  errorRate: "#ef4444", // red
  requests: "#10b981", // emerald
};

// Format timestamp for chart
function formatTime(timestamp: string | Date): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(timestamp: string | Date): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

// Custom tooltip component
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  
  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">
            {entry.name.includes("Rate") || entry.name.includes("CPU") || entry.name.includes("Memory")
              ? `${entry.value}%`
              : entry.name.includes("Time")
              ? `${entry.value}ms`
              : entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

// Trend indicator
function TrendIndicator({ current, previous }: { current: number; previous: number }) {
  const diff = current - previous;
  const percentage = previous > 0 ? ((diff / previous) * 100).toFixed(1) : 0;
  
  if (Math.abs(diff) < 0.1) {
    return <span className="text-muted-foreground text-xs">Không đổi</span>;
  }
  
  return (
    <span className={`flex items-center gap-1 text-xs ${diff > 0 ? "text-red-500" : "text-green-500"}`}>
      {diff > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {diff > 0 ? "+" : ""}{percentage}%
    </span>
  );
}

// Metric summary card
function MetricSummaryCard({ 
  title, 
  icon: Icon, 
  current, 
  avg, 
  max, 
  min,
  unit,
  color,
  warning,
  critical
}: {
  title: string;
  icon: any;
  current: number;
  avg: number;
  max: number;
  min: number;
  unit: string;
  color: string;
  warning?: number;
  critical?: number;
}) {
  const status = critical && current >= critical ? "critical" 
    : warning && current >= warning ? "warning" 
    : "normal";
  
  return (
    <Card className={status === "critical" ? "border-red-500" : status === "warning" ? "border-yellow-500" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Icon className="h-4 w-4" style={{ color }} />
            {title}
          </CardTitle>
          {status !== "normal" && (
            <Badge variant={status === "critical" ? "destructive" : "secondary"}>
              <AlertTriangle className="h-3 w-3 mr-1" />
              {status === "critical" ? "Nghiêm trọng" : "Cảnh báo"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold" style={{ color }}>
          {current}{unit}
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-muted-foreground">
          <div>
            <span className="block">TB</span>
            <span className="font-medium text-foreground">{avg}{unit}</span>
          </div>
          <div>
            <span className="block">Min</span>
            <span className="font-medium text-foreground">{min}{unit}</span>
          </div>
          <div>
            <span className="block">Max</span>
            <span className="font-medium text-foreground">{max}{unit}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Main component
export default function PerformanceCharts() {
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");
  const [chartType, setChartType] = useState<"line" | "area">("area");
  
  // Fetch report data
  const { data: report, isLoading, refetch } = trpc.metricsHistory.getReport.useQuery(
    { period },
    { refetchInterval: 60000 } // Refresh every minute
  );
  
  // Process chart data
  const chartData = useMemo(() => {
    if (!report?.chartData) return [];
    
    return report.chartData.map((item) => ({
      ...item,
      time: period === "day" 
        ? formatTime(item.timestamp) 
        : formatDate(item.timestamp) + " " + formatTime(item.timestamp),
    }));
  }, [report?.chartData, period]);
  
  // Get current values (latest data point)
  const currentValues = useMemo(() => {
    if (!chartData.length) return { cpu: 0, memory: 0, responseTime: 0, errorRate: 0 };
    const latest = chartData[chartData.length - 1];
    return {
      cpu: latest.cpu || 0,
      memory: latest.memory || 0,
      responseTime: latest.responseTime || 0,
      errorRate: latest.errorRate || 0,
    };
  }, [chartData]);
  
  // Export chart data
  const handleExport = () => {
    if (!report?.chartData) return;
    
    const csv = [
      ["Timestamp", "CPU (%)", "Memory (%)", "Response Time (ms)", "Error Rate (%)"].join(","),
      ...report.chartData.map(row => [
        new Date(row.timestamp).toISOString(),
        row.cpu,
        row.memory,
        row.responseTime,
        row.errorRate
      ].join(","))
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `performance-${period}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Đã xuất dữ liệu CSV");
  };
  
  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Chọn kỳ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">24 giờ qua</SelectItem>
              <SelectItem value="week">7 ngày qua</SelectItem>
              <SelectItem value="month">30 ngày qua</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={chartType} onValueChange={(v) => setChartType(v as typeof chartType)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Loại biểu đồ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="area">Area Chart</SelectItem>
              <SelectItem value="line">Line Chart</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!report?.chartData?.length}>
            <Download className="h-4 w-4 mr-2" />
            Xuất CSV
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      {report?.summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricSummaryCard
            title="CPU"
            icon={Cpu}
            current={currentValues.cpu}
            avg={report.summary.cpu.avg}
            max={report.summary.cpu.max}
            min={report.summary.cpu.min}
            unit="%"
            color={COLORS.cpu}
            warning={70}
            critical={90}
          />
          <MetricSummaryCard
            title="Memory"
            icon={MemoryStick}
            current={currentValues.memory}
            avg={report.summary.memory.avg}
            max={report.summary.memory.max}
            min={report.summary.memory.min}
            unit="%"
            color={COLORS.memory}
            warning={80}
            critical={95}
          />
          <MetricSummaryCard
            title="Response Time"
            icon={Clock}
            current={currentValues.responseTime}
            avg={report.summary.responseTime.avg}
            max={report.summary.responseTime.max}
            min={report.summary.responseTime.min}
            unit="ms"
            color={COLORS.responseTime}
            warning={500}
            critical={1000}
          />
          <MetricSummaryCard
            title="Error Rate"
            icon={AlertTriangle}
            current={currentValues.errorRate}
            avg={report.summary.errorRate.avg}
            max={report.summary.errorRate.max}
            min={report.summary.errorRate.min}
            unit="%"
            color={COLORS.errorRate}
            warning={5}
            critical={10}
          />
        </div>
      )}
      
      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="cpu">CPU</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
          <TabsTrigger value="response">Response Time</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>
        
        {/* Overview Chart */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Tổng quan hiệu suất
              </CardTitle>
              <CardDescription>
                {report?.dataPoints || 0} điểm dữ liệu từ {report?.startDate ? new Date(report.startDate).toLocaleDateString("vi-VN") : "N/A"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  {chartType === "area" ? (
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="time" 
                        tick={{ fontSize: 12 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        yAxisId="left"
                        tick={{ fontSize: 12 }}
                        domain={[0, 100]}
                        label={{ value: '%', angle: -90, position: 'insideLeft' }}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 12 }}
                        label={{ value: 'ms', angle: 90, position: 'insideRight' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="cpu"
                        name="CPU"
                        stroke={COLORS.cpu}
                        fill={COLORS.cpu}
                        fillOpacity={0.2}
                      />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="memory"
                        name="Memory"
                        stroke={COLORS.memory}
                        fill={COLORS.memory}
                        fillOpacity={0.2}
                      />
                      <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="responseTime"
                        name="Response Time"
                        stroke={COLORS.responseTime}
                        fill={COLORS.responseTime}
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  ) : (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="time" 
                        tick={{ fontSize: 12 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        yAxisId="left"
                        tick={{ fontSize: 12 }}
                        domain={[0, 100]}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="cpu"
                        name="CPU"
                        stroke={COLORS.cpu}
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="memory"
                        name="Memory"
                        stroke={COLORS.memory}
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="responseTime"
                        name="Response Time"
                        stroke={COLORS.responseTime}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  {isLoading ? "Đang tải dữ liệu..." : "Chưa có dữ liệu"}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* CPU Chart */}
        <TabsContent value="cpu">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5" style={{ color: COLORS.cpu }} />
                CPU Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <defs>
                      <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.cpu} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={COLORS.cpu} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="cpu"
                      name="CPU"
                      stroke={COLORS.cpu}
                      fill="url(#cpuGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  {isLoading ? "Đang tải dữ liệu..." : "Chưa có dữ liệu"}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Memory Chart */}
        <TabsContent value="memory">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MemoryStick className="h-5 w-5" style={{ color: COLORS.memory }} />
                Memory Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <defs>
                      <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.memory} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={COLORS.memory} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="memory"
                      name="Memory"
                      stroke={COLORS.memory}
                      fill="url(#memoryGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  {isLoading ? "Đang tải dữ liệu..." : "Chưa có dữ liệu"}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Response Time Chart */}
        <TabsContent value="response">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" style={{ color: COLORS.responseTime }} />
                Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="responseTime"
                      name="Response Time"
                      fill={COLORS.responseTime}
                      fillOpacity={0.5}
                    />
                    <Line
                      type="monotone"
                      dataKey="responseTime"
                      name="Response Time"
                      stroke={COLORS.responseTime}
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  {isLoading ? "Đang tải dữ liệu..." : "Chưa có dữ liệu"}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Error Rate Chart */}
        <TabsContent value="errors">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" style={{ color: COLORS.errorRate }} />
                Error Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, "auto"]} tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <defs>
                      <linearGradient id="errorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.errorRate} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={COLORS.errorRate} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="errorRate"
                      name="Error Rate"
                      stroke={COLORS.errorRate}
                      fill="url(#errorGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  {isLoading ? "Đang tải dữ liệu..." : "Chưa có dữ liệu"}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
