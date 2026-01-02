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

type PartnerCategory = "manufacturer" | "distributor" | "enterprise" | "government" | "other";

const categoryLabels: Record<string, string> = {
  manufacturer: "Nhà sản xuất",
  distributor: "Nhà phân phối",
  enterprise: "Doanh nghiệp",
  government: "Cơ quan nhà nước",
  other: "Khác",
};

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);

  const { data: partners, isLoading, refetch } = trpc.partners.getAll.useQuery();
  const createMutation = trpc.partners.create.useMutation({
    onSuccess: () => {
      toast.success("Thêm đối tác thành công");
      setIsDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: () => toast.error("Có lỗi xảy ra"),
  });
  const updateMutation = trpc.partners.update.useMutation({
    onSuccess: () => {
      toast.success("Cập nhật đối tác thành công");
      setIsDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: () => toast.error("Có lỗi xảy ra"),
  });
  const deleteMutation = trpc.partners.delete.useMutation({
    onSuccess: () => {
      toast.success("Xóa đối tác thành công");
      refetch();
    },
    onError: () => toast.error("Không thể xóa đối tác"),
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
    if (!confirm("Bạn có chắc muốn xóa đối tác này?")) return;
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
          <h1 className="text-2xl font-bold">Quản lý Đối tác</h1>
          <p className="text-muted-foreground">Quản lý thông tin đối tác và khách hàng</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Thêm đối tác
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Chỉnh sửa đối tác" : "Thêm đối tác mới"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tên đối tác *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Logo URL</Label>
                  <Input
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Nhận xét (Testimonial)</Label>
                <Textarea
                  value={formData.testimonial}
                  onChange={(e) => setFormData({ ...formData, testimonial: e.target.value })}
                  rows={3}
                  placeholder="Nhận xét từ khách hàng về sản phẩm/dịch vụ..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Người nhận xét</Label>
                  <Input
                    value={formData.testimonialAuthor}
                    onChange={(e) => setFormData({ ...formData, testimonialAuthor: e.target.value })}
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Chức vụ</Label>
                  <Input
                    value={formData.testimonialPosition}
                    onChange={(e) => setFormData({ ...formData, testimonialPosition: e.target.value })}
                    placeholder="Giám đốc kỹ thuật"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Loại đối tác</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: PartnerCategory) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manufacturer">Nhà sản xuất</SelectItem>
                      <SelectItem value="distributor">Nhà phân phối</SelectItem>
                      <SelectItem value="enterprise">Doanh nghiệp</SelectItem>
                      <SelectItem value="government">Cơ quan nhà nước</SelectItem>
                      <SelectItem value="other">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Thứ tự</Label>
                  <Input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Trạng thái</Label>
                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.isActive === "true"}
                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked ? "true" : "false" })}
                      />
                      <span className="text-sm">Hiển thị</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.isFeatured === "true"}
                        onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked ? "true" : "false" })}
                      />
                      <span className="text-sm">Nổi bật</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? "Cập nhật" : "Thêm mới"}
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
              <p className="text-muted-foreground">Chưa có đối tác nào</p>
              <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Thêm đối tác đầu tiên
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
                        <Badge variant="default">Nổi bật</Badge>
                      )}
                      <Badge variant={partner.isActive === "true" ? "secondary" : "outline"}>
                        {partner.isActive === "true" ? "Hiển thị" : "Ẩn"}
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
