import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, Search, Eye, FileText, User, Calendar, Activity, Download, FileJson, FileSpreadsheet } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const ACTION_LABELS: Record<string, string> = {
  create: "Tạo mới",
  update: "Cập nhật",
  delete: "Xóa",
  view: "Xem",
  export: "Xuất",
  import: "Nhập",
  publish: "Xuất bản",
  unpublish: "Hủy xuất bản",
  approve: "Phê duyệt",
  reject: "Từ chối",
  archive: "Lưu trữ",
  restore: "Khôi phục",
  login: "Đăng nhập",
  logout: "Đăng xuất",
  settings_change: "Thay đổi cài đặt",
  permission_change: "Thay đổi quyền",
  bulk_action: "Thao tác hàng loạt",
};

// Export Menu Item Component
function ExportMenuItem({ format, filters }: { format: "csv" | "json"; filters: any }) {
  const csvQuery = trpc.advancedSecurity.export.csv.useQuery({
    action: filters.action !== "all" ? filters.action : undefined,
    resourceType: filters.resourceType !== "all" ? filters.resourceType : undefined,
    status: filters.status !== "all" ? filters.status : undefined,
    search: filters.search || undefined,
  }, { enabled: false });

  const jsonQuery = trpc.advancedSecurity.export.json.useQuery({
    action: filters.action !== "all" ? filters.action : undefined,
    resourceType: filters.resourceType !== "all" ? filters.resourceType : undefined,
    status: filters.status !== "all" ? filters.status : undefined,
    search: filters.search || undefined,
  }, { enabled: false });

  const handleExport = async () => {
    const query = format === "csv" ? csvQuery : jsonQuery;
    const result = await query.refetch();
    if (result.data) {
      const blob = new Blob([result.data], { type: format === "csv" ? "text/csv" : "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().split("T")[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <DropdownMenuItem onClick={handleExport}>
      {format === "csv" ? (
        <><FileSpreadsheet className="h-4 w-4 mr-2" /> Xuất CSV</>
      ) : (
        <><FileJson className="h-4 w-4 mr-2" /> Xuất JSON</>
      )}
    </DropdownMenuItem>
  );
}

const RESOURCE_LABELS: Record<string, string> = {
  product: "Sản phẩm",
  news: "Tin tức",
  case_study: "Case Study",
  portfolio: "Portfolio",
  job: "Việc làm",
  partner: "Đối tác",
  faq: "FAQ",
  testimonial: "Đánh giá",
  user: "Người dùng",
  role: "Vai trò",
  setting: "Cài đặt",
  media: "Media",
  category: "Danh mục",
  tag: "Tag",
  comment: "Bình luận",
  contact: "Liên hệ",
  application: "Đơn ứng tuyển",
  notification: "Thông báo",
  report: "Báo cáo",
  system: "Hệ thống",
};

export default function AuditLog() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [resourceFilter, setResourceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const limit = 20;

  const auditLogQuery = trpc.advancedSecurity.auditLog.list.useQuery({
    action: actionFilter !== "all" ? actionFilter : undefined,
    resourceType: resourceFilter !== "all" ? resourceFilter : undefined,
    status: statusFilter !== "all" ? (statusFilter as any) : undefined,
    search: search || undefined,
    limit,
    offset: page * limit,
  });

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("vi-VN");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge variant="default" className="bg-green-500">Thành công</Badge>;
      case "failed":
        return <Badge variant="destructive">Thất bại</Badge>;
      case "partial":
        return <Badge variant="secondary">Một phần</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      create: "bg-green-100 text-green-800",
      update: "bg-blue-100 text-blue-800",
      delete: "bg-red-100 text-red-800",
      view: "bg-gray-100 text-gray-800",
      login: "bg-purple-100 text-purple-800",
      logout: "bg-orange-100 text-orange-800",
    };
    return (
      <Badge variant="outline" className={colors[action] || ""}>
        {ACTION_LABELS[action] || action}
      </Badge>
    );
  };

  const totalPages = Math.ceil((auditLogQuery.data?.total || 0) / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Nhật Ký Hoạt Động</h1>
          <p className="text-muted-foreground">
            Theo dõi tất cả các thao tác quản trị trong hệ thống
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Xuất dữ liệu
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <ExportMenuItem format="csv" filters={{ action: actionFilter, resourceType: resourceFilter, status: statusFilter, search }} />
              <ExportMenuItem format="json" filters={{ action: actionFilter, resourceType: resourceFilter, status: statusFilter, search }} />
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" onClick={() => auditLogQuery.refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              Tổng hoạt động
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditLogQuery.data?.total || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Loại thao tác" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả thao tác</SelectItem>
                {Object.entries(ACTION_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={resourceFilter} onValueChange={setResourceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Loại tài nguyên" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả tài nguyên</SelectItem>
                {Object.entries(RESOURCE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="success">Thành công</SelectItem>
                <SelectItem value="failed">Thất bại</SelectItem>
                <SelectItem value="partial">Một phần</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử hoạt động</CardTitle>
          <CardDescription>
            Hiển thị {auditLogQuery.data?.logs.length || 0} / {auditLogQuery.data?.total || 0} bản ghi
          </CardDescription>
        </CardHeader>
        <CardContent>
          {auditLogQuery.isLoading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Người dùng</TableHead>
                    <TableHead>Thao tác</TableHead>
                    <TableHead>Tài nguyên</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Chi tiết</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!auditLogQuery.data?.logs.length ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Chưa có hoạt động nào
                      </TableCell>
                    </TableRow>
                  ) : (
                    auditLogQuery.data.logs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(log.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {log.username || `User #${log.userId}`}
                          </div>
                        </TableCell>
                        <TableCell>{getActionBadge(log.action)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {RESOURCE_LABELS[log.resourceType] || log.resourceType}
                          </Badge>
                          {log.resourceId && (
                            <span className="ml-1 text-muted-foreground">#{log.resourceId}</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {log.description || "-"}
                        </TableCell>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedLog(log)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Chi tiết hoạt động</DialogTitle>
                                <DialogDescription>
                                  ID: {log.id} | {formatDate(log.createdAt)}
                                </DialogDescription>
                              </DialogHeader>
                              <ScrollArea className="max-h-[60vh]">
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm font-medium">Người dùng</p>
                                      <p className="text-sm text-muted-foreground">
                                        {log.username || `User #${log.userId}`}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">IP Address</p>
                                      <p className="text-sm text-muted-foreground font-mono">
                                        {log.ipAddress || "-"}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">Thao tác</p>
                                      <p className="text-sm">{getActionBadge(log.action)}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium">Tài nguyên</p>
                                      <p className="text-sm text-muted-foreground">
                                        {RESOURCE_LABELS[log.resourceType] || log.resourceType}
                                        {log.resourceName && ` - ${log.resourceName}`}
                                      </p>
                                    </div>
                                  </div>

                                  {log.description && (
                                    <div>
                                      <p className="text-sm font-medium">Mô tả</p>
                                      <p className="text-sm text-muted-foreground">{log.description}</p>
                                    </div>
                                  )}

                                  {log.changedFields && log.changedFields.length > 0 && (
                                    <div>
                                      <p className="text-sm font-medium">Các trường thay đổi</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {log.changedFields.map((field: string) => (
                                          <Badge key={field} variant="outline">{field}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {log.previousValues && (
                                    <div>
                                      <p className="text-sm font-medium">Giá trị trước</p>
                                      <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                                        {JSON.stringify(log.previousValues, null, 2)}
                                      </pre>
                                    </div>
                                  )}

                                  {log.newValues && (
                                    <div>
                                      <p className="text-sm font-medium">Giá trị mới</p>
                                      <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                                        {JSON.stringify(log.newValues, null, 2)}
                                      </pre>
                                    </div>
                                  )}

                                  {log.errorMessage && (
                                    <div>
                                      <p className="text-sm font-medium text-destructive">Lỗi</p>
                                      <p className="text-sm text-destructive">{log.errorMessage}</p>
                                    </div>
                                  )}

                                  {log.userAgent && (
                                    <div>
                                      <p className="text-sm font-medium">User Agent</p>
                                      <p className="text-xs text-muted-foreground break-all">
                                        {log.userAgent}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </ScrollArea>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
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
                      Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
