import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Image as ImageIcon,
  Star,
  Eye,
  EyeOff
} from "lucide-react";

const categories = [
  { value: "welding", label: "Hàn Laser" },
  { value: "cutting", label: "Cắt Laser" },
  { value: "cleaning", label: "Làm Sạch Laser" },
  { value: "automation", label: "Tự Động Hóa" },
];

interface PortfolioForm {
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  category: string;
  client: string;
  location: string;
  completedDate: string;
  images: string;
  videoUrl: string;
  tags: string;
  isFeatured: "true" | "false";
  sortOrder: number;
}

const defaultForm: PortfolioForm = {
  title: "",
  titleEn: "",
  description: "",
  descriptionEn: "",
  category: "",
  client: "",
  location: "",
  completedDate: "",
  images: "",
  videoUrl: "",
  tags: "",
  isFeatured: "false",
  sortOrder: 0,
};

export default function AdminPortfolio() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PortfolioForm>(defaultForm);

  const utils = trpc.useUtils();
  const { data: items = [], isLoading } = trpc.portfolio.listAll.useQuery();

  const createMutation = trpc.portfolio.create.useMutation({
    onSuccess: () => {
      toast.success("Đã thêm dự án mới");
      utils.portfolio.listAll.invalidate();
      setDialogOpen(false);
      setForm(defaultForm);
    },
    onError: (error) => toast.error(error.message),
  });

  const updateMutation = trpc.portfolio.update.useMutation({
    onSuccess: () => {
      toast.success("Đã cập nhật dự án");
      utils.portfolio.listAll.invalidate();
      setDialogOpen(false);
      setForm(defaultForm);
      setEditingId(null);
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = trpc.portfolio.delete.useMutation({
    onSuccess: () => {
      toast.success("Đã xóa dự án");
      utils.portfolio.listAll.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const handleEdit = (item: typeof items[0]) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      titleEn: item.titleEn || "",
      description: item.description || "",
      descriptionEn: item.descriptionEn || "",
      category: item.category || "",
      client: item.client || "",
      location: item.location || "",
      completedDate: item.completedDate || "",
      images: item.images || "",
      videoUrl: item.videoUrl || "",
      tags: item.tags || "",
      isFeatured: item.isFeatured as "true" | "false",
      sortOrder: item.sortOrder || 0,
    });
    setDialogOpen(true);
  };

  const handleToggleActive = (item: typeof items[0]) => {
    updateMutation.mutate({
      id: item.id,
      isActive: item.isActive === "true" ? "false" : "true",
    });
  };

  const handleToggleFeatured = (item: typeof items[0]) => {
    updateMutation.mutate({
      id: item.id,
      isFeatured: item.isFeatured === "true" ? "false" : "true",
    });
  };

  const handleSubmit = () => {
    if (!form.title) {
      toast.error("Vui lòng nhập tiêu đề");
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa dự án này?")) {
      deleteMutation.mutate({ id });
    }
  };

  const getImageCount = (images: string | null): number => {
    if (!images) return 0;
    try {
      return JSON.parse(images).length;
    } catch {
      return images.split(",").length;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Portfolio</h1>
          <p className="text-muted-foreground">Quản lý các dự án tiêu biểu</p>
        </div>
        <Button onClick={() => {
          setEditingId(null);
          setForm(defaultForm);
          setDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm Dự Án
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách dự án ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Chưa có dự án nào</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Ảnh</TableHead>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead className="text-center">Nổi bật</TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.images ? (
                        <div className="relative w-12 h-12 rounded overflow-hidden">
                          <img
                            src={(() => {
                              try {
                                return JSON.parse(item.images)[0];
                              } catch {
                                return item.images.split(",")[0];
                              }
                            })()}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                          {getImageCount(item.images) > 1 && (
                            <span className="absolute bottom-0 right-0 bg-black/70 text-white text-xs px-1">
                              +{getImageCount(item.images) - 1}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-secondary rounded flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>
                      {categories.find(c => c.value === item.category)?.label || item.category || "-"}
                    </TableCell>
                    <TableCell>{item.client || "-"}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleFeatured(item)}
                      >
                        <Star className={`h-4 w-4 ${item.isFeatured === "true" ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleActive(item)}
                      >
                        {item.isActive === "true" ? (
                          <Eye className="h-4 w-4 text-green-500" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Chỉnh sửa dự án" : "Thêm dự án mới"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tiêu đề (VI) *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Tên dự án"
                />
              </div>
              <div className="space-y-2">
                <Label>Tiêu đề (EN)</Label>
                <Input
                  value={form.titleEn}
                  onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                  placeholder="Project name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mô tả (VI)</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Mô tả chi tiết về dự án..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Mô tả (EN)</Label>
              <Textarea
                value={form.descriptionEn}
                onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}
                placeholder="Project description..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Danh mục</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Khách hàng</Label>
                <Input
                  value={form.client}
                  onChange={(e) => setForm({ ...form, client: e.target.value })}
                  placeholder="Tên công ty khách hàng"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Địa điểm</Label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="TP. Hồ Chí Minh"
                />
              </div>
              <div className="space-y-2">
                <Label>Ngày hoàn thành</Label>
                <Input
                  value={form.completedDate}
                  onChange={(e) => setForm({ ...form, completedDate: e.target.value })}
                  placeholder="Tháng 12/2024"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Hình ảnh (URLs, phân cách bằng dấu phẩy)</Label>
              <Textarea
                value={form.images}
                onChange={(e) => setForm({ ...form, images: e.target.value })}
                placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                rows={2}
              />
              <p className="text-xs text-muted-foreground">Nhập các URL hình ảnh, phân cách bằng dấu phẩy</p>
            </div>

            <div className="space-y-2">
              <Label>Video URL</Label>
              <Input
                value={form.videoUrl}
                onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>

            <div className="space-y-2">
              <Label>Tags (phân cách bằng dấu phẩy)</Label>
              <Input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="hàn laser, inox, ô tô"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Thứ tự hiển thị</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  checked={form.isFeatured === "true"}
                  onCheckedChange={(checked) => setForm({ ...form, isFeatured: checked ? "true" : "false" })}
                />
                <Label>Đánh dấu nổi bật</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingId ? "Cập nhật" : "Thêm mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
