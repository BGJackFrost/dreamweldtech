/**
 * Scheduled Reports Manager Component
 * 
 * Admin UI for managing scheduled performance reports.
 * Allows creating, editing, and managing automated email reports.
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Calendar,
  Clock,
  Mail,
  Plus,
  Edit,
  Trash2,
  Send,
  RefreshCw,
  FileText,
  BarChart3,
  CheckCircle,
  XCircle
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// Types
interface ReportFormData {
  name: string;
  reportType: "daily" | "weekly" | "monthly";
  dayOfWeek: number;
  dayOfMonth: number;
  sendHour: number;
  timezone: string;
  recipients: string;
  includeMetrics: string[];
  includePeriodComparison: boolean;
  includeCharts: boolean;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Chủ nhật" },
  { value: 1, label: "Thứ 2" },
  { value: 2, label: "Thứ 3" },
  { value: 3, label: "Thứ 4" },
  { value: 4, label: "Thứ 5" },
  { value: 5, label: "Thứ 6" },
  { value: 6, label: "Thứ 7" },
];

const REPORT_TYPES = [
  { value: "daily", label: "Hàng ngày" },
  { value: "weekly", label: "Hàng tuần" },
  { value: "monthly", label: "Hàng tháng" },
];

const METRICS_OPTIONS = [
  { value: "cpu", label: "CPU Usage" },
  { value: "memory", label: "Memory Usage" },
  { value: "responseTime", label: "Response Time" },
  { value: "errorRate", label: "Error Rate" },
  { value: "uptime", label: "Uptime & Availability" },
];

const DEFAULT_FORM_DATA: ReportFormData = {
  name: "",
  reportType: "weekly",
  dayOfWeek: 1,
  dayOfMonth: 1,
  sendHour: 9,
  timezone: "Asia/Ho_Chi_Minh",
  recipients: "",
  includeMetrics: ["cpu", "memory", "responseTime", "errorRate", "uptime"],
  includePeriodComparison: true,
  includeCharts: true,
};

export default function ScheduledReportsManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ReportFormData>(DEFAULT_FORM_DATA);
  
  // Fetch reports
  const { data: reports, isLoading, refetch } = trpc.scheduledReports.list.useQuery();
  
  // Mutations
  const createMutation = trpc.scheduledReports.create.useMutation({
    onSuccess: () => {
      toast.success("Đã tạo báo cáo định kỳ");
      setIsDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
  
  const updateMutation = trpc.scheduledReports.update.useMutation({
    onSuccess: () => {
      toast.success("Đã cập nhật báo cáo");
      setIsDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
  
  const deleteMutation = trpc.scheduledReports.delete.useMutation({
    onSuccess: () => {
      toast.success("Đã xóa báo cáo");
      refetch();
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
  
  const sendNowMutation = trpc.scheduledReports.sendNow.useMutation({
    onSuccess: () => {
      toast.success("Đã gửi báo cáo");
      refetch();
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
  
  // Form handlers
  const resetForm = () => {
    setFormData(DEFAULT_FORM_DATA);
    setEditingId(null);
  };
  
  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };
  
  const openEditDialog = (report: typeof reports extends (infer T)[] | undefined ? T : never) => {
    if (!report) return;
    setEditingId(report.id);
    setFormData({
      name: report.name,
      reportType: report.reportType as "daily" | "weekly" | "monthly",
      dayOfWeek: report.dayOfWeek || 1,
      dayOfMonth: report.dayOfMonth || 1,
      sendHour: report.sendHour || 9,
      timezone: report.timezone || "Asia/Ho_Chi_Minh",
      recipients: report.recipients,
      includeMetrics: report.includeMetrics?.split(",") || ["cpu", "memory", "responseTime", "errorRate", "uptime"],
      includePeriodComparison: report.includePeriodComparison === "true",
      includeCharts: report.includeCharts === "true",
    });
    setIsDialogOpen(true);
  };
  
  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập tên báo cáo");
      return;
    }
    if (!formData.recipients.trim()) {
      toast.error("Vui lòng nhập email người nhận");
      return;
    }
    
    const data = {
      name: formData.name,
      reportType: formData.reportType,
      dayOfWeek: formData.dayOfWeek,
      dayOfMonth: formData.dayOfMonth,
      sendHour: formData.sendHour,
      timezone: formData.timezone,
      recipients: formData.recipients,
      includeMetrics: formData.includeMetrics.join(","),
      includePeriodComparison: formData.includePeriodComparison,
      includeCharts: formData.includeCharts,
    };
    
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };
  
  const handleToggleEnabled = (id: number, currentEnabled: boolean) => {
    updateMutation.mutate({ id, isEnabled: !currentEnabled });
  };
  
  // Format schedule description
  const formatSchedule = (report: typeof reports extends (infer T)[] | undefined ? T : never) => {
    if (!report) return "";
    
    const hour = report.sendHour?.toString().padStart(2, "0") || "09";
    
    switch (report.reportType) {
      case "daily":
        return `Hàng ngày lúc ${hour}:00`;
      case "weekly":
        const day = DAYS_OF_WEEK.find(d => d.value === report.dayOfWeek)?.label || "Thứ 2";
        return `${day} hàng tuần lúc ${hour}:00`;
      case "monthly":
        return `Ngày ${report.dayOfMonth} hàng tháng lúc ${hour}:00`;
      default:
        return "";
    }
  };
  
  if (isLoading) {
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
            <FileText className="h-5 w-5" />
            Báo cáo định kỳ
          </h3>
          <p className="text-sm text-muted-foreground">
            Quản lý báo cáo hiệu suất tự động gửi qua email
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Tạo báo cáo mới
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Chỉnh sửa báo cáo" : "Tạo báo cáo định kỳ mới"}
              </DialogTitle>
              <DialogDescription>
                Cấu hình báo cáo hiệu suất tự động gửi qua email
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Tên báo cáo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Báo cáo hiệu suất tuần"
                />
              </div>
              
              {/* Report Type */}
              <div className="space-y-2">
                <Label>Loại báo cáo</Label>
                <Select
                  value={formData.reportType}
                  onValueChange={(v) => setFormData({ ...formData, reportType: v as "daily" | "weekly" | "monthly" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Day of Week (for weekly) */}
              {formData.reportType === "weekly" && (
                <div className="space-y-2">
                  <Label>Ngày trong tuần</Label>
                  <Select
                    value={formData.dayOfWeek.toString()}
                    onValueChange={(v) => setFormData({ ...formData, dayOfWeek: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day) => (
                        <SelectItem key={day.value} value={day.value.toString()}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Day of Month (for monthly) */}
              {formData.reportType === "monthly" && (
                <div className="space-y-2">
                  <Label>Ngày trong tháng</Label>
                  <Select
                    value={formData.dayOfMonth.toString()}
                    onValueChange={(v) => setFormData({ ...formData, dayOfMonth: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={day.toString()}>
                          Ngày {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Send Hour */}
              <div className="space-y-2">
                <Label>Giờ gửi</Label>
                <Select
                  value={formData.sendHour.toString()}
                  onValueChange={(v) => setFormData({ ...formData, sendHour: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                      <SelectItem key={hour} value={hour.toString()}>
                        {hour.toString().padStart(2, "0")}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Recipients */}
              <div className="space-y-2">
                <Label htmlFor="recipients">Email người nhận</Label>
                <Input
                  id="recipients"
                  value={formData.recipients}
                  onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                  placeholder="email1@example.com, email2@example.com"
                />
                <p className="text-xs text-muted-foreground">
                  Nhiều email cách nhau bằng dấu phẩy
                </p>
              </div>
              
              {/* Metrics */}
              <div className="space-y-2">
                <Label>Metrics bao gồm</Label>
                <div className="grid grid-cols-2 gap-2">
                  {METRICS_OPTIONS.map((metric) => (
                    <div key={metric.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={metric.value}
                        checked={formData.includeMetrics.includes(metric.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              includeMetrics: [...formData.includeMetrics, metric.value],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              includeMetrics: formData.includeMetrics.filter((m) => m !== metric.value),
                            });
                          }
                        }}
                      />
                      <Label htmlFor={metric.value} className="text-sm font-normal">
                        {metric.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Options */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="comparison" className="text-sm font-normal">
                    So sánh với kỳ trước
                  </Label>
                  <Switch
                    id="comparison"
                    checked={formData.includePeriodComparison}
                    onCheckedChange={(checked) => setFormData({ ...formData, includePeriodComparison: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="charts" className="text-sm font-normal">
                    Bao gồm biểu đồ
                  </Label>
                  <Switch
                    id="charts"
                    checked={formData.includeCharts}
                    onCheckedChange={(checked) => setFormData({ ...formData, includeCharts: checked })}
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Hủy
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingId ? "Cập nhật" : "Tạo báo cáo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Reports List */}
      {reports && reports.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên báo cáo</TableHead>
                  <TableHead>Lịch gửi</TableHead>
                  <TableHead>Người nhận</TableHead>
                  <TableHead>Gửi tiếp theo</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {report.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatSchedule(report)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm truncate max-w-[150px]">
                          {report.recipients.split(",").length} người nhận
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {report.nextSendAt ? (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {new Date(report.nextSendAt).toLocaleString("vi-VN")}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={report.isEnabled === "true"}
                          onCheckedChange={() => handleToggleEnabled(report.id, report.isEnabled === "true")}
                        />
                        <Badge variant={report.isEnabled === "true" ? "default" : "secondary"}>
                          {report.isEnabled === "true" ? "Hoạt động" : "Tạm dừng"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => sendNowMutation.mutate({ id: report.id })}
                          disabled={sendNowMutation.isPending}
                          title="Gửi ngay"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(report)}
                          title="Chỉnh sửa"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" title="Xóa">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bạn có chắc muốn xóa báo cáo "{report.name}"? Hành động này không thể hoàn tác.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate({ id: report.id })}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Xóa
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">Chưa có báo cáo định kỳ</h3>
            <p className="text-muted-foreground mb-4">
              Tạo báo cáo đầu tiên để tự động nhận email hiệu suất hệ thống
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Tạo báo cáo mới
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <BarChart3 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100">Về báo cáo định kỳ</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Báo cáo định kỳ tự động tổng hợp các metrics hiệu suất (CPU, Memory, Response Time, Error Rate, Uptime) 
                và gửi qua email theo lịch đã cấu hình. Bạn có thể so sánh với kỳ trước để theo dõi xu hướng.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
