import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Filter } from "lucide-react";

export default function ActivityLog() {
  const [filters, setFilters] = useState({
    action: "all",
    entityType: "all",
    searchQuery: "",
    dateFrom: "",
    dateTo: "",
  });

  // Mock data - Replace with API call
  const activityLogs = [
    {
      id: 1,
      userId: 1,
      action: "create",
      entityType: "product",
      entityName: "Máy Cắt Laser CNC",
      timestamp: new Date("2026-01-02T08:30:00"),
      status: "success",
      ipAddress: "192.168.1.1",
    },
    {
      id: 2,
      userId: 1,
      action: "update",
      entityType: "news",
      entityName: "Tin tức công nghệ mới",
      timestamp: new Date("2026-01-02T07:45:00"),
      status: "success",
      ipAddress: "192.168.1.1",
    },
    {
      id: 3,
      userId: 2,
      action: "delete",
      entityType: "banner",
      entityName: "Banner Khuyến Mãi",
      timestamp: new Date("2026-01-02T06:20:00"),
      status: "failed",
      ipAddress: "192.168.1.2",
    },
  ];

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
    // Export logic
    console.log("Exporting activity logs...");
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
            <Button onClick={handleExport} className="gap-2">
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
          <CardDescription>Tổng cộng {activityLogs.length} hành động</CardDescription>
        </CardHeader>
        <CardContent>
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
                {activityLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">{log.timestamp.toLocaleString("vi-VN")}</TableCell>
                    <TableCell>
                      <Badge variant={getActionBadge(log.action)}>{log.action}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{log.entityType}</TableCell>
                    <TableCell className="text-sm font-medium">{log.entityName}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadge(log.status)}>{log.status === "success" ? "Thành công" : "Thất bại"}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{log.ipAddress}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
