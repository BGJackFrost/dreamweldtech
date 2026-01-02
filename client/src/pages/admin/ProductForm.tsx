import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export default function ProductForm() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const isEdit = Boolean(params.id && params.id !== "new");
  
  const { data: categories } = trpc.categories.listAll.useQuery();
  const { data: existingProduct } = trpc.products.getById.useQuery(
    { id: parseInt(params.id || "0") },
    { enabled: !!isEdit }
  );

  const [formData, setFormData] = useState({
    categoryId: 1,
    name: "",
    slug: "",
    shortDescription: "",
    description: "",
    image: "",
    specifications: "",
    features: "",
    applications: "",
    brochureUrl: "",
    videoUrl: "",
    sortOrder: 0,
    isFeatured: "false" as "true" | "false",
    isActive: "true" as "true" | "false",
  });

  useEffect(() => {
    if (existingProduct) {
      setFormData({
        categoryId: existingProduct.categoryId,
        name: existingProduct.name,
        slug: existingProduct.slug,
        shortDescription: existingProduct.shortDescription || "",
        description: existingProduct.description || "",
        image: existingProduct.image || "",
        specifications: existingProduct.specifications || "",
        features: existingProduct.features || "",
        applications: existingProduct.applications || "",
        brochureUrl: existingProduct.brochureUrl || "",
        videoUrl: existingProduct.videoUrl || "",
        sortOrder: existingProduct.sortOrder || 0,
        isFeatured: existingProduct.isFeatured,
        isActive: existingProduct.isActive,
      });
    }
  }, [existingProduct]);

  const createMutation = trpc.products.create.useMutation({
    onSuccess: () => {
      toast.success("Đã tạo sản phẩm thành công!");
      setLocation("/admin/products");
    },
    onError: (error) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  const updateMutation = trpc.products.update.useMutation({
    onSuccess: () => {
      toast.success("Đã cập nhật sản phẩm thành công!");
      setLocation("/admin/products");
    },
    onError: (error) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.slug || !formData.categoryId) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    if (isEdit) {
      updateMutation.mutate({
        id: parseInt(params.id!),
        ...formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary uppercase">
            {isEdit ? "Sửa Sản Phẩm" : "Thêm Sản Phẩm Mới"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEdit ? "Cập nhật thông tin sản phẩm" : "Điền thông tin để tạo sản phẩm mới"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading uppercase">Thông Tin Cơ Bản</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tên Sản Phẩm *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="VD: DW-LW1500 Máy Hàn Laser Cầm Tay"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (URL) *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="dw-lw1500-may-han-laser-cam-tay"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shortDescription">Mô Tả Ngắn</Label>
                  <Textarea
                    id="shortDescription"
                    value={formData.shortDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                    placeholder="Mô tả ngắn gọn về sản phẩm (hiển thị trong danh sách)"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Mô Tả Chi Tiết</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Mô tả chi tiết về sản phẩm"
                    rows={6}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-heading uppercase">Thông Số Kỹ Thuật</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="specifications">Thông Số (JSON)</Label>
                  <Textarea
                    id="specifications"
                    value={formData.specifications}
                    onChange={(e) => setFormData(prev => ({ ...prev, specifications: e.target.value }))}
                    placeholder='{"Công suất": "1500W", "Loại laser": "Fiber Laser"}'
                    rows={6}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">Nhập dưới dạng JSON object</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="features">Tính Năng (JSON Array)</Label>
                  <Textarea
                    id="features"
                    value={formData.features}
                    onChange={(e) => setFormData(prev => ({ ...prev, features: e.target.value }))}
                    placeholder='["Tính năng 1", "Tính năng 2", "Tính năng 3"]'
                    rows={4}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="applications">Ứng Dụng (JSON Array)</Label>
                  <Textarea
                    id="applications"
                    value={formData.applications}
                    onChange={(e) => setFormData(prev => ({ ...prev, applications: e.target.value }))}
                    placeholder='["Ứng dụng 1", "Ứng dụng 2"]'
                    rows={4}
                    className="font-mono text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading uppercase">Phân Loại</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Danh Mục *</Label>
                  <Select
                    value={formData.categoryId.toString()}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Thứ Tự Hiển Thị</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive">Hiển Thị</Label>
                  <Switch
                    id="isActive"
                    checked={formData.isActive === "true"}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked ? "true" : "false" }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="isFeatured">Sản Phẩm Nổi Bật</Label>
                  <Switch
                    id="isFeatured"
                    checked={formData.isFeatured === "true"}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFeatured: checked ? "true" : "false" }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-heading uppercase">Hình Ảnh & Media</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="image">URL Ảnh Đại Diện</Label>
                  <Input
                    id="image"
                    value={formData.image}
                    onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                    placeholder="/images/product.jpg"
                  />
                  {formData.image && (
                    <img src={formData.image} alt="Preview" className="w-full h-32 object-cover rounded mt-2" />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="videoUrl">URL Video</Label>
                  <Input
                    id="videoUrl"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                    placeholder="https://youtube.com/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brochureUrl">URL Brochure/Datasheet</Label>
                  <Input
                    id="brochureUrl"
                    value={formData.brochureUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, brochureUrl: e.target.value }))}
                    placeholder="/files/brochure.pdf"
                  />
                </div>
              </CardContent>
            </Card>

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {isEdit ? "Cập Nhật Sản Phẩm" : "Tạo Sản Phẩm"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
