import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Plus, Trash2, Home, Image, Type, Link as LinkIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface SectionData {
  sectionKey: string;
  title?: string;
  titleEn?: string;
  subtitle?: string;
  subtitleEn?: string;
  content?: string;
  contentEn?: string;
  image?: string;
  backgroundImage?: string;
  buttonText?: string;
  buttonTextEn?: string;
  buttonLink?: string;
  sortOrder?: number;
  isActive?: "true" | "false";
}

const defaultSections = [
  { key: "hero", label: "Hero Banner", description: "Phần banner chính trên trang chủ" },
  { key: "about", label: "Giới Thiệu", description: "Phần giới thiệu ngắn về công ty" },
  { key: "products", label: "Sản Phẩm Nổi Bật", description: "Phần hiển thị sản phẩm nổi bật" },
  { key: "solutions", label: "Giải Pháp Ngành", description: "Phần giới thiệu các giải pháp theo ngành" },
  { key: "stats", label: "Thống Kê", description: "Phần hiển thị các con số thống kê" },
  { key: "cta", label: "Call to Action", description: "Phần kêu gọi hành động" },
];

export default function AdminHomePage() {
  const { data: sections, refetch } = trpc.homePage.listAll.useQuery();
  const upsertMutation = trpc.homePage.upsert.useMutation({
    onSuccess: () => {
      toast.success("Đã lưu thành công!");
      refetch();
    },
    onError: (error) => {
      toast.error("Lỗi: " + (error as { message: string }).message);
    },
  });

  const [activeTab, setActiveTab] = useState("hero");
  const [formData, setFormData] = useState<Record<string, SectionData>>({});

  useEffect(() => {
    if (sections) {
      const data: Record<string, SectionData> = {};
      sections.forEach((s: typeof sections[0]) => {
        data[s.sectionKey] = {
          sectionKey: s.sectionKey,
          title: s.title || "",
          titleEn: s.titleEn || "",
          subtitle: s.subtitle || "",
          subtitleEn: s.subtitleEn || "",
          content: s.content || "",
          contentEn: s.contentEn || "",
          image: s.image || "",
          backgroundImage: s.backgroundImage || "",
          buttonText: s.buttonText || "",
          buttonTextEn: s.buttonTextEn || "",
          buttonLink: s.buttonLink || "",
          sortOrder: s.sortOrder || 0,
          isActive: s.isActive,
        };
      });
      setFormData(data);
    }
  }, [sections]);

  const handleChange = (key: string, field: keyof SectionData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        sectionKey: key,
        [field]: value,
      },
    }));
  };

  const handleSave = (key: string) => {
    const data = formData[key] || { sectionKey: key };
    upsertMutation.mutate(data);
  };

  const handleToggleActive = (key: string) => {
    const current = formData[key]?.isActive || "true";
    const newValue = current === "true" ? "false" : "true";
    handleChange(key, "isActive", newValue);
    upsertMutation.mutate({
      ...formData[key],
      sectionKey: key,
      isActive: newValue,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold flex items-center gap-2">
            <Home className="h-8 w-8" />
            Quản Lý Trang Chủ
          </h1>
          <p className="text-muted-foreground mt-1">
            Chỉnh sửa nội dung các phần trên trang chủ
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 lg:grid-cols-6 w-full">
          {defaultSections.map((section) => (
            <TabsTrigger key={section.key} value={section.key}>
              {section.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {defaultSections.map((section) => (
          <TabsContent key={section.key} value={section.key}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{section.label}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`active-${section.key}`}>Hiển thị</Label>
                      <Switch
                        id={`active-${section.key}`}
                        checked={formData[section.key]?.isActive !== "false"}
                        onCheckedChange={() => handleToggleActive(section.key)}
                      />
                    </div>
                    <Button onClick={() => handleSave(section.key)} disabled={upsertMutation.isPending}>
                      <Save className="h-4 w-4 mr-2" />
                      Lưu
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Vietnamese Content */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Nội dung Tiếng Việt</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`title-${section.key}`}>
                        <Type className="h-4 w-4 inline mr-1" />
                        Tiêu đề
                      </Label>
                      <Input
                        id={`title-${section.key}`}
                        value={formData[section.key]?.title || ""}
                        onChange={(e) => handleChange(section.key, "title", e.target.value)}
                        placeholder="Nhập tiêu đề..."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`subtitle-${section.key}`}>Phụ đề</Label>
                      <Input
                        id={`subtitle-${section.key}`}
                        value={formData[section.key]?.subtitle || ""}
                        onChange={(e) => handleChange(section.key, "subtitle", e.target.value)}
                        placeholder="Nhập phụ đề..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`content-${section.key}`}>Nội dung chi tiết</Label>
                    <Textarea
                      id={`content-${section.key}`}
                      value={formData[section.key]?.content || ""}
                      onChange={(e) => handleChange(section.key, "content", e.target.value)}
                      placeholder="Nhập nội dung..."
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`buttonText-${section.key}`}>Text nút bấm</Label>
                      <Input
                        id={`buttonText-${section.key}`}
                        value={formData[section.key]?.buttonText || ""}
                        onChange={(e) => handleChange(section.key, "buttonText", e.target.value)}
                        placeholder="VD: Xem thêm"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`buttonLink-${section.key}`}>
                        <LinkIcon className="h-4 w-4 inline mr-1" />
                        Link nút bấm
                      </Label>
                      <Input
                        id={`buttonLink-${section.key}`}
                        value={formData[section.key]?.buttonLink || ""}
                        onChange={(e) => handleChange(section.key, "buttonLink", e.target.value)}
                        placeholder="VD: /products"
                      />
                    </div>
                  </div>
                </div>

                {/* English Content */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">English Content</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`titleEn-${section.key}`}>Title</Label>
                      <Input
                        id={`titleEn-${section.key}`}
                        value={formData[section.key]?.titleEn || ""}
                        onChange={(e) => handleChange(section.key, "titleEn", e.target.value)}
                        placeholder="Enter title..."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`subtitleEn-${section.key}`}>Subtitle</Label>
                      <Input
                        id={`subtitleEn-${section.key}`}
                        value={formData[section.key]?.subtitleEn || ""}
                        onChange={(e) => handleChange(section.key, "subtitleEn", e.target.value)}
                        placeholder="Enter subtitle..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`contentEn-${section.key}`}>Content</Label>
                    <Textarea
                      id={`contentEn-${section.key}`}
                      value={formData[section.key]?.contentEn || ""}
                      onChange={(e) => handleChange(section.key, "contentEn", e.target.value)}
                      placeholder="Enter content..."
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`buttonTextEn-${section.key}`}>Button Text</Label>
                    <Input
                      id={`buttonTextEn-${section.key}`}
                      value={formData[section.key]?.buttonTextEn || ""}
                      onChange={(e) => handleChange(section.key, "buttonTextEn", e.target.value)}
                      placeholder="E.g.: Learn more"
                    />
                  </div>
                </div>

                {/* Images */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Hình ảnh</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`image-${section.key}`}>
                        <Image className="h-4 w-4 inline mr-1" />
                        Hình ảnh chính
                      </Label>
                      <Input
                        id={`image-${section.key}`}
                        value={formData[section.key]?.image || ""}
                        onChange={(e) => handleChange(section.key, "image", e.target.value)}
                        placeholder="URL hình ảnh..."
                      />
                      {formData[section.key]?.image && (
                        <img 
                          src={formData[section.key]?.image} 
                          alt="Preview" 
                          className="w-32 h-20 object-cover rounded border"
                        />
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`backgroundImage-${section.key}`}>Hình nền</Label>
                      <Input
                        id={`backgroundImage-${section.key}`}
                        value={formData[section.key]?.backgroundImage || ""}
                        onChange={(e) => handleChange(section.key, "backgroundImage", e.target.value)}
                        placeholder="URL hình nền..."
                      />
                      {formData[section.key]?.backgroundImage && (
                        <img 
                          src={formData[section.key]?.backgroundImage} 
                          alt="Background Preview" 
                          className="w-32 h-20 object-cover rounded border"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Sort Order */}
                <div className="space-y-2">
                  <Label htmlFor={`sortOrder-${section.key}`}>Thứ tự hiển thị</Label>
                  <Input
                    id={`sortOrder-${section.key}`}
                    type="number"
                    value={formData[section.key]?.sortOrder || 0}
                    onChange={(e) => handleChange(section.key, "sortOrder", parseInt(e.target.value) || 0)}
                    className="w-32"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
