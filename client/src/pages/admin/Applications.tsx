import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Trash2,
  Mail,
  Phone,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/usePermissions";

type ApplicationStatus = "pending" | "reviewing" | "interviewed" | "accepted" | "rejected";

export default function AdminApplications() {
  const { hasPermission } = usePermissions();
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: applications, refetch } = trpc.jobApplications.list.useQuery(
    filterStatus !== "all" ? { status: filterStatus as ApplicationStatus } : {}
  );
  const { data: jobs } = trpc.jobs.listAll.useQuery();
  const { data: stats } = trpc.jobApplications.stats.useQuery();
  const updateStatus = trpc.jobApplications.updateStatus.useMutation();
  const deleteApplication = trpc.jobApplications.delete.useMutation();

  const getJobTitle = (jobId: number) => {
    return jobs?.find(j => j.id === jobId)?.title || "N/A";
  };

  const handleStatusChange = async (id: number, status: ApplicationStatus, notes?: string) => {
    try {
      await updateStatus.mutateAsync({ id, status, notes });
      toast.success("Đã cập nhật trạng thái");
      refetch();
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xóa đơn ứng tuyển này?")) return;
    try {
      await deleteApplication.mutateAsync({ id });
      toast.success("Đã xóa đơn ứng tuyển");
      refetch();
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "Chờ xử lý" },
      reviewing: { variant: "outline", label: "Đang xem xét" },
      interviewed: { variant: "default", label: "Đã phỏng vấn" },
      accepted: { variant: "default", label: "Đã nhận" },
      rejected: { variant: "destructive", label: "Từ chối" },
    };
    const config = variants[status] || { variant: "secondary" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Đơn Ứng Tuyển</h1>
        <p className="text-muted-foreground">
          Quản lý và xử lý các đơn ứng tuyển
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats?.total || 0}</p>
            <p className="text-xs text-muted-foreground">Tổng đơn</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</p>
            <p className="text-xs text-muted-foreground">Chờ xử lý</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats?.reviewing || 0}</p>
            <p className="text-xs text-muted-foreground">Đang xem xét</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats?.interviewed || 0}</p>
            <p className="text-xs text-muted-foreground">Đã phỏng vấn</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats?.accepted || 0}</p>
            <p className="text-xs text-muted-foreground">Đã nhận</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{stats?.rejected || 0}</p>
            <p className="text-xs text-muted-foreground">Từ chối</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Lọc theo trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="pending">Chờ xử lý</SelectItem>
            <SelectItem value="reviewing">Đang xem xét</SelectItem>
            <SelectItem value="interviewed">Đã phỏng vấn</SelectItem>
            <SelectItem value="accepted">Đã nhận</SelectItem>
            <SelectItem value="rejected">Từ chối</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách đơn ứng tuyển</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ứng viên</TableHead>
                <TableHead>Vị trí</TableHead>
                <TableHead>Liên hệ</TableHead>
                <TableHead>Ngày gửi</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications?.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">{app.name}</TableCell>
                  <TableCell>{getJobTitle(app.jobId)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3" />
                        {app.email}
                      </div>
                      {app.phone && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {app.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(app.createdAt)}</TableCell>
                  <TableCell>{getStatusBadge(app.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedApplication(app);
                          setIsDetailOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {hasPermission("applications.delete") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(app.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!applications || applications.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Chưa có đơn ứng tuyển nào
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn ứng tuyển</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Họ và tên</Label>
                  <p className="font-medium">{selectedApplication.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Vị trí ứng tuyển</Label>
                  <p className="font-medium">{getJobTitle(selectedApplication.jobId)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedApplication.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Số điện thoại</Label>
                  <p className="font-medium">{selectedApplication.phone || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Ngày gửi</Label>
                  <p className="font-medium">{formatDate(selectedApplication.createdAt)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Trạng thái</Label>
                  <div className="mt-1">{getStatusBadge(selectedApplication.status)}</div>
                </div>
              </div>

              {selectedApplication.coverLetter && (
                <div>
                  <Label className="text-muted-foreground">Thư xin việc</Label>
                  <div className="mt-2 p-4 bg-secondary/50 rounded-lg whitespace-pre-line">
                    {selectedApplication.coverLetter}
                  </div>
                </div>
              )}

              <div>
                <Label className="text-muted-foreground">Cập nhật trạng thái</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(selectedApplication.id, "reviewing")}
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Đang xem xét
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(selectedApplication.id, "interviewed")}
                  >
                    <Users className="h-4 w-4 mr-1" />
                    Đã phỏng vấn
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleStatusChange(selectedApplication.id, "accepted")}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Nhận
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleStatusChange(selectedApplication.id, "rejected")}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Từ chối
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
