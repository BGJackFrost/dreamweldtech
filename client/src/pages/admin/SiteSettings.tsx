import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Save, Menu, Info, Settings, Eye, EyeOff, Loader2 } from "lucide-react";

interface MenuConfig {
  home: boolean;
  about: boolean;
  products: boolean;
  solutions: boolean;
  portfolio: boolean;
  partners: boolean;
  news: boolean;
  careers: boolean;
  contact: boolean;
  faq: boolean;
}

interface AboutPageConfig {
  heroTitle: string;
  heroSubtitle: string;
  companyName: string;
  foundedYear: string;
  mission: string;
  vision: string;
  coreValues: string;
  teamDescription: string;
  historyDescription: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
}

const defaultMenuConfig: MenuConfig = {
  home: true,
  about: true,
  products: true,
  solutions: true,
  portfolio: true,
  partners: true,
  news: true,
  careers: true,
  contact: true,
  faq: true,
};

const defaultAboutConfig: AboutPageConfig = {
  heroTitle: "Về Chúng Tôi",
  heroSubtitle: "Đơn vị tiên phong trong lĩnh vực công nghệ laser công nghiệp tại Việt Nam",
  companyName: "Dreamweldtech",
  foundedYear: "2010",
  mission: "Cung cấp giải pháp công nghệ laser tiên tiến, giúp doanh nghiệp Việt Nam nâng cao năng suất và chất lượng sản xuất.",
  vision: "Trở thành đối tác công nghệ laser hàng đầu Đông Nam Á, đồng hành cùng sự phát triển của ngành công nghiệp Việt Nam.",
  coreValues: "Chất lượng - Đổi mới - Tận tâm - Chuyên nghiệp",
  teamDescription: "Đội ngũ kỹ sư và chuyên gia giàu kinh nghiệm, được đào tạo bài bản từ các đối tác quốc tế.",
  historyDescription: "Hơn 15 năm kinh nghiệm trong lĩnh vực công nghệ laser, phục vụ hàng trăm doanh nghiệp trên khắp Việt Nam.",
  contactEmail: "contact@dreamweldtech.com",
  contactPhone: "+84 123 456 789",
  contactAddress: "123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh",
};

const menuLabels: Record<keyof MenuConfig, string> = {
  home: "Trang chủ",
  about: "Giới thiệu",
  products: "Sản phẩm",
  solutions: "Giải pháp",
  portfolio: "Dự án",
  partners: "Đối tác",
  news: "Tin tức",
  careers: "Tuyển dụng",
  contact: "Liên hệ",
  faq: "FAQ",
};

