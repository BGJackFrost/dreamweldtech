import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Bell, Trash2, CheckCircle, AlertCircle, Info, MessageSquare, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface Notification {
  id: number;
  type: "contact" | "quote" | "application" | "newsletter" | "system";
  title: string;
  message: string;
  priority: "low" | "normal" | "high" | "urgent";
  isRead: boolean;
  createdAt: Date;
  link?: string;
}

export default function NotificationCenter() {
  const [filters, setFilters] = useState({
    type: "all",
    priority: "all",
    readStatus: "all",
    searchQuery: "",
  });

  const [selectedNotifications, setSelectedNotifications] = useState<number[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20 });

  // Fetch notifications from API
  const { data: notifications, isLoading, error, refetch } = trpc.notificationCenter.list.useQuery({
    limit: pagination.limit,
    offset: (pagination.page - 1) * pagination.limit,
  });

  // Fetch unread count
  const { data: unreadCount } = trpc.notificationCenter.unreadCount.useQuery();

  // Mark as read mutation
  const markAsReadMutation = trpc.notificationCenter.markAsRead.useMutation({
    onSuccess: () => refetch(),
  });

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      contact: <MessageSquare className="w-4 h-4" />,
      quote: <AlertCircle className="w-4 h-4" />,
      application: <Info className="w-4 h-4" />,
      newsletter: <Bell className="w-4 h-4" />,
      system: <Info className="w-4 h-4" />,
    };
    return icons[type] || <Bell className="w-4 h-4" />;
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      contact: "default",
      quote: "destructive",
      application: "secondary",
      newsletter: "outline",
      system: "secondary",
    };
    return (variants[type] || "default") as "default" | "secondary" | "outline" | "destructive";
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      low: "secondary",
      normal: "default",
      high: "destructive",
      urgent: "destructive",
    };
    return variants[priority] || "default";
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      low: "Thấp",
      normal: "Bình thường",
      high: "Cao",
      urgent: "Khẩn cấp",
    };
    return labels[priority] || priority;
  };

  const handleMarkAsRead = (id: number) => {
    markAsReadMutation.mutate({ id });
  };

  const handleDelete = (id: number) => {
    console.log("Delete:", id);
  };

  const handleDeleteSelected = () => {
    console.log("Delete selected:", selectedNotifications);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && notifications) {
      setSelectedNotifications(notifications.map((n: any) => n.id));
    } else {
      setSelectedNotifications([]);
    }
  };

  // Filter notifications based on filters (client-side)
  const filteredNotifications = (notifications || []).filter((n: any) => {
    if (filters.type !== "all" && n.type !== filters.type) return false;
    if (filters.priority !== "all" && n.priority !== filters.priority) return false;
    if (filters.readStatus === "unread" && n.isRead) return false;
    if (filters.readStatus === "read" && !n.isRead) return false;
    if (filters.searchQuery && !n.title?.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="w-8 h-8" />
            Trung tâm Thông báo
          </h1>
          <p className="text-gray-600 mt-2">Quản lý tất cả thông báo từ hệ thống</p>
        </div>
        {unreadCount && (unreadCount as { count: number })?.count > 0 && (
          <div className="text-right">
            <div className="text-4xl font-bold text-cyan-500">{(unreadCount as { count: number })?.count}</div>
            <p className="text-gray-600">Thông báo chưa đọc</p>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ Lọc</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <Input
              placeholder="Tìm kiếm thông báo..."
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
            />

            {/* Type Filter */}
            <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Loại thông báo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="contact">Liên hệ</SelectItem>
                <SelectItem value="quote">Báo giá</SelectItem>
                <SelectItem value="application">Ứng tuyển</SelectItem>
                <SelectItem value="newsletter">Newsletter</SelectItem>
                <SelectItem value="system">Hệ thống</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select value={filters.priority} onValueChange={(value) => setFilters({ ...filters, priority: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Mức độ ưu tiên" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả mức độ</SelectItem>
                <SelectItem value="low">Thấp</SelectItem>
                <SelectItem value="normal">Bình thường</SelectItem>
                <SelectItem value="high">Cao</SelectItem>
                <SelectItem value="urgent">Khẩn cấp</SelectItem>
              </SelectContent>
            </Select>

            {/* Read Status Filter */}
            <Select value={filters.readStatus} onValueChange={(value) => setFilters({ ...filters, readStatus: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="unread">Chưa đọc</SelectItem>
                <SelectItem value="read">Đã đọc</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setFilters({ type: "all", priority: "all", readStatus: "all", searchQuery: "" })}
            >
              Xóa bộ lọc
            </Button>
            {selectedNotifications.length > 0 && (
              <Button variant="destructive" onClick={handleDeleteSelected} className="gap-2">
                <Trash2 className="w-4 h-4" />
                Xóa {selectedNotifications.length} thông báo
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách thông báo</CardTitle>
          <CardDescription>Tổng cộng {filteredNotifications.length} thông báo</CardDescription>
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
            <div className="space-y-3">
              {/* Select All */}
              <div className="flex items-center gap-2 pb-4 border-b">
                <Checkbox
                  checked={selectedNotifications.length === filteredNotifications.length && filteredNotifications.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-gray-600">Chọn tất cả</span>
              </div>

              {/* Notification Items */}
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification: any) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                      notification.isRead ? "bg-gray-50" : "bg-cyan-50 border-cyan-200"
                    }`}
                  >
                    <Checkbox
                      checked={selectedNotifications.includes(notification.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedNotifications([...selectedNotifications, notification.id]);
                        } else {
                          setSelectedNotifications(selectedNotifications.filter((id) => id !== notification.id));
                        }
                      }}
                    />

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getTypeIcon(notification.type)}
                            <h3 className={`font-semibold ${notification.isRead ? "text-gray-600" : "text-gray-900"}`}>
                              {notification.title}
                            </h3>
                            <Badge variant={getTypeBadge(notification.type)}>{notification.type}</Badge>
                            <Badge variant={getPriorityBadge(notification.priority)}>
                              {getPriorityLabel(notification.priority)}
                            </Badge>
                            {!notification.isRead && <Badge className="bg-cyan-500">Mới</Badge>}
                          </div>
                          <p className="text-sm text-gray-600">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(notification.createdAt).toLocaleString("vi-VN")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {notification.link && (
                        <Button size="sm" variant="outline">
                          Xem chi tiết
                        </Button>
                      )}
                      {!notification.isRead && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMarkAsRead(notification.id)}
                          disabled={markAsReadMutation.isPending}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(notification.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Không có thông báo
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {filteredNotifications.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Trang {pagination.page} • {filteredNotifications.length} kết quả
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
                  disabled={filteredNotifications.length < pagination.limit}
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
