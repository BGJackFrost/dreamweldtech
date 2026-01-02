import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Quote, TrendingUp, Filter } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const INDUSTRIES = [
  { value: "automotive", labelVi: "Ô tô", labelEn: "Automotive" },
  { value: "aerospace", labelVi: "Hàng không", labelEn: "Aerospace" },
  { value: "electronics", labelVi: "Điện tử", labelEn: "Electronics" },
  { value: "shipbuilding", labelVi: "Đóng tàu", labelEn: "Shipbuilding" },
  { value: "construction", labelVi: "Xây dựng", labelEn: "Construction" },
  { value: "manufacturing", labelVi: "Sản xuất", labelEn: "Manufacturing" },
  { value: "energy", labelVi: "Năng lượng", labelEn: "Energy" },
  { value: "other", labelVi: "Khác", labelEn: "Other" },
];

export default function CaseStudies() {
  const { language } = useLanguage();
  const { data: caseStudies, isLoading } = trpc.caseStudies.list.useQuery({});
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);

  const filteredCaseStudies = selectedIndustry
    ? caseStudies?.filter((cs) => cs.industry === selectedIndustry)
    : caseStudies;

  useEffect(() => {
    document.title = language === "vi"
      ? "Dự Án Tiêu Biểu - Dreamweldtech"
      : "Case Studies - Dreamweldtech";
  }, [language]);

  const getIndustryLabel = (value: string) => {
    const industry = INDUSTRIES.find((i) => i.value === value);
    return language === "vi" ? industry?.labelVi : industry?.labelEn;
  };

  return (
    <>
      {/* Hero Section */}
      <section className="bg-primary text-white py-16">
        <div className="container">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-1 bg-chart-1/20 text-chart-1 text-sm font-bold uppercase tracking-wider rounded mb-4">
              {language === "vi" ? "Dự Án Tiêu Biểu" : "Case Studies"}
            </span>
            <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase mb-4">
              {language === "vi" ? (
                <>Câu Chuyện <span className="text-chart-1">Thành Công</span></>
              ) : (
                <>Success <span className="text-chart-1">Stories</span></>
              )}
            </h1>
            <p className="text-lg text-white/80">
              {language === "vi"
                ? "Khám phá cách Dreamweldtech đã giúp các doanh nghiệp hàng đầu tối ưu hóa quy trình sản xuất với công nghệ laser tiên tiến."
                : "Discover how Dreamweldtech has helped leading businesses optimize their manufacturing processes with advanced laser technology."}
            </p>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="bg-secondary/50 py-6 sticky top-16 z-30 border-b">
        <div className="container">
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            <Filter className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <Button
              variant={selectedIndustry === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedIndustry(null)}
              className="flex-shrink-0"
            >
              {language === "vi" ? "Tất Cả" : "All"}
            </Button>
            {INDUSTRIES.map((industry) => (
              <Button
                key={industry.value}
                variant={selectedIndustry === industry.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedIndustry(industry.value)}
                className="flex-shrink-0"
              >
                {language === "vi" ? industry.labelVi : industry.labelEn}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies Grid */}
      <section className="py-16">
        <div className="container">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-secondary"></div>
                  <CardContent className="p-6">
                    <div className="h-4 bg-secondary rounded w-1/4 mb-4"></div>
                    <div className="h-6 bg-secondary rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-secondary rounded w-full"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCaseStudies && filteredCaseStudies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCaseStudies.map((cs) => {
                const title = language === "en" && cs.titleEn ? cs.titleEn : cs.title;
                const challenge = language === "en" && cs.challengeEn ? cs.challengeEn : cs.challenge;
                let metrics: Record<string, string> = {};
                try {
                  if (cs.metrics) metrics = JSON.parse(cs.metrics);
                } catch {}

                return (
                  <Card key={cs.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-white">
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={cs.image || "/images/about-factory.jpg"}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {cs.isFeatured === "true" && (
                        <Badge className="absolute top-4 left-4 bg-chart-1">
                          {language === "vi" ? "Nổi Bật" : "Featured"}
                        </Badge>
                      )}
                      {cs.industry && (
                        <Badge variant="secondary" className="absolute top-4 right-4">
                          {getIndustryLabel(cs.industry)}
                        </Badge>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Building2 className="h-4 w-4" />
                        <span className="text-sm">{cs.clientName}</span>
                      </div>
                      <h3 className="text-xl font-heading font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                        {title}
                      </h3>
                      {challenge && (
                        <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                          {challenge}
                        </p>
                      )}
                      
                      {/* Metrics Preview */}
                      {Object.keys(metrics).length > 0 && (
                        <div className="flex gap-4 mb-4">
                          {Object.entries(metrics).slice(0, 2).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-1 text-sm">
                              <TrendingUp className="h-4 w-4 text-green-500" />
                              <span className="font-bold text-primary">{value}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <Link href={`/case-studies/${cs.slug}`}>
                        <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-colors">
                          {language === "vi" ? "Xem Chi Tiết" : "View Details"}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <Quote className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-lg">
                {language === "vi"
                  ? "Chưa có dự án nào trong danh mục này."
                  : "No case studies found in this category."}
              </p>
              <Button className="mt-4" onClick={() => setSelectedIndustry(null)}>
                {language === "vi" ? "Xem tất cả dự án" : "View all projects"}
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16">
        <div className="container text-center">
          <h2 className="text-3xl font-heading font-bold text-white uppercase mb-4">
            {language === "vi" ? "Bạn Muốn Trở Thành Câu Chuyện Tiếp Theo?" : "Want to Be Our Next Success Story?"}
          </h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            {language === "vi"
              ? "Liên hệ với chúng tôi ngay hôm nay để được tư vấn giải pháp công nghệ laser phù hợp với doanh nghiệp của bạn."
              : "Contact us today to get a consultation on the right laser technology solution for your business."}
          </p>
          <Link href="/contact">
            <Button size="lg" className="bg-chart-1 hover:bg-chart-1/90 text-white">
              {language === "vi" ? "Liên Hệ Ngay" : "Contact Us"}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
