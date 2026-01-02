import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Quote, Building2, Factory, Truck, Landmark, Users } from "lucide-react";
import { motion } from "framer-motion";

const categoryIcons: Record<string, React.ElementType> = {
  manufacturer: Factory,
  distributor: Truck,
  enterprise: Building2,
  government: Landmark,
  other: Users,
};

const categoryLabels: Record<string, Record<string, string>> = {
  vi: {
    manufacturer: "Nhà sản xuất",
    distributor: "Nhà phân phối",
    enterprise: "Doanh nghiệp",
    government: "Cơ quan nhà nước",
    other: "Khác",
    all: "Tất cả",
  },
  en: {
    manufacturer: "Manufacturer",
    distributor: "Distributor",
    enterprise: "Enterprise",
    government: "Government",
    other: "Other",
    all: "All",
  },
  ja: {
    manufacturer: "メーカー",
    distributor: "代理店",
    enterprise: "企業",
    government: "政府機関",
    other: "その他",
    all: "すべて",
  },
  zh: {
    manufacturer: "制造商",
    distributor: "分销商",
    enterprise: "企业",
    government: "政府机构",
    other: "其他",
    all: "全部",
  },
};

const pageContent: Record<string, { title: string; subtitle: string; testimonialTitle: string }> = {
  vi: {
    title: "Đối Tác & Khách Hàng",
    subtitle: "Dreamweldtech tự hào được hợp tác với các doanh nghiệp hàng đầu trong ngành công nghiệp",
    testimonialTitle: "Khách Hàng Nói Gì Về Chúng Tôi",
  },
  en: {
    title: "Partners & Clients",
    subtitle: "Dreamweldtech is proud to partner with leading enterprises in the industry",
    testimonialTitle: "What Our Clients Say",
  },
  ja: {
    title: "パートナー＆クライアント",
    subtitle: "Dreamweldtechは業界をリードする企業との提携を誇りに思っています",
    testimonialTitle: "お客様の声",
  },
  zh: {
    title: "合作伙伴与客户",
    subtitle: "Dreamweldtech很荣幸与行业领先企业合作",
    testimonialTitle: "客户评价",
  },
};

export default function Partners() {
  const { language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { data: partners, isLoading } = trpc.partners.getActive.useQuery();
  const { data: testimonialPartners } = trpc.partners.getWithTestimonials.useQuery();

  const content = pageContent[language] || pageContent.vi;
  const labels = categoryLabels[language] || categoryLabels.vi;

  useEffect(() => {
    document.title = `${content.title} | Dreamweldtech`;
  }, [content.title]);

  const filteredPartners = partners?.filter(
    (p) => selectedCategory === "all" || p.category === selectedCategory
  );

  const categories = ["all", "manufacturer", "distributor", "enterprise", "government", "other"];

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-400 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        </div>
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">{content.title}</h1>
            <p className="text-xl text-white/80">{content.subtitle}</p>
          </motion.div>
        </div>
      </section>

      {/* Logo Carousel Section */}
      <section className="py-16 bg-secondary/30">
        <div className="container">
          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="gap-2"
              >
                {cat !== "all" && (() => {
                  const Icon = categoryIcons[cat];
                  return <Icon className="w-4 h-4" />;
                })()}
                {labels[cat]}
              </Button>
            ))}
          </div>

          {/* Partners Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredPartners?.map((partner, index) => (
              <motion.div
                key={partner.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="group hover:shadow-lg transition-all duration-300 h-full">
                  <CardContent className="p-6 flex flex-col items-center justify-center h-full">
                    {partner.logo ? (
                      <img
                        src={partner.logo}
                        alt={partner.name}
                        className="w-full h-20 object-contain grayscale group-hover:grayscale-0 transition-all duration-300"
                      />
                    ) : (
                      <div className="w-full h-20 flex items-center justify-center bg-muted rounded">
                        <Building2 className="w-10 h-10 text-muted-foreground" />
                      </div>
                    )}
                    <p className="mt-4 text-sm font-medium text-center line-clamp-2">{partner.name}</p>
                    {partner.isFeatured === "true" && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        ⭐ Featured
                      </Badge>
                    )}
                    {partner.website && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        asChild
                      >
                        <a href={partner.website} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Website
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {filteredPartners?.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Không có đối tác nào trong danh mục này</p>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      {testimonialPartners && testimonialPartners.length > 0 && (
        <section className="py-20 bg-background">
          <div className="container">
            <h2 className="text-3xl font-heading font-bold text-center mb-12">
              {content.testimonialTitle}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonialPartners.map((partner, index) => (
                <motion.div
                  key={partner.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="h-full">
                    <CardContent className="p-6">
                      <Quote className="w-10 h-10 text-primary/20 mb-4" />
                      <p className="text-muted-foreground italic mb-6 line-clamp-4">
                        "{partner.testimonial}"
                      </p>
                      <div className="flex items-center gap-4">
                        {partner.logo ? (
                          <img
                            src={partner.logo}
                            alt={partner.name}
                            className="w-12 h-12 object-contain rounded border p-1"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold">{partner.testimonialAuthor || partner.name}</p>
                          {partner.testimonialPosition && (
                            <p className="text-sm text-muted-foreground">{partner.testimonialPosition}</p>
                          )}
                          <p className="text-xs text-primary">{partner.name}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Stats Section */}
      <section className="py-16 bg-primary text-white">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-heading font-bold mb-2">{partners?.length || 0}+</p>
              <p className="text-white/70">Đối tác tin cậy</p>
            </div>
            <div>
              <p className="text-4xl font-heading font-bold mb-2">500+</p>
              <p className="text-white/70">Dự án hoàn thành</p>
            </div>
            <div>
              <p className="text-4xl font-heading font-bold mb-2">15+</p>
              <p className="text-white/70">Năm kinh nghiệm</p>
            </div>
            <div>
              <p className="text-4xl font-heading font-bold mb-2">98%</p>
              <p className="text-white/70">Khách hàng hài lòng</p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
