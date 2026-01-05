/**
 * Rate Limiting Dashboard
 * 
 * Manage and monitor API rate limiting configurations.
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  AreaChart,
  Area,
} from "recharts";
import {
  Shield,
  Settings,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Ban,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// Colors
const COLORS = {
  primary: "#0ea5e9",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
};

export default function RateLimitingDashboard() {
  const [days, setDays] = useState(7);
  const [editingConfig, setEditingConfig] = useState<any>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newConfig, setNewConfig] = useState({
    endpointPattern: "",
    maxRequests: 100,
    windowSeconds: 60,
    blockDurationSeconds: 60,
    priority: 100,
    description: "",
    errorMessage: "",
  });
  
  // Fetch data
  const { data: configs, isLoading: loadingConfigs, refetch: refetchConfigs } = 
    trpc.rateLimiting.getConfigs.useQuery();
  
  const { data: usageStats, isLoading: loadingUsage } = 
    trpc.rateLimiting.getUsageStats.useQuery({ days });
  
  const { data: endpointStats } = 
    trpc.rateLimiting.getEndpointStats.useQuery({ days });
  
  // Mutations
  const createConfig = trpc.rateLimiting.createConfig.useMutation({
    onSuccess: () => {
      toast.success("Đã tạo cấu hình rate limit mới");
      refetchConfigs();
      setIsCreateOpen(false);
      setNewConfig({
        endpointPattern: "",
        maxRequests: 100,
        windowSeconds: 60,
        blockDurationSeconds: 60,
        priority: 100,
        description: "",
        errorMessage: "",
      });
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
  
  const updateConfig = trpc.rateLimiting.updateConfig.useMutation({
    onSuccess: () => {
      toast.success("Đã cập nhật cấu hình");
      refetchConfigs();
      setEditingConfig(null);
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
  
  const deleteConfig = trpc.rateLimiting.deleteConfig.useMutation({
    onSuccess: () => {
      toast.success("Đã xóa cấu hình");
      refetchConfigs();
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
  
  const refreshCache = trpc.rateLimiting.refreshCache.useMutation({
    onSuccess: (data) => {
      toast.success(`Đã refresh cache (${data.configCount} configs)`);
    },
    onError: (error: { message: string }) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
  
  // Prepare chart data
  const dailyChartData = usageStats?.daily?.map((d: { dateKey: string | null; totalRequests: number; blockedRequests: number }) => ({
    date: d.dateKey?.slice(5) || "",
    "Tổng requests": d.totalRequests,
    "Bị chặn": d.blockedRequests,
  })) || [];
  
  const hourlyChartData = Array.from({ length: 24 }, (_, i) => {
    const hourData = usageStats?.hourly?.find((h: { hour: number | null }) => h.hour === i);
    return {
      hour: `${i.toString().padStart(2, "0")}:00`,
      "Tổng requests": hourData?.totalRequests || 0,
      "Bị chặn": hourData?.blockedRequests || 0,
    };
  });
  
  if (loadingConfigs || loadingUsage) {
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
            <Shield className="h-5 w-5" />
            Rate Limiting Dashboard
          </h3>
          <p className="text-sm text-muted-foreground">
            Quản lý và giám sát giới hạn tốc độ API
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
            onClick={() => refreshCache.mutate()}
            disabled={refreshCache.isPending}
          >
            <RefreshCw className={`h-4 w-4 ${refreshCache.isPending ? "animate-spin" : ""}`} />
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
                <p className="text-sm text-muted-foreground">Tổng requests</p>
                <p className="text-2xl font-bold">{usageStats?.totalRequests?.toLocaleString() || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
                <Ban className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Bị chặn</p>
                <p className="text-2xl font-bold text-red-600">{usageStats?.blockedRequests?.toLocaleString() || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tỷ lệ chặn</p>
                <p className="text-2xl font-bold">{usageStats?.blockRate || "0.00"}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                <Settings className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cấu hình</p>
                <p className="text-2xl font-bold">{configs?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="configs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configs">Cấu hình</TabsTrigger>
          <TabsTrigger value="usage">Thống kê sử dụng</TabsTrigger>
          <TabsTrigger value="endpoints">Theo endpoint</TabsTrigger>
        </TabsList>
        
        {/* Configs Tab */}
        <TabsContent value="configs" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Cấu hình Rate Limit</CardTitle>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Thêm mới
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Tạo cấu hình Rate Limit mới</DialogTitle>
                      <DialogDescription>
                        Thiết lập giới hạn tốc độ cho endpoint pattern
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Endpoint Pattern</Label>
                        <Input
                          placeholder="/api/trpc/products.*"
                          value={newConfig.endpointPattern}
                          onChange={(e) => setNewConfig({ ...newConfig, endpointPattern: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">Sử dụng * để match nhiều paths</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Max Requests</Label>
                          <Input
                            type="number"
                            value={newConfig.maxRequests}
                            onChange={(e) => setNewConfig({ ...newConfig, maxRequests: parseInt(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Window (giây)</Label>
                          <Input
                            type="number"
                            value={newConfig.windowSeconds}
                            onChange={(e) => setNewConfig({ ...newConfig, windowSeconds: parseInt(e.target.value) })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Block Duration (giây)</Label>
                          <Input
                            type="number"
                            value={newConfig.blockDurationSeconds}
                            onChange={(e) => setNewConfig({ ...newConfig, blockDurationSeconds: parseInt(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Priority</Label>
                          <Input
                            type="number"
                            value={newConfig.priority}
                            onChange={(e) => setNewConfig({ ...newConfig, priority: parseInt(e.target.value) })}
                          />
                          <p className="text-xs text-muted-foreground">Số nhỏ = ưu tiên cao</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Mô tả</Label>
                        <Input
                          placeholder="Mô tả cấu hình..."
                          value={newConfig.description}
                          onChange={(e) => setNewConfig({ ...newConfig, description: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                        Hủy
                      </Button>
                      <Button 
                        onClick={() => createConfig.mutate(newConfig)}
                        disabled={createConfig.isPending || !newConfig.endpointPattern}
                      >
                        Tạo
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Endpoint Pattern</TableHead>
                    <TableHead className="text-right">Limit</TableHead>
                    <TableHead className="text-right">Window</TableHead>
                    <TableHead className="text-right">Block</TableHead>
                    <TableHead className="text-center">Trạng thái</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configs?.map((config: { id: number; endpointPattern: string; maxRequests: number; windowSeconds: number; blockDurationSeconds: number | null; isEnabled: string; priority: number | null; description: string | null }) => (
                    <TableRow key={config.id}>
                      <TableCell>
                        <div>
                          <code className="text-sm bg-muted px-1 rounded">{config.endpointPattern}</code>
                          {config.description && (
                            <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {config.maxRequests}
                      </TableCell>
                      <TableCell className="text-right">
                        {config.windowSeconds}s
                      </TableCell>
                      <TableCell className="text-right">
                        {config.blockDurationSeconds}s
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={config.isEnabled === "true"}
                          onCheckedChange={(checked) => {
                            updateConfig.mutate({ id: config.id, isEnabled: checked });
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingConfig(config)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Bạn có chắc muốn xóa cấu hình này?")) {
                                deleteConfig.mutate({ id: config.id });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Requests theo ngày</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={dailyChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="Tổng requests" 
                      fill={COLORS.primary}
                      stroke={COLORS.primary}
                      fillOpacity={0.3}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Bị chặn" 
                      fill={COLORS.danger}
                      stroke={COLORS.danger}
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Phân bố theo giờ</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={hourlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Tổng requests" fill={COLORS.primary} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Bị chặn" fill={COLORS.danger} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          {/* Top Blocked */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Ban className="h-4 w-4 text-red-500" />
                Endpoints bị chặn nhiều nhất
              </CardTitle>
            </CardHeader>
            <CardContent>
              {usageStats?.topBlocked && usageStats.topBlocked.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Endpoint</TableHead>
                      <TableHead className="text-right">Số lần bị chặn</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usageStats.topBlocked.map((e: { endpoint: string; blockedCount: number }, i: number) => (
                      <TableRow key={i}>
                        <TableCell>
                          <code className="text-sm">{e.endpoint}</code>
                        </TableCell>
                        <TableCell className="text-right font-medium text-red-600">
                          {e.blockedCount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p className="text-muted-foreground">Không có request nào bị chặn</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Endpoints Tab */}
        <TabsContent value="endpoints" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Thống kê theo Endpoint</CardTitle>
            </CardHeader>
            <CardContent>
              {endpointStats && endpointStats.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Endpoint</TableHead>
                      <TableHead className="text-right">Tổng</TableHead>
                      <TableHead className="text-right">Bị chặn</TableHead>
                      <TableHead className="text-right">Tỷ lệ chặn</TableHead>
                      <TableHead className="text-right">Avg/giờ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {endpointStats.map((e: { endpoint: string; totalRequests: number; blockedRequests: number; blockRate: string; avgRequestsPerHour: number }, i: number) => (
                      <TableRow key={i}>
                        <TableCell>
                          <code className="text-sm">{e.endpoint}</code>
                        </TableCell>
                        <TableCell className="text-right">
                          {e.totalRequests.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {e.blockedRequests.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge 
                            variant={parseFloat(e.blockRate) > 5 ? "destructive" : "secondary"}
                          >
                            {e.blockRate}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {Math.round(e.avgRequestsPerHour)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Chưa có dữ liệu</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Edit Dialog */}
      <Dialog open={!!editingConfig} onOpenChange={() => setEditingConfig(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa cấu hình</DialogTitle>
            <DialogDescription>
              {editingConfig?.endpointPattern}
            </DialogDescription>
          </DialogHeader>
          {editingConfig && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Requests</Label>
                  <Input
                    type="number"
                    value={editingConfig.maxRequests}
                    onChange={(e) => setEditingConfig({ ...editingConfig, maxRequests: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Window (giây)</Label>
                  <Input
                    type="number"
                    value={editingConfig.windowSeconds}
                    onChange={(e) => setEditingConfig({ ...editingConfig, windowSeconds: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Block Duration (giây)</Label>
                  <Input
                    type="number"
                    value={editingConfig.blockDurationSeconds}
                    onChange={(e) => setEditingConfig({ ...editingConfig, blockDurationSeconds: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Input
                    type="number"
                    value={editingConfig.priority}
                    onChange={(e) => setEditingConfig({ ...editingConfig, priority: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Input
                  value={editingConfig.description || ""}
                  onChange={(e) => setEditingConfig({ ...editingConfig, description: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingConfig(null)}>
              Hủy
            </Button>
            <Button 
              onClick={() => updateConfig.mutate({
                id: editingConfig.id,
                maxRequests: editingConfig.maxRequests,
                windowSeconds: editingConfig.windowSeconds,
                blockDurationSeconds: editingConfig.blockDurationSeconds,
                priority: editingConfig.priority,
                description: editingConfig.description,
              })}
              disabled={updateConfig.isPending}
            >
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Về Rate Limiting</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Rate limiting bảo vệ API khỏi bị abuse và đảm bảo fair usage. Mỗi IP được giới hạn 
                số requests trong một khoảng thời gian. Khi vượt quá giới hạn, IP sẽ bị block tạm thời.
                Endpoint patterns sử dụng wildcard (*) để match nhiều paths. Priority thấp hơn = ưu tiên cao hơn.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
