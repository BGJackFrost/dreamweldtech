import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Save, Globe, Loader2, Home, LayoutGrid } from "lucide-react";

type Language = "vi" | "en" | "ja" | "zh";

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
  copyright: string;
}

const languageLabels: Record<Language, string> = {
  vi: "🇻🇳 Tiếng Việt",
  en: "🇺🇸 English",
  ja: "🇯🇵 日本語",
  zh: "🇨🇳 中文",
};

const defaultHomeConfig: Record<Language, HomePageConfig> = {
  vi: {
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
    productsDescription: "Khám phá các dòng máy laser công nghiệp hàng đầu",
    ctaTitle: "Sẵn Sàng Nâng Cấp Sản Xuất?",
    ctaDescription: "Liên hệ ngay để được tư vấn giải pháp phù hợp nhất",
    ctaButton: "Liên Hệ Ngay",
  },
  en: {
    heroTagline: "ADVANCED LASER TECHNOLOGY",
    heroTitle: "PEAK",
    heroTitleHighlight: "PRECISION MACHINING TECHNOLOGY",
    heroDescription: "Dreamweldtech provides comprehensive solutions for laser welding, cutting and cleaning machines for modern industry. Superior performance, maximum durability.",
    heroButtonPrimary: "EXPLORE PRODUCTS",
    heroButtonSecondary: "CONTACT US",
    statsYears: "15+",
    statsProjects: "500+",
    statsPartners: "100+",
    statsSatisfaction: "98%",
    whyChooseTitle: "Why Choose Dreamweldtech?",
    whyChooseDescription: "We are committed to providing the best laser technology solutions for your business",
    productsTitle: "Featured Products",
    productsDescription: "Discover leading industrial laser machines",
    ctaTitle: "Ready to Upgrade Production?",
    ctaDescription: "Contact us now for the most suitable solution",
    ctaButton: "Contact Now",
  },
  ja: {
    heroTagline: "先進レーザー技術",
    heroTitle: "最高峰",
    heroTitleHighlight: "精密加工技術",
    heroDescription: "Dreamweldtechは、現代産業向けのレーザー溶接、切断、洗浄機の包括的なソリューションを提供します。優れた性能、最大の耐久性。",
    heroButtonPrimary: "製品を探る",
    heroButtonSecondary: "お問い合わせ",
    statsYears: "15+",
    statsProjects: "500+",
    statsPartners: "100+",
    statsSatisfaction: "98%",
    whyChooseTitle: "なぜDreamweldtechを選ぶのか？",
    whyChooseDescription: "お客様のビジネスに最適なレーザー技術ソリューションを提供することをお約束します",
    productsTitle: "注目の製品",
    productsDescription: "業界をリードする産業用レーザー機器をご覧ください",
    ctaTitle: "生産をアップグレードする準備はできていますか？",
    ctaDescription: "最適なソリューションについて今すぐお問い合わせください",
    ctaButton: "今すぐ連絡",
  },
  zh: {
    heroTagline: "先进激光技术",
    heroTitle: "巅峰",
    heroTitleHighlight: "精密加工技术",
    heroDescription: "Dreamweldtech为现代工业提供激光焊接、切割和清洗机的全面解决方案。卓越性能，最大耐久性。",
    heroButtonPrimary: "探索产品",
    heroButtonSecondary: "联系我们",
    statsYears: "15+",
    statsProjects: "500+",
    statsPartners: "100+",
    statsSatisfaction: "98%",
    whyChooseTitle: "为什么选择Dreamweldtech？",
    whyChooseDescription: "我们致力于为您的企业提供最佳的激光技术解决方案",
    productsTitle: "精选产品",
    productsDescription: "发现领先的工业激光设备",
    ctaTitle: "准备好升级生产了吗？",
    ctaDescription: "立即联系我们获取最合适的解决方案",
    ctaButton: "立即联系",
  },
};

