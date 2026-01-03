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
import { useAdminTranslation } from "@/hooks/useAdminTranslation";

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

export default function AdminBanners() {
  const { adminT, language } = useAdminTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<BannerFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Get translations with fallbacks
  const t = {
    title: (adminT as any).banners?.title || "Quản Lý Banner/Slider",
    subtitle: (adminT as any).banners?.subtitle || "Quản lý các banner quảng cáo hiển thị trên website",
    addBanner: (adminT as any).banners?.addBanner || "Thêm Banner",
    editBanner: (adminT as any).banners?.editBanner || "Chỉnh Sửa Banner",
    addNewBanner: (adminT as any).banners?.addNewBanner || "Thêm Banner Mới",
    bannerList: (adminT as any).banners?.bannerList || "Danh Sách Banner",
    bannersManaged: (adminT as any).banners?.bannersManaged || "banner đang được quản lý",
    order: (adminT as any).banners?.order || "STT",
    image: (adminT as any).banners?.image || "Hình ảnh",
    bannerTitle: (adminT as any).banners?.bannerTitle || "Tiêu đề",
    position: (adminT as any).banners?.position || "Vị trí",
    status: (adminT as any).banners?.status || "Trạng thái",
    actions: (adminT as any).common?.actions || "Thao tác",
    heroHome: (adminT as any).banners?.heroHome || "Hero (Trang chủ)",
    promo: (adminT as any).banners?.promo || "Khuyến mãi",
    sidebar: (adminT as any).banners?.sidebar || "Sidebar",
    footer: (adminT as any).banners?.footer || "Footer",
    noBanners: (adminT as any).banners?.noBanners || "Chưa có banner nào. Nhấn \"Thêm Banner\" để tạo mới.",
    updateBannerInfo: (adminT as any).banners?.updateBannerInfo || "Cập nhật thông tin banner",
    createNewBanner: (adminT as any).banners?.createNewBanner || "Tạo banner mới để hiển thị trên website",
    bannerTitleLabel: (adminT as any).banners?.bannerTitleLabel || "Tiêu đề",
    displayPosition: (adminT as any).banners?.displayPosition || "Vị trí hiển thị",
    subtitleLabel: (adminT as any).banners?.subtitleLabel || "Phụ đề",
    subtitlePlaceholder: (adminT as any).banners?.subtitlePlaceholder || "Phụ đề hoặc tagline",
    description: (adminT as any).banners?.description || "Mô tả",
    descriptionPlaceholder: (adminT as any).banners?.descriptionPlaceholder || "Mô tả chi tiết...",
    desktopImage: (adminT as any).banners?.desktopImage || "Hình ảnh Desktop",
    mobileImage: (adminT as any).banners?.mobileImage || "Hình ảnh Mobile (tùy chọn)",
    selectImage: (adminT as any).banners?.selectImage || "Chọn hình ảnh",
    imageHint: (adminT as any).banners?.imageHint || "JPG, PNG, WebP (max 5MB)",
    bannerLink: (adminT as any).banners?.bannerLink || "Link khi click banner",
    displayOrder: (adminT as any).banners?.displayOrder || "Thứ tự hiển thị",
    ctaButtonText: (adminT as any).banners?.ctaButtonText || "Text nút CTA",
    ctaButtonLink: (adminT as any).banners?.ctaButtonLink || "Link nút CTA",
    slideEffect: (adminT as any).banners?.slideEffect || "Hiệu ứng chuyển slide",
    fade: (adminT as any).banners?.fade || "Mờ dần (Fade)",
    slide: (adminT as any).banners?.slide || "Trượt (Slide)",
    zoom: (adminT as any).banners?.zoom || "Phóng to (Zoom)",
    showBanner: (adminT as any).banners?.showBanner || "Hiển thị banner",
    cancel: (adminT as any).common?.cancel || "Hủy",
    update: (adminT as any).common?.update || "Cập nhật",
    create: (adminT as any).common?.create || "Tạo mới",
    confirmDelete: (adminT as any).banners?.confirmDelete || "Xác nhận xóa",
    confirmDeleteDesc: (adminT as any).banners?.confirmDeleteDesc || "Bạn có chắc chắn muốn xóa banner này? Hành động này không thể hoàn tác.",
    delete: (adminT as any).common?.delete || "Xóa",
    fillTitleAndImage: (adminT as any).banners?.fillTitleAndImage || "Vui lòng điền tiêu đề và hình ảnh",
    updateSuccess: (adminT as any).banners?.updateSuccess || "Đã cập nhật banner thành công!",
    createSuccess: (adminT as any).banners?.createSuccess || "Đã tạo banner mới thành công!",
    deleteSuccess: (adminT as any).banners?.deleteSuccess || "Đã xóa banner thành công!",
    hiddenBanner: (adminT as any).banners?.hiddenBanner || "Đã ẩn banner",
    shownBanner: (adminT as any).banners?.shownBanner || "Đã hiển thị banner",
    error: (adminT as any).common?.error || "Có lỗi xảy ra. Vui lòng thử lại.",
    deleteError: (adminT as any).banners?.deleteError || "Có lỗi xảy ra khi xóa banner",
  };

  const positionLabels: Record<string, string> = {
    hero: t.heroHome,
    promo: t.promo,
    sidebar: t.sidebar,
    footer: t.footer,
  };

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
      toast.error(t.fillTitleAndImage);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          ...formData,
        });
        toast.success(t.updateSuccess);
      } else {
        await createMutation.mutateAsync(formData);
        toast.success(t.createSuccess);
      }
      setIsDialogOpen(false);
      refetch();
    } catch (error) {
      toast.error(t.error);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success(t.deleteSuccess);
      refetch();
    } catch (error) {
      toast.error(t.deleteError);
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
      toast.success(currentStatus === "true" ? t.hiddenBanner : t.shownBanner);
      refetch();
    } catch (error) {
      toast.error(t.error);
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
              {t.title}
            </h1>
            <p className="text-muted-foreground">{t.subtitle}</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            {t.addBanner}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t.bannerList}</CardTitle>
            <CardDescription>
              {banners?.length || 0} {t.bannersManaged}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">{t.order}</TableHead>
                  <TableHead className="w-[100px]">{t.image}</TableHead>
                  <TableHead>{t.bannerTitle}</TableHead>
                  <TableHead>{t.position}</TableHead>
                  <TableHead>{t.status}</TableHead>
                  <TableHead className="text-right">{t.actions}</TableHead>
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
                      {t.noBanners}
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
                {editingId ? t.editBanner : t.addNewBanner}
              </DialogTitle>
              <DialogDescription>
                {editingId ? t.updateBannerInfo : t.createNewBanner}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">{t.bannerTitleLabel} *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={t.bannerTitleLabel}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">{t.displayPosition}</Label>
                  <Select
                    value={formData.position}
                    onValueChange={(value) => setFormData({ ...formData, position: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hero">{t.heroHome}</SelectItem>
                      <SelectItem value="promo">{t.promo}</SelectItem>
                      <SelectItem value="sidebar">{t.sidebar}</SelectItem>
                      <SelectItem value="footer">{t.footer}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">{t.subtitleLabel}</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder={t.subtitlePlaceholder}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t.description}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t.descriptionPlaceholder}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.desktopImage} *</Label>
                  <FileUpload
                    accept="image/*"
                    onFileSelect={() => {}}
                    onUploadComplete={(url: string) => setFormData({ ...formData, image: url })}
                    label={t.selectImage}
                    hint={t.imageHint}
                  />
                  {formData.image && (
                    <div className="mt-2">
                      <img src={formData.image} alt="Preview" className="w-full h-32 object-cover rounded" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{t.mobileImage}</Label>
                  <FileUpload
                    accept="image/*"
                    onFileSelect={() => {}}
                    onUploadComplete={(url: string) => setFormData({ ...formData, mobileImage: url })}
                    label={t.selectImage}
                    hint={t.imageHint}
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
                  <Label htmlFor="link">{t.bannerLink}</Label>
                  <Input
                    id="link"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sortOrder">{t.displayOrder}</Label>
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
                  <Label htmlFor="buttonText">{t.ctaButtonText}</Label>
                  <Input
                    id="buttonText"
                    value={formData.buttonText}
                    onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                    placeholder="Xem ngay"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buttonLink">{t.ctaButtonLink}</Label>
                  <Input
                    id="buttonLink"
                    value={formData.buttonLink}
                    onChange={(e) => setFormData({ ...formData, buttonLink: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slideEffect">{t.slideEffect}</Label>
                <Select
                  value={formData.slideEffect || "fade"}
                  onValueChange={(value) => setFormData({ ...formData, slideEffect: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fade">{t.fade}</SelectItem>
                    <SelectItem value="slide">{t.slide}</SelectItem>
                    <SelectItem value="zoom">{t.zoom}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive === "true"}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked ? "true" : "false" })}
                />
                <Label htmlFor="isActive">{t.showBanner}</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t.cancel}
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {editingId ? t.update : t.create}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.confirmDelete}</DialogTitle>
              <DialogDescription>{t.confirmDeleteDesc}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                {t.cancel}
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              >
                {t.delete}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
