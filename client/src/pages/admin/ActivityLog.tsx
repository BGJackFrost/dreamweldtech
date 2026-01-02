import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Filter, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function ActivityLog() {
  const [filters, setFilters] = useState({
    action: "all",
    entityType: "all",
    searchQuery: "",
    dateFrom: "",
    dateTo: "",
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
  });

  // Fetch activity logs from API
  const { data: activityLogs, isLoading, error } = trpc.activityLog.list.useQuery({
    limit: pagination.limit,
    offset: (pagination.page - 1) * pagination.limit,
  });

  // Filter logs based on filters (client-side filtering)
  const filteredLogs = (activityLogs || []).filter((log: any) => {
    if (filters.action !== "all" && log.action !== filters.action) return false;
    if (filters.entityType !== "all" && log.entityType !== filters.entityType) return false;
    if (filters.searchQuery && !log.entityName?.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false;
    return true;
  });

  const getActionBadge = (action: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      create: "default",
      update: "secondary",
      delete: "destructive",
      view: "default",
      export: "secondary",
      import: "secondary",
      login: "default",
      logout: "secondary",
    };
    return variants[action] || "default";
  };

  const getStatusBadge = (status: string) => {
    return status === "success" ? "default" : "destructive";
  };

  const handleExport = () => {
    if (!activityLogs) return;
    const csv = [
      ["Thời gian", "Hành động", "Loại dữ liệu", "Tên dữ liệu", "Trạng thái", "IP Address"],
      ...filteredLogs.map((log) => [
        new Date(log.createdAt).toLocaleString("vi-VN"),
        log.action,
        log.entityType,
        log.entityName || "",
        log.status || "unknown",
        log.ipAddress || "",
      ]),
    ]
      .map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `activity-log-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Activity Log</h1>
        <p className="text-gray-600 mt-2">Xem lịch sử tất cả hành động của admin</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Bộ Lọc
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm..."
                value={filters.searchQuery}
                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                className="pl-10"
              />
            </div>

            {/* Action Filter */}
            <Select value={filters.action} onValueChange={(value) => setFilters({ ...filters, action: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Hành động" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả hành động</SelectItem>
                <SelectItem value="create">Tạo mới</SelectItem>
                <SelectItem value="update">Cập nhật</SelectItem>
                <SelectItem value="delete">Xóa</SelectItem>
                <SelectItem value="view">Xem</SelectItem>
                <SelectItem value="export">Xuất</SelectItem>
                <SelectItem value="import">Nhập</SelectItem>
                <SelectItem value="login">Đăng nhập</SelectItem>
                <SelectItem value="logout">Đăng xuất</SelectItem>
              </SelectContent>
            </Select>

            {/* Entity Type Filter */}
            <Select value={filters.entityType} onValueChange={(value) => setFilters({ ...filters, entityType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Loại dữ liệu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="product">Sản phẩm</SelectItem>
                <SelectItem value="news">Tin tức</SelectItem>
                <SelectItem value="banner">Banner</SelectItem>
                <SelectItem value="user">Người dùng</SelectItem>
                <SelectItem value="settings">Cài đặt</SelectItem>
              </SelectContent>
            </Select>

            {/* Date From */}
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              placeholder="Từ ngày"
            />

            {/* Date To */}
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              placeholder="Đến ngày"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setFilters({ action: "all", entityType: "all", searchQuery: "", dateFrom: "", dateTo: "" })}>
              Xóa bộ lọc
            </Button>
            <Button onClick={handleExport} disabled={isLoading} className="gap-2">
              <Download className="w-4 h-4" />
              Xuất CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử hoạt động</CardTitle>
          <CardDescription>Tổng cộng {filteredLogs.length} hành động</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Đang tải...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <p>Lỗi khi tải dữ liệu: {error.message}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Hành động</TableHead>
                    <TableHead>Loại dữ liệu</TableHead>
                    <TableHead>Tên dữ liệu</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {new Date(log.createdAt).toLocaleString("vi-VN")}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getActionBadge(log.action)}>{log.action}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{log.entityType}</TableCell>
                        <TableCell className="text-sm font-medium">{log.entityName}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadge(log.status || "unknown")}>
                            {log.status === "success" ? "Thành công" : "Thất bại"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{log.ipAddress}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Không có dữ liệu
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {filteredLogs.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Trang {pagination.page} • {filteredLogs.length} kết quả
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination({ ...pagination, page: Math.max(1, pagination.page - 1) })}
                  disabled={pagination.page === 1}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={filteredLogs.length < pagination.limit}
                >
                  Tiếp
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