const defaultFooterConfig: Record<Language, FooterConfig> = {
  vi: {
    companyName: "Dreamweldtech",
    companyDescription: "Đơn vị tiên phong trong lĩnh vực công nghệ laser công nghiệp tại Việt Nam. Chúng tôi cung cấp giải pháp toàn diện về máy hàn, cắt và làm sạch laser.",
    address: "123 Đường Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh",
    phone: "+84 123 456 789",
    email: "contact@dreamweldtech.com",
    workingHours: "Thứ 2 - Thứ 6: 8:00 - 17:30",
    copyright: "© 2024 Dreamweldtech. Bảo lưu mọi quyền.",
  },
  en: {
    companyName: "Dreamweldtech",
    companyDescription: "Pioneer in industrial laser technology in Vietnam. We provide comprehensive solutions for laser welding, cutting and cleaning machines.",
    address: "123 Nguyen Van Linh Street, District 7, Ho Chi Minh City",
    phone: "+84 123 456 789",
    email: "contact@dreamweldtech.com",
    workingHours: "Mon - Fri: 8:00 AM - 5:30 PM",
    copyright: "© 2024 Dreamweldtech. All rights reserved.",
  },
  ja: {
    companyName: "Dreamweldtech",
    companyDescription: "ベトナムの産業用レーザー技術のパイオニア。レーザー溶接、切断、洗浄機の包括的なソリューションを提供しています。",
    address: "ホーチミン市7区グエンヴァンリン通り123番地",
    phone: "+84 123 456 789",
    email: "contact@dreamweldtech.com",
    workingHours: "月曜日〜金曜日：8:00〜17:30",
    copyright: "© 2024 Dreamweldtech. 全著作権所有。",
  },
  zh: {
    companyName: "Dreamweldtech",
    companyDescription: "越南工业激光技术的先驱。我们提供激光焊接、切割和清洗机的全面解决方案。",
    address: "胡志明市第7郡阮文灵路123号",
    phone: "+84 123 456 789",
    email: "contact@dreamweldtech.com",
    workingHours: "周一至周五：8:00 - 17:30",
    copyright: "© 2024 Dreamweldtech. 版权所有。",
  },
};