export default function SiteSettings() {
  const [menuConfig, setMenuConfig] = useState<MenuConfig>(defaultMenuConfig);
  const [aboutConfig, setAboutConfig] = useState<AboutPageConfig>(defaultAboutConfig);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch existing settings
  const { data: menuSettings } = trpc.settings.get.useQuery({ key: "menu_config" });
  const { data: aboutSettings } = trpc.settings.get.useQuery({ key: "about_page_config" });

  const setSetting = trpc.settings.set.useMutation();

  useEffect(() => {
    if (menuSettings) {
      try {
        const parsed = JSON.parse(menuSettings);
        setMenuConfig({ ...defaultMenuConfig, ...parsed });
      } catch (e) {
        console.error("Failed to parse menu config:", e);
      }
    }
  }, [menuSettings]);

  useEffect(() => {
    if (aboutSettings) {
      try {
        const parsed = JSON.parse(aboutSettings);
        setAboutConfig({ ...defaultAboutConfig, ...parsed });
      } catch (e) {
        console.error("Failed to parse about config:", e);
      }
    }
  }, [aboutSettings]);

  const handleMenuToggle = (key: keyof MenuConfig) => {
    setMenuConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAboutChange = (key: keyof AboutPageConfig, value: string) => {
    setAboutConfig(prev => ({ ...prev, [key]: value }));
  };

  const saveMenuConfig = async () => {
    setIsSaving(true);
    try {
      await setSetting.mutateAsync({
        key: "menu_config",
        value: JSON.stringify(menuConfig),
        type: "json",
        description: "Cấu hình hiển thị/ẩn menu trên trang chủ",
      });
      toast.success("Đã lưu cấu hình menu thành công!");
    } catch (error) {
      toast.error("Lỗi khi lưu cấu hình menu");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const saveAboutConfig = async () => {
    setIsSaving(true);
    try {
      await setSetting.mutateAsync({
        key: "about_page_config",
        value: JSON.stringify(aboutConfig),
        type: "json",
        description: "Cấu hình nội dung trang Giới Thiệu",
      });
      toast.success("Đã lưu cấu hình trang Giới Thiệu thành công!");
    } catch (error) {
      toast.error("Lỗi khi lưu cấu hình trang Giới Thiệu");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Settings className="h-6 w-6" />
              Cấu Hình Website
            </h1>
            <p className="text-muted-foreground">
              Quản lý cấu hình hiển thị menu và nội dung các trang
            </p>
          </div>
        </div>

        <Tabs defaultValue="menu" className="space-y-4">
          <TabsList>
            <TabsTrigger value="menu" className="flex items-center gap-2">
              <Menu className="h-4 w-4" />
              Cấu Hình Menu
            </TabsTrigger>
            <TabsTrigger value="about" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Trang Giới Thiệu
            </TabsTrigger>
          </TabsList>

          {/* Menu Configuration Tab */}
          <TabsContent value="menu">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Menu className="h-5 w-5" />
                  Cấu Hình Hiển Thị Menu
                </CardTitle>
                <CardDescription>
                  Bật/tắt các mục menu trên thanh điều hướng trang chủ. Các mục bị tắt sẽ không hiển thị cho người dùng.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(Object.keys(menuConfig) as Array<keyof MenuConfig>).map((key) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {menuConfig[key] ? (
                          <Eye className="h-4 w-4 text-green-500" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                        <Label htmlFor={key} className="cursor-pointer font-medium">
                          {menuLabels[key]}
                        </Label>
                      </div>
                      <Switch
                        id={key}
                        checked={menuConfig[key]}
                        onCheckedChange={() => handleMenuToggle(key)}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={saveMenuConfig} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Lưu Cấu Hình Menu
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* About Page Configuration Tab */}
          <TabsContent value="about">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Cấu Hình Trang Giới Thiệu
                </CardTitle>
                <CardDescription>
                  Chỉnh sửa nội dung hiển thị trên trang Giới Thiệu của website.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Hero Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Phần Hero</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="heroTitle">Tiêu đề chính</Label>
                      <Input
                        id="heroTitle"
                        value={aboutConfig.heroTitle}
                        onChange={(e) => handleAboutChange("heroTitle", e.target.value)}
                        placeholder="Về Chúng Tôi"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="heroSubtitle">Phụ đề</Label>
                      <Input
                        id="heroSubtitle"
                        value={aboutConfig.heroSubtitle}
                        onChange={(e) => handleAboutChange("heroSubtitle", e.target.value)}
                        placeholder="Mô tả ngắn về công ty"
                      />
                    </div>
                  </div>
                </div>

                {/* Company Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Thông Tin Công Ty</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Tên công ty</Label>
                      <Input
                        id="companyName"
                        value={aboutConfig.companyName}
                        onChange={(e) => handleAboutChange("companyName", e.target.value)}
                        placeholder="Dreamweldtech"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="foundedYear">Năm thành lập</Label>
                      <Input
                        id="foundedYear"
                        value={aboutConfig.foundedYear}
                        onChange={(e) => handleAboutChange("foundedYear", e.target.value)}
                        placeholder="2010"
                      />
                    </div>
                  </div>
                </div>

                {/* Mission & Vision */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Sứ Mệnh & Tầm Nhìn</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="mission">Sứ mệnh</Label>
                      <Textarea
                        id="mission"
                        value={aboutConfig.mission}
                        onChange={(e) => handleAboutChange("mission", e.target.value)}
                        placeholder="Sứ mệnh của công ty..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vision">Tầm nhìn</Label>
                      <Textarea
                        id="vision"
                        value={aboutConfig.vision}
                        onChange={(e) => handleAboutChange("vision", e.target.value)}
                        placeholder="Tầm nhìn của công ty..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="coreValues">Giá trị cốt lõi</Label>
                      <Input
                        id="coreValues"
                        value={aboutConfig.coreValues}
                        onChange={(e) => handleAboutChange("coreValues", e.target.value)}
                        placeholder="Chất lượng - Đổi mới - Tận tâm"
                      />
                    </div>
                  </div>
                </div>

                {/* Team & History */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Đội Ngũ & Lịch Sử</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="teamDescription">Mô tả đội ngũ</Label>
                      <Textarea
                        id="teamDescription"
                        value={aboutConfig.teamDescription}
                        onChange={(e) => handleAboutChange("teamDescription", e.target.value)}
                        placeholder="Mô tả về đội ngũ nhân viên..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="historyDescription">Lịch sử phát triển</Label>
                      <Textarea
                        id="historyDescription"
                        value={aboutConfig.historyDescription}
                        onChange={(e) => handleAboutChange("historyDescription", e.target.value)}
                        placeholder="Lịch sử phát triển của công ty..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Thông Tin Liên Hệ</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Email</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={aboutConfig.contactEmail}
                        onChange={(e) => handleAboutChange("contactEmail", e.target.value)}
                        placeholder="contact@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">Số điện thoại</Label>
                      <Input
                        id="contactPhone"
                        value={aboutConfig.contactPhone}
                        onChange={(e) => handleAboutChange("contactPhone", e.target.value)}
                        placeholder="+84 123 456 789"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactAddress">Địa chỉ</Label>
                      <Input
                        id="contactAddress"
                        value={aboutConfig.contactAddress}
                        onChange={(e) => handleAboutChange("contactAddress", e.target.value)}
                        placeholder="123 Đường ABC, TP.HCM"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={saveAboutConfig} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Lưu Cấu Hình Trang Giới Thiệu
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
