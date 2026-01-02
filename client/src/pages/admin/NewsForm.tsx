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

const NEWS_CATEGORIES = [
  "Tin tức công ty",
  "Công nghệ",
  "Hướng dẫn",
  "Sự kiện",
  "Khuyến mãi",
];

export default function NewsForm() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const isEdit = Boolean(params.id && params.id !== "new");
  
  const { data: existingNews } = trpc.news.getBySlug.useQuery(
    { slug: "" },
    { enabled: false }
  );

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    image: "",
    category: "",
    tags: "",
    isPublished: "false" as "true" | "false",
  });

  // Fetch existing news for edit mode
  const utils = trpc.useUtils();
  
  useEffect(() => {
    if (isEdit && params.id) {
      // Fetch news by ID through listAll and filter
      utils.news.listAll.fetch().then((allNews) => {
        const article = allNews?.find(n => n.id === parseInt(params.id!));
        if (article) {
          setFormData({
            title: article.title,
            slug: article.slug,
            excerpt: article.excerpt || "",
            content: article.content || "",
            image: article.image || "",
            category: article.category || "",
            tags: article.tags || "",
            isPublished: article.isPublished,
          });
        }
      });
    }
  }, [isEdit, params.id, utils.news.listAll]);

  const createMutation = trpc.news.create.useMutation({
    onSuccess: () => {
      toast.success("Đã tạo bài viết thành công!");
      setLocation("/admin/news");
    },
    onError: (error) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  const updateMutation = trpc.news.update.useMutation({
    onSuccess: () => {
      toast.success("Đã cập nhật bài viết thành công!");
      setLocation("/admin/news");
    },
    onError: (error) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.slug) {
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
        <Link href="/admin/news">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary uppercase">
            {isEdit ? "Sửa Bài Viết" : "Thêm Bài Viết Mới"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEdit ? "Cập nhật nội dung bài viết" : "Điền thông tin để tạo bài viết mới"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading uppercase">Nội Dung Bài Viết</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Tiêu Đề *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="VD: Xu hướng công nghệ laser năm 2024"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (URL) *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="xu-huong-cong-nghe-laser-nam-2024"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">Tóm Tắt</Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                    placeholder="Tóm tắt ngắn gọn về bài viết (hiển thị trong danh sách)"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Nội Dung Chi Tiết (HTML)</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="<p>Nội dung bài viết...</p>"
                    rows={15}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">Hỗ trợ HTML cơ bản: p, h2, h3, ul, li, strong, em, a, img</p>
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
                  <Label htmlFor="category">Danh Mục</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      {NEWS_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (JSON Array)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder='["tag1", "tag2"]'
                    className="font-mono text-sm"
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <Label htmlFor="isPublished">Xuất Bản</Label>
                  <Switch
                    id="isPublished"
                    checked={formData.isPublished === "true"}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublished: checked ? "true" : "false" }))}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {formData.isPublished === "true" ? "Bài viết sẽ hiển thị công khai" : "Bài viết đang ở chế độ nháp"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-heading uppercase">Hình Ảnh</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="image">URL Ảnh Đại Diện</Label>
                  <Input
                    id="image"
                    value={formData.image}
                    onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                    placeholder="/images/news-thumbnail.jpg"
                  />
                  {formData.image && (
                    <img src={formData.image} alt="Preview" className="w-full h-32 object-cover rounded mt-2" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {isEdit ? "Cập Nhật Bài Viết" : "Tạo Bài Viết"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
