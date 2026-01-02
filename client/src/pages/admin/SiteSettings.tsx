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
import { Save, Menu, Info, Settings, Eye, EyeOff, Loader2, Home, LayoutGrid, Facebook, Twitter, Linkedin, Youtube, Instagram } from "lucide-react";

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

interface HomePageConfig {
  heroTagline: string;
  heroTitle: string;
  heroTitleHighlight: string;
  heroDescription: string;
  heroButtonPrimary: string;
  heroButtonSecondary: string;
  statsYears: string;
  statsProjects: string;
  statsPartners: string;
  statsSatisfaction: string;
  whyChooseTitle: string;
  whyChooseDescription: string;
  productsTitle: string;
  productsDescription: string;
  ctaTitle: string;
  ctaDescription: string;
  ctaButton: string;
}

interface FooterConfig {
  companyName: string;
  companyDescription: string;
  address: string;
  phone: string;
  email: string;
  workingHours: string;
  facebookUrl: string;
  linkedinUrl: string;
  youtubeUrl: string;
  twitterUrl: string;
  instagramUrl: string;
  zaloUrl: string;
  copyright: string;
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

const defaultHomeConfig: HomePageConfig = {
  heroTagline: "CÔNG NGHỆ LASER TIÊN TIẾN",
  heroTitle: "ĐỈNH CAO",
  heroTitleHighlight: "CÔNG NGHỆ GIA CÔNG CHÍNH XÁC",
  heroDescription: "Dreamweldtech cung cấp giải pháp toàn diện về máy hàn, cắt và làm sạch laser cho nền công nghiệp hiện đại. Hiệu suất vượt trội, độ bền tối đa.",
  heroButtonPrimary: "KHÁM PHÁ SẢN PHẨM",
  heroButtonSecondary: "LIÊN HỆ TƯ VẤN",
  statsYears: "15+",
  statsProjects: "500+",
  statsPartners: "100+",
  statsSatisfaction: "98%",
  whyChooseTitle: "Tại Sao Chọn Dreamweldtech?",
  whyChooseDescription: "Chúng tôi cam kết mang đến giải pháp công nghệ laser tốt nhất cho doanh nghiệp của bạn",
  productsTitle: "Sản Phẩm Nổi Bật",
  productsDescription: "Khám phá các dòng máy laser công nghiệp hàng đầu của chúng tôi",
  ctaTitle: "Sẵn Sàng Nâng Cấp Công Nghệ?",
  ctaDescription: "Liên hệ ngay để được tư vấn giải pháp phù hợp nhất cho doanh nghiệp của bạn",
  ctaButton: "Nhận Tư Vấn Miễn Phí",
};

const defaultFooterConfig: FooterConfig = {
  companyName: "Dreamweldtech",
  companyDescription: "Đơn vị tiên phong trong lĩnh vực công nghệ laser công nghiệp tại Việt Nam. Chúng tôi cung cấp giải pháp toàn diện về máy hàn, cắt và làm sạch laser.",
  address: "123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh, Việt Nam",
  phone: "+84 123 456 789",
  email: "contact@dreamweldtech.com",
  workingHours: "Thứ 2 - Thứ 6: 8:00 - 17:30",
  facebookUrl: "https://facebook.com/dreamweldtech",
  linkedinUrl: "https://linkedin.com/company/dreamweldtech",
  youtubeUrl: "https://youtube.com/@dreamweldtech",
  twitterUrl: "",
  instagramUrl: "",
  zaloUrl: "",
  copyright: "© 2024 Dreamweldtech. All rights reserved.",
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
  const [homeConfig, setHomeConfig] = useState<HomePageConfig>(defaultHomeConfig);
  const [footerConfig, setFooterConfig] = useState<FooterConfig>(defaultFooterConfig);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch existing settings
  const { data: menuSettings } = trpc.settings.get.useQuery({ key: "menu_config" });
  const { data: aboutSettings } = trpc.settings.get.useQuery({ key: "about_page_config" });
  const { data: homeSettings } = trpc.settings.get.useQuery({ key: "home_page_config" });
  const { data: footerSettings } = trpc.settings.get.useQuery({ key: "footer_config" });

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

  useEffect(() => {
    if (homeSettings) {
      try {
        const parsed = JSON.parse(homeSettings);
        setHomeConfig({ ...defaultHomeConfig, ...parsed });
      } catch (e) {
        console.error("Failed to parse home config:", e);
      }
    }
  }, [homeSettings]);

  useEffect(() => {
    if (footerSettings) {
      try {
        const parsed = JSON.parse(footerSettings);
        setFooterConfig({ ...defaultFooterConfig, ...parsed });
      } catch (e) {
        console.error("Failed to parse footer config:", e);
      }
    }
  }, [footerSettings]);

  const handleMenuToggle = (key: keyof MenuConfig) => {
    setMenuConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAboutChange = (key: keyof AboutPageConfig, value: string) => {
    setAboutConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleHomeChange = (key: keyof HomePageConfig, value: string) => {
    setHomeConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleFooterChange = (key: keyof FooterConfig, value: string) => {
    setFooterConfig(prev => ({ ...prev, [key]: value }));
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

  const saveHomeConfig = async () => {
    setIsSaving(true);
    try {
      await setSetting.mutateAsync({
        key: "home_page_config",
        value: JSON.stringify(homeConfig),
        type: "json",
        description: "Cấu hình nội dung trang chủ",
      });
      toast.success("Đã lưu cấu hình trang chủ thành công!");
    } catch (error) {
      toast.error("Lỗi khi lưu cấu hình trang chủ");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const saveFooterConfig = async () => {
    setIsSaving(true);
    try {
      await setSetting.mutateAsync({
        key: "footer_config",
        value: JSON.stringify(footerConfig),
        type: "json",
        description: "Cấu hình footer website",
      });
      toast.success("Đã lưu cấu hình footer thành công!");
    } catch (error) {
      toast.error("Lỗi khi lưu cấu hình footer");
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
          <TabsList className="flex-wrap">
            <TabsTrigger value="menu" className="flex items-center gap-2">
              <Menu className="h-4 w-4" />
              Menu
            </TabsTrigger>
            <TabsTrigger value="home" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Trang Chủ
            </TabsTrigger>
            <TabsTrigger value="about" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Giới Thiệu
            </TabsTrigger>
            <TabsTrigger value="footer" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Footer
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
                  Bật/tắt các mục menu trên thanh điều hướng. Các mục bị tắt sẽ không hiển thị cho người dùng.
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

          {/* Home Page Configuration Tab */}
          <TabsContent value="home">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Cấu Hình Trang Chủ
                </CardTitle>
                <CardDescription>
                  Chỉnh sửa nội dung hiển thị trên trang chủ của website.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Hero Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Phần Hero</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="heroTagline">Tagline</Label>
                      <Input
                        id="heroTagline"
                        value={homeConfig.heroTagline}
                        onChange={(e) => handleHomeChange("heroTagline", e.target.value)}
                        placeholder="CÔNG NGHỆ LASER TIÊN TIẾN"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="heroTitle">Tiêu đề chính</Label>
                      <Input
                        id="heroTitle"
                        value={homeConfig.heroTitle}
                        onChange={(e) => handleHomeChange("heroTitle", e.target.value)}
                        placeholder="ĐỈNH CAO"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="heroTitleHighlight">Tiêu đề highlight</Label>
                      <Input
                        id="heroTitleHighlight"
                        value={homeConfig.heroTitleHighlight}
                        onChange={(e) => handleHomeChange("heroTitleHighlight", e.target.value)}
                        placeholder="CÔNG NGHỆ GIA CÔNG CHÍNH XÁC"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="heroDescription">Mô tả</Label>
                      <Textarea
                        id="heroDescription"
                        value={homeConfig.heroDescription}
                        onChange={(e) => handleHomeChange("heroDescription", e.target.value)}
                        placeholder="Mô tả ngắn về công ty..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="heroButtonPrimary">Nút chính</Label>
                      <Input
                        id="heroButtonPrimary"
                        value={homeConfig.heroButtonPrimary}
                        onChange={(e) => handleHomeChange("heroButtonPrimary", e.target.value)}
                        placeholder="KHÁM PHÁ SẢN PHẨM"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="heroButtonSecondary">Nút phụ</Label>
                      <Input
                        id="heroButtonSecondary"
                        value={homeConfig.heroButtonSecondary}
                        onChange={(e) => handleHomeChange("heroButtonSecondary", e.target.value)}
                        placeholder="LIÊN HỆ TƯ VẤN"
                      />
                    </div>
                  </div>
                </div>

                {/* Stats Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Thống Kê</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="statsYears">Số năm kinh nghiệm</Label>
                      <Input
                        id="statsYears"
                        value={homeConfig.statsYears}
                        onChange={(e) => handleHomeChange("statsYears", e.target.value)}
                        placeholder="15+"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="statsProjects">Số dự án</Label>
                      <Input
                        id="statsProjects"
                        value={homeConfig.statsProjects}
                        onChange={(e) => handleHomeChange("statsProjects", e.target.value)}
                        placeholder="500+"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="statsPartners">Số đối tác</Label>
                      <Input
                        id="statsPartners"
                        value={homeConfig.statsPartners}
                        onChange={(e) => handleHomeChange("statsPartners", e.target.value)}
                        placeholder="100+"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="statsSatisfaction">Độ hài lòng</Label>
                      <Input
                        id="statsSatisfaction"
                        value={homeConfig.statsSatisfaction}
                        onChange={(e) => handleHomeChange("statsSatisfaction", e.target.value)}
                        placeholder="98%"
                      />
                    </div>
                  </div>
                </div>

                {/* Section Titles */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Tiêu Đề Các Section</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="whyChooseTitle">Tiêu đề "Tại sao chọn"</Label>
                      <Input
                        id="whyChooseTitle"
                        value={homeConfig.whyChooseTitle}
                        onChange={(e) => handleHomeChange("whyChooseTitle", e.target.value)}
                        placeholder="Tại Sao Chọn Dreamweldtech?"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whyChooseDescription">Mô tả</Label>
                      <Input
                        id="whyChooseDescription"
                        value={homeConfig.whyChooseDescription}
                        onChange={(e) => handleHomeChange("whyChooseDescription", e.target.value)}
                        placeholder="Mô tả ngắn..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="productsTitle">Tiêu đề "Sản phẩm"</Label>
                      <Input
                        id="productsTitle"
                        value={homeConfig.productsTitle}
                        onChange={(e) => handleHomeChange("productsTitle", e.target.value)}
                        placeholder="Sản Phẩm Nổi Bật"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="productsDescription">Mô tả</Label>
                      <Input
                        id="productsDescription"
                        value={homeConfig.productsDescription}
                        onChange={(e) => handleHomeChange("productsDescription", e.target.value)}
                        placeholder="Mô tả ngắn..."
                      />
                    </div>
                  </div>
                </div>

                {/* CTA Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Phần Call-to-Action</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ctaTitle">Tiêu đề CTA</Label>
                      <Input
                        id="ctaTitle"
                        value={homeConfig.ctaTitle}
                        onChange={(e) => handleHomeChange("ctaTitle", e.target.value)}
                        placeholder="Sẵn Sàng Nâng Cấp Công Nghệ?"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ctaButton">Nút CTA</Label>
                      <Input
                        id="ctaButton"
                        value={homeConfig.ctaButton}
                        onChange={(e) => handleHomeChange("ctaButton", e.target.value)}
                        placeholder="Nhận Tư Vấn Miễn Phí"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="ctaDescription">Mô tả CTA</Label>
                      <Textarea
                        id="ctaDescription"
                        value={homeConfig.ctaDescription}
                        onChange={(e) => handleHomeChange("ctaDescription", e.target.value)}
                        placeholder="Mô tả kêu gọi hành động..."
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={saveHomeConfig} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Lưu Cấu Hình Trang Chủ
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
                      <Label htmlFor="aboutHeroTitle">Tiêu đề chính</Label>
                      <Input
                        id="aboutHeroTitle"
                        value={aboutConfig.heroTitle}
                        onChange={(e) => handleAboutChange("heroTitle", e.target.value)}
                        placeholder="Về Chúng Tôi"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="aboutHeroSubtitle">Phụ đề</Label>
                      <Input
                        id="aboutHeroSubtitle"
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
                      <Label htmlFor="aboutCompanyName">Tên công ty</Label>
                      <Input
                        id="aboutCompanyName"
                        value={aboutConfig.companyName}
                        onChange={(e) => handleAboutChange("companyName", e.target.value)}
                        placeholder="Dreamweldtech"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="aboutFoundedYear">Năm thành lập</Label>
                      <Input
                        id="aboutFoundedYear"
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
                      <Label htmlFor="aboutMission">Sứ mệnh</Label>
                      <Textarea
                        id="aboutMission"
                        value={aboutConfig.mission}
                        onChange={(e) => handleAboutChange("mission", e.target.value)}
                        placeholder="Sứ mệnh của công ty..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="aboutVision">Tầm nhìn</Label>
                      <Textarea
                        id="aboutVision"
                        value={aboutConfig.vision}
                        onChange={(e) => handleAboutChange("vision", e.target.value)}
                        placeholder="Tầm nhìn của công ty..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="aboutCoreValues">Giá trị cốt lõi</Label>
                      <Input
                        id="aboutCoreValues"
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
                      <Label htmlFor="aboutTeamDescription">Mô tả đội ngũ</Label>
                      <Textarea
                        id="aboutTeamDescription"
                        value={aboutConfig.teamDescription}
                        onChange={(e) => handleAboutChange("teamDescription", e.target.value)}
                        placeholder="Mô tả về đội ngũ nhân viên..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="aboutHistoryDescription">Lịch sử phát triển</Label>
                      <Textarea
                        id="aboutHistoryDescription"
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
                      <Label htmlFor="aboutContactEmail">Email</Label>
                      <Input
                        id="aboutContactEmail"
                        type="email"
                        value={aboutConfig.contactEmail}
                        onChange={(e) => handleAboutChange("contactEmail", e.target.value)}
                        placeholder="contact@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="aboutContactPhone">Số điện thoại</Label>
                      <Input
                        id="aboutContactPhone"
                        value={aboutConfig.contactPhone}
                        onChange={(e) => handleAboutChange("contactPhone", e.target.value)}
                        placeholder="+84 123 456 789"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="aboutContactAddress">Địa chỉ</Label>
                      <Input
                        id="aboutContactAddress"
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

          {/* Footer Configuration Tab */}
          <TabsContent value="footer">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LayoutGrid className="h-5 w-5" />
                  Cấu Hình Footer
                </CardTitle>
                <CardDescription>
                  Chỉnh sửa thông tin liên hệ và các link mạng xã hội trong footer.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Company Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Thông Tin Công Ty</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="footerCompanyName">Tên công ty</Label>
                      <Input
                        id="footerCompanyName"
                        value={footerConfig.companyName}
                        onChange={(e) => handleFooterChange("companyName", e.target.value)}
                        placeholder="Dreamweldtech"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="footerCopyright">Copyright</Label>
                      <Input
                        id="footerCopyright"
                        value={footerConfig.copyright}
                        onChange={(e) => handleFooterChange("copyright", e.target.value)}
                        placeholder="© 2024 Dreamweldtech. All rights reserved."
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="footerCompanyDescription">Mô tả công ty</Label>
                      <Textarea
                        id="footerCompanyDescription"
                        value={footerConfig.companyDescription}
                        onChange={(e) => handleFooterChange("companyDescription", e.target.value)}
                        placeholder="Mô tả ngắn về công ty..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Thông Tin Liên Hệ</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="footerAddress">Địa chỉ</Label>
                      <Input
                        id="footerAddress"
                        value={footerConfig.address}
                        onChange={(e) => handleFooterChange("address", e.target.value)}
                        placeholder="123 Đường ABC, Quận XYZ, TP.HCM"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="footerPhone">Số điện thoại</Label>
                      <Input
                        id="footerPhone"
                        value={footerConfig.phone}
                        onChange={(e) => handleFooterChange("phone", e.target.value)}
                        placeholder="+84 123 456 789"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="footerEmail">Email</Label>
                      <Input
                        id="footerEmail"
                        type="email"
                        value={footerConfig.email}
                        onChange={(e) => handleFooterChange("email", e.target.value)}
                        placeholder="contact@dreamweldtech.com"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="footerWorkingHours">Giờ làm việc</Label>
                      <Input
                        id="footerWorkingHours"
                        value={footerConfig.workingHours}
                        onChange={(e) => handleFooterChange("workingHours", e.target.value)}
                        placeholder="Thứ 2 - Thứ 6: 8:00 - 17:30"
                      />
                    </div>
                  </div>
                </div>

                {/* Social Media Links */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Mạng Xã Hội</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="footerFacebook" className="flex items-center gap-2">
                        <Facebook className="h-4 w-4" /> Facebook
                      </Label>
                      <Input
                        id="footerFacebook"
                        value={footerConfig.facebookUrl}
                        onChange={(e) => handleFooterChange("facebookUrl", e.target.value)}
                        placeholder="https://facebook.com/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="footerLinkedin" className="flex items-center gap-2">
                        <Linkedin className="h-4 w-4" /> LinkedIn
                      </Label>
                      <Input
                        id="footerLinkedin"
                        value={footerConfig.linkedinUrl}
                        onChange={(e) => handleFooterChange("linkedinUrl", e.target.value)}
                        placeholder="https://linkedin.com/company/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="footerYoutube" className="flex items-center gap-2">
                        <Youtube className="h-4 w-4" /> YouTube
                      </Label>
                      <Input
                        id="footerYoutube"
                        value={footerConfig.youtubeUrl}
                        onChange={(e) => handleFooterChange("youtubeUrl", e.target.value)}
                        placeholder="https://youtube.com/@..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="footerTwitter" className="flex items-center gap-2">
                        <Twitter className="h-4 w-4" /> Twitter/X
                      </Label>
                      <Input
                        id="footerTwitter"
                        value={footerConfig.twitterUrl}
                        onChange={(e) => handleFooterChange("twitterUrl", e.target.value)}
                        placeholder="https://twitter.com/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="footerInstagram" className="flex items-center gap-2">
                        <Instagram className="h-4 w-4" /> Instagram
                      </Label>
                      <Input
                        id="footerInstagram"
                        value={footerConfig.instagramUrl}
                        onChange={(e) => handleFooterChange("instagramUrl", e.target.value)}
                        placeholder="https://instagram.com/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="footerZalo">Zalo</Label>
                      <Input
                        id="footerZalo"
                        value={footerConfig.zaloUrl}
                        onChange={(e) => handleFooterChange("zaloUrl", e.target.value)}
                        placeholder="https://zalo.me/..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={saveFooterConfig} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Lưu Cấu Hình Footer
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