export default function MultiLanguageSettings() {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("vi");
  const [activeTab, setActiveTab] = useState("home");
  const [isSaving, setIsSaving] = useState(false);
  
  const [homeConfigs, setHomeConfigs] = useState<Record<Language, HomePageConfig>>(defaultHomeConfig);
  const [footerConfigs, setFooterConfigs] = useState<Record<Language, FooterConfig>>(defaultFooterConfig);

  const { data: settings } = trpc.settings.listAll.useQuery();
  const setSetting = trpc.settings.set.useMutation();

  // Load saved configs from database
  useEffect(() => {
    if (settings) {
      const languages: Language[] = ["vi", "en", "ja", "zh"];
      
      languages.forEach(lang => {
        const homeKey = `home_page_config_${lang}`;
        const footerKey = `footer_config_${lang}`;
        
        const homeSetting = settings.find((s) => s.settingKey === homeKey);
        const footerSetting = settings.find((s) => s.settingKey === footerKey);
        
        if (homeSetting?.settingValue) {
          try {
            const parsed = JSON.parse(homeSetting.settingValue);
            setHomeConfigs(prev => ({ ...prev, [lang]: { ...defaultHomeConfig[lang], ...parsed } }));
          } catch (e) {
            console.error(`Error parsing home config for ${lang}:`, e);
          }
        }
        
        if (footerSetting?.settingValue) {
          try {
            const parsed = JSON.parse(footerSetting.settingValue);
            setFooterConfigs(prev => ({ ...prev, [lang]: { ...defaultFooterConfig[lang], ...parsed } }));
          } catch (e) {
            console.error(`Error parsing footer config for ${lang}:`, e);
          }
        }
      });
    }
  }, [settings]);

  const saveHomeConfig = async () => {
    setIsSaving(true);
    try {
      await setSetting.mutateAsync({
        key: `home_page_config_${selectedLanguage}`,
        value: JSON.stringify(homeConfigs[selectedLanguage]),
      });
      toast.success(`Đã lưu cấu hình trang chủ (${languageLabels[selectedLanguage]})`);
    } catch (error) {
      toast.error("Lỗi khi lưu cấu hình");
    } finally {
      setIsSaving(false);
    }
  };

  const saveFooterConfig = async () => {
    setIsSaving(true);
    try {
      await setSetting.mutateAsync({
        key: `footer_config_${selectedLanguage}`,
        value: JSON.stringify(footerConfigs[selectedLanguage]),
      });
      toast.success(`Đã lưu cấu hình footer (${languageLabels[selectedLanguage]})`);
    } catch (error) {
      toast.error("Lỗi khi lưu cấu hình");
    } finally {
      setIsSaving(false);
    }
  };

  const saveAllLanguages = async () => {
    setIsSaving(true);
    try {
      const languages: Language[] = ["vi", "en", "ja", "zh"];
      
      for (const lang of languages) {
        await setSetting.mutateAsync({
          key: `home_page_config_${lang}`,
          value: JSON.stringify(homeConfigs[lang]),
        });
        await setSetting.mutateAsync({
          key: `footer_config_${lang}`,
          value: JSON.stringify(footerConfigs[lang]),
        });
      }
      
      toast.success("Đã lưu cấu hình cho tất cả ngôn ngữ");
    } catch (error) {
      toast.error("Lỗi khi lưu cấu hình");
    } finally {
      setIsSaving(false);
    }
  };

  const updateHomeConfig = (field: keyof HomePageConfig, value: string) => {
    setHomeConfigs(prev => ({
      ...prev,
      [selectedLanguage]: {
        ...prev[selectedLanguage],
        [field]: value,
      },
    }));
  };

  const updateFooterConfig = (field: keyof FooterConfig, value: string) => {
    setFooterConfigs(prev => ({
      ...prev,
      [selectedLanguage]: {
        ...prev[selectedLanguage],
        [field]: value,
      },
    }));
  };

  const currentHomeConfig = homeConfigs[selectedLanguage];
  const currentFooterConfig = footerConfigs[selectedLanguage];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Cấu Hình Đa Ngôn Ngữ</h1>
            <p className="text-muted-foreground">
              Quản lý nội dung website cho từng ngôn ngữ
            </p>
          </div>
          <Button onClick={saveAllLanguages} disabled={isSaving} variant="outline">
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Globe className="h-4 w-4 mr-2" />
            )}
            Lưu Tất Cả Ngôn Ngữ
          </Button>
        </div>

        {/* Language Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Chọn Ngôn Ngữ
            </CardTitle>
            <CardDescription>
              Chọn ngôn ngữ để chỉnh sửa nội dung
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(languageLabels) as Language[]).map((lang) => (
                <Button
                  key={lang}
                  variant={selectedLanguage === lang ? "default" : "outline"}
                  onClick={() => setSelectedLanguage(lang)}
                  className="min-w-[140px]"
                >
                  {languageLabels[lang]}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="home" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Trang Chủ
            </TabsTrigger>
            <TabsTrigger value="footer" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Footer
            </TabsTrigger>
          </TabsList>

          {/* Home Page Tab */}
          <TabsContent value="home">
            <Card>
              <CardHeader>
                <CardTitle>Cấu Hình Trang Chủ - {languageLabels[selectedLanguage]}</CardTitle>
                <CardDescription>
                  Chỉnh sửa nội dung hero section và các phần khác
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Hero Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Hero Section</h3>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Tagline</Label>
                      <Input
                        value={currentHomeConfig.heroTagline}
                        onChange={(e) => updateHomeConfig("heroTagline", e.target.value)}
                        placeholder="CÔNG NGHỆ LASER TIÊN TIẾN"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tiêu đề chính</Label>
                      <Input
                        value={currentHomeConfig.heroTitle}
                        onChange={(e) => updateHomeConfig("heroTitle", e.target.value)}
                        placeholder="ĐỈNH CAO"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Tiêu đề highlight</Label>
                    <Input
                      value={currentHomeConfig.heroTitleHighlight}
                      onChange={(e) => updateHomeConfig("heroTitleHighlight", e.target.value)}
                      placeholder="CÔNG NGHỆ GIA CÔNG CHÍNH XÁC"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Mô tả</Label>
                    <Textarea
                      value={currentHomeConfig.heroDescription}
                      onChange={(e) => updateHomeConfig("heroDescription", e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Nút chính</Label>
                      <Input
                        value={currentHomeConfig.heroButtonPrimary}
                        onChange={(e) => updateHomeConfig("heroButtonPrimary", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nút phụ</Label>
                      <Input
                        value={currentHomeConfig.heroButtonSecondary}
                        onChange={(e) => updateHomeConfig("heroButtonSecondary", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Stats Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Thống Kê</h3>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="space-y-2">
                      <Label>Năm kinh nghiệm</Label>
                      <Input
                        value={currentHomeConfig.statsYears}
                        onChange={(e) => updateHomeConfig("statsYears", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Dự án</Label>
                      <Input
                        value={currentHomeConfig.statsProjects}
                        onChange={(e) => updateHomeConfig("statsProjects", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Đối tác</Label>
                      <Input
                        value={currentHomeConfig.statsPartners}
                        onChange={(e) => updateHomeConfig("statsPartners", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Hài lòng</Label>
                      <Input
                        value={currentHomeConfig.statsSatisfaction}
                        onChange={(e) => updateHomeConfig("statsSatisfaction", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Why Choose Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Tại Sao Chọn Chúng Tôi</h3>
                  <div className="space-y-2">
                    <Label>Tiêu đề</Label>
                    <Input
                      value={currentHomeConfig.whyChooseTitle}
                      onChange={(e) => updateHomeConfig("whyChooseTitle", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mô tả</Label>
                    <Textarea
                      value={currentHomeConfig.whyChooseDescription}
                      onChange={(e) => updateHomeConfig("whyChooseDescription", e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>

                {/* Products Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Sản Phẩm</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Tiêu đề</Label>
                      <Input
                        value={currentHomeConfig.productsTitle}
                        onChange={(e) => updateHomeConfig("productsTitle", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Mô tả</Label>
                      <Input
                        value={currentHomeConfig.productsDescription}
                        onChange={(e) => updateHomeConfig("productsDescription", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* CTA Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Call to Action</h3>
                  <div className="space-y-2">
                    <Label>Tiêu đề</Label>
                    <Input
                      value={currentHomeConfig.ctaTitle}
                      onChange={(e) => updateHomeConfig("ctaTitle", e.target.value)}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Mô tả</Label>
                      <Input
                        value={currentHomeConfig.ctaDescription}
                        onChange={(e) => updateHomeConfig("ctaDescription", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nút</Label>
                      <Input
                        value={currentHomeConfig.ctaButton}
                        onChange={(e) => updateHomeConfig("ctaButton", e.target.value)}
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
                    Lưu Cấu Hình Trang Chủ ({languageLabels[selectedLanguage]})
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Footer Tab */}
          <TabsContent value="footer">
            <Card>
              <CardHeader>
                <CardTitle>Cấu Hình Footer - {languageLabels[selectedLanguage]}</CardTitle>
                <CardDescription>
                  Chỉnh sửa thông tin footer cho ngôn ngữ này
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tên công ty</Label>
                    <Input
                      value={currentFooterConfig.companyName}
                      onChange={(e) => updateFooterConfig("companyName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      value={currentFooterConfig.email}
                      onChange={(e) => updateFooterConfig("email", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Mô tả công ty</Label>
                  <Textarea
                    value={currentFooterConfig.companyDescription}
                    onChange={(e) => updateFooterConfig("companyDescription", e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Địa chỉ</Label>
                    <Input
                      value={currentFooterConfig.address}
                      onChange={(e) => updateFooterConfig("address", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Số điện thoại</Label>
                    <Input
                      value={currentFooterConfig.phone}
                      onChange={(e) => updateFooterConfig("phone", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Giờ làm việc</Label>
                    <Input
                      value={currentFooterConfig.workingHours}
                      onChange={(e) => updateFooterConfig("workingHours", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Copyright</Label>
                    <Input
                      value={currentFooterConfig.copyright}
                      onChange={(e) => updateFooterConfig("copyright", e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={saveFooterConfig} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Lưu Cấu Hình Footer ({languageLabels[selectedLanguage]})
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
