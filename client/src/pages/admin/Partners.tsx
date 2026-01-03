import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ExternalLink, Quote, Building2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAdminTranslation } from "@/hooks/useAdminTranslation";

type PartnerCategory = "manufacturer" | "distributor" | "enterprise" | "government" | "other";

interface FormData {
  name: string;
  slug: string;
  logo: string;
  website: string;
  description: string;
  testimonial: string;
  testimonialAuthor: string;
  testimonialPosition: string;
  category: PartnerCategory;
  isFeatured: "true" | "false";
  isActive: "true" | "false";
  sortOrder: number;
}

const defaultFormData: FormData = {
  name: "",
  slug: "",
  logo: "",
  website: "",
  description: "",
  testimonial: "",
  testimonialAuthor: "",
  testimonialPosition: "",
  category: "enterprise",
  isFeatured: "false",
  isActive: "true",
  sortOrder: 0,
};

export default function PartnersAdmin() {
  const { adminT, language } = useAdminTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);

  // Get translations with fallbacks
  const t = {
    title: (adminT as any).partners?.title || "Quản lý Đối tác",
    subtitle: (adminT as any).partners?.subtitle || "Quản lý thông tin đối tác và khách hàng",
    addPartner: (adminT as any).partners?.addPartner || "Thêm đối tác",
    editPartner: (adminT as any).partners?.editPartner || "Chỉnh sửa đối tác",
    addNewPartner: (adminT as any).partners?.addNewPartner || "Thêm đối tác mới",
    partnerName: (adminT as any).partners?.partnerName || "Tên đối tác",
    slug: (adminT as any).partners?.slug || "Slug",
    logoUrl: (adminT as any).partners?.logoUrl || "Logo URL",
    website: (adminT as any).partners?.website || "Website",
    description: (adminT as any).partners?.description || "Mô tả",
    testimonial: (adminT as any).partners?.testimonial || "Nhận xét (Testimonial)",
    testimonialPlaceholder: (adminT as any).partners?.testimonialPlaceholder || "Nhận xét từ khách hàng về sản phẩm/dịch vụ...",
    testimonialAuthor: (adminT as any).partners?.testimonialAuthor || "Người nhận xét",
    testimonialPosition: (adminT as any).partners?.testimonialPosition || "Chức vụ",
    partnerType: (adminT as any).partners?.partnerType || "Loại đối tác",
    sortOrder: (adminT as any).partners?.sortOrder || "Thứ tự",
    status: (adminT as any).partners?.status || "Trạng thái",
    visible: (adminT as any).partners?.visible || "Hiển thị",
    hidden: (adminT as any).partners?.hidden || "Ẩn",
    featured: (adminT as any).partners?.featured || "Nổi bật",
    manufacturer: (adminT as any).partners?.manufacturer || "Nhà sản xuất",
    distributor: (adminT as any).partners?.distributor || "Nhà phân phối",
    enterprise: (adminT as any).partners?.enterprise || "Doanh nghiệp",
    government: (adminT as any).partners?.government || "Cơ quan nhà nước",
    other: (adminT as any).partners?.other || "Khác",
    noPartners: (adminT as any).partners?.noPartners || "Chưa có đối tác nào",
    addFirstPartner: (adminT as any).partners?.addFirstPartner || "Thêm đối tác đầu tiên",
    cancel: (adminT as any).common?.cancel || "Hủy",
    update: (adminT as any).common?.update || "Cập nhật",
    addNew: (adminT as any).common?.addNew || "Thêm mới",
    createSuccess: (adminT as any).partners?.createSuccess || "Thêm đối tác thành công",
    updateSuccess: (adminT as any).partners?.updateSuccess || "Cập nhật đối tác thành công",
    deleteSuccess: (adminT as any).partners?.deleteSuccess || "Xóa đối tác thành công",
    error: (adminT as any).common?.error || "Có lỗi xảy ra",
    deleteError: (adminT as any).partners?.deleteError || "Không thể xóa đối tác",
    confirmDelete: (adminT as any).partners?.confirmDelete || "Bạn có chắc muốn xóa đối tác này?",
  };

  const categoryLabels: Record<string, string> = {
    manufacturer: t.manufacturer,
    distributor: t.distributor,
    enterprise: t.enterprise,
    government: t.government,
    other: t.other,
  };

  const { data: partners, isLoading, refetch } = trpc.partners.getAll.useQuery();
  const createMutation = trpc.partners.create.useMutation({
    onSuccess: () => {
      toast.success(t.createSuccess);
      setIsDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: () => toast.error(t.error),
  });
  const updateMutation = trpc.partners.update.useMutation({
    onSuccess: () => {
      toast.success(t.updateSuccess);
      setIsDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: () => toast.error(t.error),
  });
  const deleteMutation = trpc.partners.delete.useMutation({
    onSuccess: () => {
      toast.success(t.deleteSuccess);
      refetch();
    },
    onError: () => toast.error(t.deleteError),
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: editingId ? formData.slug : generateSlug(name),
    });
  };

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingId(null);
  };

  const handleEdit = (partner: NonNullable<typeof partners>[number]) => {
    setEditingId(partner.id);
    setFormData({
      name: partner.name,
      slug: partner.slug,
      logo: partner.logo || "",
      website: partner.website || "",
      description: partner.description || "",
      testimonial: partner.testimonial || "",
      testimonialAuthor: partner.testimonialAuthor || "",
      testimonialPosition: partner.testimonialPosition || "",
      category: (partner.category || "enterprise") as PartnerCategory,
      isFeatured: (partner.isFeatured || "false") as "true" | "false",
      isActive: partner.isActive as "true" | "false",
      sortOrder: partner.sortOrder || 0,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t.confirmDelete)) return;
    deleteMutation.mutate({ id });
  };

  const handleToggleActive = async (partner: NonNullable<typeof partners>[number]) => {
    updateMutation.mutate({
      id: partner.id,
      isActive: partner.isActive === "true" ? "false" : "true",
    });
  };

  const handleToggleFeatured = async (partner: NonNullable<typeof partners>[number]) => {
    updateMutation.mutate({
      id: partner.id,
      isFeatured: partner.isFeatured === "true" ? "false" : "true",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.title}</h1>
          <p className="text-muted-foreground">{t.subtitle}</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              {t.addPartner}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? t.editPartner : t.addNewPartner}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.partnerName} *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.slug}</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.logoUrl}</Label>
                  <Input
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.website}</Label>
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t.description}</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>{t.testimonial}</Label>
                <Textarea
                  value={formData.testimonial}
                  onChange={(e) => setFormData({ ...formData, testimonial: e.target.value })}
                  rows={3}
                  placeholder={t.testimonialPlaceholder}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.testimonialAuthor}</Label>
                  <Input
                    value={formData.testimonialAuthor}
                    onChange={(e) => setFormData({ ...formData, testimonialAuthor: e.target.value })}
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.testimonialPosition}</Label>
                  <Input
                    value={formData.testimonialPosition}
                    onChange={(e) => setFormData({ ...formData, testimonialPosition: e.target.value })}
                    placeholder="Giám đốc kỹ thuật"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t.partnerType}</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: PartnerCategory) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manufacturer">{t.manufacturer}</SelectItem>
                      <SelectItem value="distributor">{t.distributor}</SelectItem>
                      <SelectItem value="enterprise">{t.enterprise}</SelectItem>
                      <SelectItem value="government">{t.government}</SelectItem>
                      <SelectItem value="other">{t.other}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t.sortOrder}</Label>
                  <Input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t.status}</Label>
                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.isActive === "true"}
                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked ? "true" : "false" })}
                      />
                      <span className="text-sm">{t.visible}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.isFeatured === "true"}
                        onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked ? "true" : "false" })}
                      />
                      <span className="text-sm">{t.featured}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {t.cancel}
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? t.update : t.addNew}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {!partners || partners.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t.noPartners}</p>
              <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {t.addFirstPartner}
              </Button>
            </CardContent>
          </Card>
        ) : (
          partners.map((partner) => (
            <Card key={partner.id} className={partner.isActive === "false" ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {partner.logo ? (
                    <img
                      src={partner.logo}
                      alt={partner.name}
                      className="w-20 h-20 object-contain rounded-lg border bg-white p-2"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg border bg-muted flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{partner.name}</h3>
                      {partner.isFeatured === "true" && (
                        <Badge variant="default">{t.featured}</Badge>
                      )}
                      <Badge variant={partner.isActive === "true" ? "secondary" : "outline"}>
                        {partner.isActive === "true" ? t.visible : t.hidden}
                      </Badge>
                      <Badge variant="outline">
                        {categoryLabels[partner.category || "other"]}
                      </Badge>
                    </div>
                    {partner.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {partner.description}
                      </p>
                    )}
                    {partner.testimonial && (
                      <div className="bg-muted/50 rounded-lg p-3 mt-2">
                        <Quote className="w-4 h-4 text-primary mb-1" />
                        <p className="text-sm italic line-clamp-2">{partner.testimonial}</p>
                        {partner.testimonialAuthor && (
                          <p className="text-xs text-muted-foreground mt-1">
                            — {partner.testimonialAuthor}
                            {partner.testimonialPosition && `, ${partner.testimonialPosition}`}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {partner.website && (
                      <Button variant="ghost" size="icon" asChild>
                        <a href={partner.website} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleToggleFeatured(partner)}>
                      <span className={partner.isFeatured === "true" ? "text-yellow-500" : "text-muted-foreground"}>★</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(partner)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(partner.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
