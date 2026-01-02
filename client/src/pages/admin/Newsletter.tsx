import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Users, UserCheck, UserX, Trash2, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminNewsletter() {
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "unsubscribed">("all");
  
  const { data: subscribers, refetch } = trpc.newsletter.list.useQuery(
    statusFilter === "all" ? undefined : { status: statusFilter }
  );
  const { data: stats } = trpc.newsletter.stats.useQuery();
  
  const deleteMutation = trpc.newsletter.delete.useMutation({
    onSuccess: () => {
      toast.success("Đã xóa subscriber!");
      refetch();
    },
    onError: (error) => {
      toast.error("Lỗi: " + (error as { message: string }).message);
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("Bạn có chắc muốn xóa subscriber này?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleExport = () => {
    if (!subscribers || subscribers.length === 0) {
      toast.error("Không có dữ liệu để xuất!");
      return;
    }

    const csv = [
      ["Email", "Tên", "Trạng thái", "Nguồn", "Ngày đăng ký"].join(","),
      ...subscribers.map((s) =>
        [
          s.email,
          s.name || "",
          s.status,
          s.source || "",
          s.subscribedAt ? new Date(s.subscribedAt).toLocaleDateString("vi-VN") : "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `newsletter-subscribers-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    
    toast.success("Đã xuất file CSV!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold flex items-center gap-2">
            <Mail className="h-8 w-8" />
            Quản Lý Newsletter
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý danh sách email đăng ký nhận tin
          </p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Xuất CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Đang Hoạt Động</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.active || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Đã Hủy Đăng Ký</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.unsubscribed || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Subscribers Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Danh Sách Subscribers</CardTitle>
              <CardDescription>
                {subscribers?.length || 0} subscribers
              </CardDescription>
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="unsubscribed">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Nguồn</TableHead>
                <TableHead>Ngày đăng ký</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscribers?.map((subscriber) => (
                <TableRow key={subscriber.id}>
                  <TableCell className="font-medium">{subscriber.email}</TableCell>
                  <TableCell>{subscriber.name || "-"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={subscriber.status === "active" ? "default" : "secondary"}
                      className={subscriber.status === "active" ? "bg-green-500" : "bg-red-500"}
                    >
                      {subscriber.status === "active" ? "Hoạt động" : "Đã hủy"}
                    </Badge>
                  </TableCell>
                  <TableCell>{subscriber.source || "-"}</TableCell>
                  <TableCell>
                    {subscriber.subscribedAt
                      ? new Date(subscriber.subscribedAt).toLocaleDateString("vi-VN")
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(subscriber.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!subscribers || subscribers.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Chưa có subscriber nào
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
