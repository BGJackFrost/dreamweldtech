import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Eye, CheckCircle, Mail, Phone, Building } from "lucide-react";
import { toast } from "sonner";
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
  Dialog,
  DialogContent,
  DialogDescription,
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
import { usePermissions } from "@/hooks/usePermissions";

export default function AdminContacts() {
  const { hasPermission } = usePermissions();
  const utils = trpc.useUtils();
  const { data: contacts, isLoading } = trpc.contacts.list.useQuery({});
  
  const deleteMutation = trpc.contacts.delete.useMutation({
    onSuccess: () => {
      toast.success("Đã xóa yêu cầu thành công!");
      utils.contacts.list.invalidate();
    },
    onError: (error) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  const updateStatusMutation = trpc.contacts.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Đã cập nhật trạng thái!");
      utils.contacts.list.invalidate();
    },
    onError: (error) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("vi-VN");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      new: { variant: "destructive", label: "Mới" },
      read: { variant: "secondary", label: "Đã đọc" },
      replied: { variant: "default", label: "Đã trả lời" },
      closed: { variant: "outline", label: "Đã đóng" },
    };
    const config = variants[status] || variants.new;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      contact: "Liên hệ",
      quote: "Báo giá",
      support: "Hỗ trợ",
    };
    return <Badge variant="outline">{labels[type] || type}</Badge>;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-primary uppercase">Quản Lý Yêu Cầu Liên Hệ</h1>
        <p className="text-muted-foreground mt-1">Xem và xử lý các yêu cầu từ khách hàng</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading uppercase">Danh Sách Yêu Cầu ({contacts?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {contacts && contacts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Khách Hàng</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Chủ Đề</TableHead>
                  <TableHead>Trạng Thái</TableHead>
                  <TableHead>Ngày Gửi</TableHead>
                  <TableHead className="text-right">Thao Tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id} className={contact.status === "new" ? "bg-orange-50" : ""}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">{contact.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(contact.requestType)}</TableCell>
                    <TableCell className="max-w-xs truncate">{contact.subject || "-"}</TableCell>
                    <TableCell>
                      <Select
                        value={contact.status}
                        onValueChange={(value) => updateStatusMutation.mutate({ 
                          id: contact.id, 
                          status: value as "new" | "read" | "replied" | "closed" 
                        })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">Mới</SelectItem>
                          <SelectItem value="read">Đã đọc</SelectItem>
                          <SelectItem value="replied">Đã trả lời</SelectItem>
                          <SelectItem value="closed">Đã đóng</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{formatDate(contact.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" title="Xem chi tiết">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle className="font-heading uppercase">Chi Tiết Yêu Cầu</DialogTitle>
                              <DialogDescription>
                                {getTypeBadge(contact.requestType)} - {formatDate(contact.createdAt)}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">Email</p>
                                    <p className="font-medium">{contact.email}</p>
                                  </div>
                                </div>
                                {contact.phone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">Điện thoại</p>
                                      <p className="font-medium">{contact.phone}</p>
                                    </div>
                                  </div>
                                )}
                                {contact.company && (
                                  <div className="flex items-center gap-2 col-span-2">
                                    <Building className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">Công ty</p>
                                      <p className="font-medium">{contact.company}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {contact.subject && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Chủ đề</p>
                                  <p className="font-medium">{contact.subject}</p>
                                </div>
                              )}
                              
                              {contact.message && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Nội dung</p>
                                  <div className="bg-secondary p-4 rounded">
                                    <p className="whitespace-pre-wrap">{contact.message}</p>
                                  </div>
                                </div>
                              )}

                              <div className="flex gap-2 pt-4">
                                <Button 
                                  className="flex-1"
                                  onClick={() => window.open(`mailto:${contact.email}?subject=Re: ${contact.subject || "Yêu cầu từ Dreamweldtech"}`)}
                                >
                                  <Mail className="h-4 w-4 mr-2" />
                                  Gửi Email
                                </Button>
                                {contact.phone && (
                                  <Button 
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => window.open(`tel:${contact.phone}`)}
                                  >
                                    <Phone className="h-4 w-4 mr-2" />
                                    Gọi Điện
                                  </Button>
                                )}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        {hasPermission("contacts.delete") && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive" title="Xóa">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bạn có chắc chắn muốn xóa yêu cầu từ "{contact.name}"? Hành động này không thể hoàn tác.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate({ id: contact.id })}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Xóa
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>Chưa có yêu cầu liên hệ nào.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
