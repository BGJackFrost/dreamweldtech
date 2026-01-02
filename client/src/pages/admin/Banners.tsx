import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Image, Eye, EyeOff, Loader2, GripVertical, ExternalLink } from "lucide-react";
import { FileUpload } from "@/components/FileUpload";

interface BannerFormData {
  title: string;
  subtitle: string;
  description: string;
  image: string;
  mobileImage: string;
  link: string;
  buttonText: string;
  buttonLink: string;
  position: "hero" | "promo" | "sidebar" | "footer";
  sortOrder: number;
  isActive: "true" | "false";
  slideEffect?: "fade" | "slide" | "zoom";
}

const defaultFormData: BannerFormData = {
  title: "",
  subtitle: "",
  description: "",
  image: "",
  mobileImage: "",
  link: "",
  buttonText: "",
  buttonLink: "",
  position: "hero",
  sortOrder: 0,
  isActive: "true",
  slideEffect: "fade",
};

const positionLabels: Record<string, string> = {
  hero: "Hero (Trang chủ)",
  promo: "Khuyến mãi",
  sidebar: "Sidebar",
  footer: "Footer",
};

export default function AdminBanners() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<BannerFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const { data: banners, refetch } = trpc.banners.listAll.useQuery();
  const createMutation = trpc.banners.create.useMutation();
  const updateMutation = trpc.banners.update.useMutation();
  const deleteMutation = trpc.banners.delete.useMutation();
  const toggleActiveMutation = trpc.banners.toggleActive.useMutation();

  const handleOpenDialog = (banner?: typeof banners extends (infer T)[] | undefined ? T : never) => {
    if (banner) {
      setEditingId(banner.id);
      setFormData({
        title: banner.title,
        subtitle: banner.subtitle || "",
        description: banner.description || "",
        image: banner.image,
        mobileImage: banner.mobileImage || "",
        link: banner.link || "",
        buttonText: banner.buttonText || "",
        buttonLink: banner.buttonLink || "",
        position: banner.position as "hero" | "promo" | "sidebar" | "footer",
        sortOrder: banner.sortOrder || 0,
        isActive: banner.isActive as "true" | "false",
        slideEffect: (banner.slideEffect || "fade") as "fade" | "slide" | "zoom",
      });
    } else {
      setEditingId(null);
      setFormData(defaultFormData);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.image) {
      toast.error("Vui lòng điền tiêu đề và hình ảnh");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          ...formData,
        });
        toast.success("Đã cập nhật banner thành công!");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("Đã tạo banner mới thành công!");
      }
      setIsDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Đã xóa banner thành công!");
      refetch();
    } catch (error) {
      toast.error("Có lỗi xảy ra khi xóa banner");
      console.error(error);
    }
    setDeleteConfirmId(null);
  };

  const handleToggleActive = async (id: number, currentStatus: string) => {
    try {
      await toggleActiveMutation.mutateAsync({
        id,
        isActive: currentStatus === "true" ? "false" : "true",
      });
      toast.success(currentStatus === "true" ? "Đã ẩn banner" : "Đã hiển thị banner");
      refetch();
    } catch (error) {
      toast.error("Có lỗi xảy ra");
      console.error(error);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Image className="h-6 w-6" />
              Quản Lý Banner/Slider
            </h1>
            <p className="text-muted-foreground">
              Quản lý các banner quảng cáo hiển thị trên website
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm Banner
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Danh Sách Banner</CardTitle>
            <CardDescription>
              {banners?.length || 0} banner đang được quản lý
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">STT</TableHead>
                  <TableHead className="w-[100px]">Hình ảnh</TableHead>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Vị trí</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banners?.map((banner, index) => (
                  <TableRow key={banner.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        {banner.sortOrder || index + 1}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="relative w-20 h-12 rounded overflow-hidden bg-muted">
                        {banner.image ? (
                          <img
                            src={banner.image}
                            alt={banner.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Image className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{banner.title}</p>
                        {banner.subtitle && (
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {banner.subtitle}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {positionLabels[banner.position] || banner.position}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={banner.isActive === "true"}
                          onCheckedChange={() => handleToggleActive(banner.id, banner.isActive)}
                        />
                        {banner.isActive === "true" ? (
                          <Eye className="h-4 w-4 text-green-500" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {banner.link && (
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <a href={banner.link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(banner)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => setDeleteConfirmId(banner.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!banners || banners.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Chưa có banner nào. Nhấn "Thêm Banner" để tạo mới.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Chỉnh Sửa Banner" : "Thêm Banner Mới"}
              </DialogTitle>
              <DialogDescription>
                {editingId
                  ? "Cập nhật thông tin banner"
                  : "Tạo banner mới để hiển thị trên website"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Tiêu đề *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Tiêu đề banner"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Vị trí hiển thị</Label>
                  <Select
                    value={formData.position}
                    onValueChange={(value) => setFormData({ ...formData, position: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hero">Hero (Trang chủ)</SelectItem>
                      <SelectItem value="promo">Khuyến mãi</SelectItem>
                      <SelectItem value="sidebar">Sidebar</SelectItem>
                      <SelectItem value="footer">Footer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">Phụ đề</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Phụ đề hoặc tagline"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả chi tiết..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hình ảnh Desktop *</Label>
                  <FileUpload
                    accept="image/*"
                    onFileSelect={() => {}}
                    onUploadComplete={(url: string) => setFormData({ ...formData, image: url })}
                    label="Chọn hình ảnh"
                    hint="JPG, PNG, WebP (max 5MB)"
                  />
                  {formData.image && (
                    <div className="mt-2">
                      <img src={formData.image} alt="Preview" className="w-full h-32 object-cover rounded" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Hình ảnh Mobile (tùy chọn)</Label>
                  <FileUpload
                    accept="image/*"
                    onFileSelect={() => {}}
                    onUploadComplete={(url: string) => setFormData({ ...formData, mobileImage: url })}
                    label="Chọn hình ảnh"
                    hint="JPG, PNG, WebP (max 5MB)"
                  />
                  {formData.mobileImage && (
                    <div className="mt-2">
                      <img src={formData.mobileImage} alt="Preview" className="w-full h-32 object-cover rounded" />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="link">Link khi click banner</Label>
                  <Input
                    id="link"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Thứ tự hiển thị</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="buttonText">Text nút CTA</Label>
                  <Input
                    id="buttonText"
                    value={formData.buttonText}
                    onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                    placeholder="Xem ngay"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buttonLink">Link nút CTA</Label>
                  <Input
                    id="buttonLink"
                    value={formData.buttonLink}
                    onChange={(e) => setFormData({ ...formData, buttonLink: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slideEffect">Hiệu ứng chuyển slide</Label>
                <Select
                  value={formData.slideEffect || "fade"}
                  onValueChange={(value) => setFormData({ ...formData, slideEffect: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fade">Mờ dần (Fade)</SelectItem>
                    <SelectItem value="slide">Trượt (Slide)</SelectItem>
                    <SelectItem value="zoom">Phóng to (Zoom)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive === "true"}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked ? "true" : "false" })}
                />
                <Label htmlFor="isActive">Hiển thị banner</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {editingId ? "Cập nhật" : "Tạo mới"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xác nhận xóa</DialogTitle>
              <DialogDescription>
                Bạn có chắc chắn muốn xóa banner này? Hành động này không thể hoàn tác.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              >
                Xóa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
