import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, ArrowRight, Building2, Quote, TrendingUp, 
  CheckCircle, Target, Lightbulb, Award, Play
} from "lucide-react";
import { Link, useParams } from "wouter";
import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const INDUSTRIES: Record<string, { vi: string; en: string }> = {
  automotive: { vi: "Ô tô", en: "Automotive" },
  aerospace: { vi: "Hàng không", en: "Aerospace" },
  electronics: { vi: "Điện tử", en: "Electronics" },
  shipbuilding: { vi: "Đóng tàu", en: "Shipbuilding" },
  construction: { vi: "Xây dựng", en: "Construction" },
  manufacturing: { vi: "Sản xuất", en: "Manufacturing" },
  energy: { vi: "Năng lượng", en: "Energy" },
  other: { vi: "Khác", en: "Other" },
};

export default function CaseStudyDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const { data: caseStudy, isLoading } = trpc.caseStudies.getBySlug.useQuery({ slug: slug || "" });

  useEffect(() => {
    if (caseStudy) {
      const title = language === "en" && caseStudy.titleEn ? caseStudy.titleEn : caseStudy.title;
      document.title = `${title} - Dreamweldtech`;
    }
  }, [caseStudy, language]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!caseStudy) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">
          {language === "vi" ? "Không tìm thấy dự án" : "Case study not found"}
        </h1>
        <Link href="/case-studies">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === "vi" ? "Quay lại danh sách" : "Back to list"}
          </Button>
        </Link>
      </div>
    );
  }

  const title = language === "en" && caseStudy.titleEn ? caseStudy.titleEn : caseStudy.title;
  const challenge = language === "en" && caseStudy.challengeEn ? caseStudy.challengeEn : caseStudy.challenge;
  const solution = language === "en" && caseStudy.solutionEn ? caseStudy.solutionEn : caseStudy.solution;
  const results = language === "en" && caseStudy.resultsEn ? caseStudy.resultsEn : caseStudy.results;
  const testimonial = language === "en" && caseStudy.testimonialEn ? caseStudy.testimonialEn : caseStudy.testimonial;

  let metrics: Record<string, string> = {};
  try {
    if (caseStudy.metrics) metrics = JSON.parse(caseStudy.metrics);
  } catch {}

  const industryLabel = caseStudy.industry 
    ? (language === "vi" ? INDUSTRIES[caseStudy.industry]?.vi : INDUSTRIES[caseStudy.industry]?.en)
    : null;

  return (
    <>
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[400px]">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${caseStudy.image || "/images/about-factory.jpg"})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70"></div>
        </div>
        <div className="relative container h-full flex flex-col justify-center text-white">
          <Link href="/case-studies" className="inline-flex items-center text-white/80 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === "vi" ? "Quay lại danh sách" : "Back to case studies"}
          </Link>
          <div className="flex items-center gap-3 mb-4">
            {industryLabel && (
              <Badge variant="secondary" className="bg-white/20 text-white">
                {industryLabel}
              </Badge>
            )}
            {caseStudy.isFeatured === "true" && (
              <Badge className="bg-chart-1">
                {language === "vi" ? "Nổi Bật" : "Featured"}
              </Badge>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase mb-4 max-w-4xl">
            {title}
          </h1>
          <div className="flex items-center gap-2 text-white/80">
            <Building2 className="h-5 w-5" />
            <span className="text-lg">{caseStudy.clientName}</span>
          </div>
        </div>
      </section>

      {/* Metrics Bar */}
      {Object.keys(metrics).length > 0 && (
        <section className="bg-chart-1 py-8">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {Object.entries(metrics).map(([key, value]) => (
                <div key={key} className="text-center text-white">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <TrendingUp className="h-6 w-6" />
                    <span className="text-3xl font-bold">{value}</span>
                  </div>
                  <p className="text-sm text-white/80 capitalize">
                    {key.replace(/_/g, " ")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Content Sections */}
      <section className="py-16">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
              {/* Challenge */}
              {challenge && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <Target className="h-6 w-6 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-heading font-bold uppercase">
                      {language === "vi" ? "Thách Thức" : "The Challenge"}
                    </h2>
                  </div>
                  <div className="prose prose-lg max-w-none">
                    <p className="text-muted-foreground whitespace-pre-line">{challenge}</p>
                  </div>
                </div>
              )}

              {/* Solution */}
              {solution && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Lightbulb className="h-6 w-6 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-heading font-bold uppercase">
                      {language === "vi" ? "Giải Pháp" : "Our Solution"}
                    </h2>
                  </div>
                  <div className="prose prose-lg max-w-none">
                    <p className="text-muted-foreground whitespace-pre-line">{solution}</p>
                  </div>
                </div>
              )}

              {/* Results */}
              {results && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Award className="h-6 w-6 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-heading font-bold uppercase">
                      {language === "vi" ? "Kết Quả" : "The Results"}
                    </h2>
                  </div>
                  <div className="prose prose-lg max-w-none">
                    <p className="text-muted-foreground whitespace-pre-line">{results}</p>
                  </div>
                </div>
              )}

              {/* Video */}
              {caseStudy.videoUrl && (
                <div>
                  <h2 className="text-2xl font-heading font-bold uppercase mb-4">
                    {language === "vi" ? "Video Dự Án" : "Project Video"}
                  </h2>
                  <div className="aspect-video bg-secondary rounded-lg overflow-hidden">
                    <iframe
                      src={caseStudy.videoUrl.replace("watch?v=", "embed/")}
                      className="w-full h-full"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Client Info */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-heading font-bold uppercase mb-4">
                    {language === "vi" ? "Thông Tin Khách Hàng" : "Client Information"}
                  </h3>
                  <div className="space-y-4">
                    {caseStudy.clientLogo && (
                      <img 
                        src={caseStudy.clientLogo} 
                        alt={caseStudy.clientName}
                        className="h-12 object-contain"
                      />
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {language === "vi" ? "Tên công ty" : "Company"}
                      </p>
                      <p className="font-medium">{caseStudy.clientName}</p>
                    </div>
                    {industryLabel && (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {language === "vi" ? "Ngành" : "Industry"}
                        </p>
                        <p className="font-medium">{industryLabel}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Testimonial */}
              {testimonial && (
                <Card className="bg-primary text-white">
                  <CardContent className="p-6">
                    <Quote className="h-8 w-8 text-chart-1 mb-4" />
                    <p className="italic mb-4">{testimonial}</p>
                    {caseStudy.testimonialAuthor && (
                      <div className="border-t border-white/20 pt-4">
                        <p className="font-bold">{caseStudy.testimonialAuthor}</p>
                        {caseStudy.testimonialPosition && (
                          <p className="text-sm text-white/80">{caseStudy.testimonialPosition}</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* CTA */}
              <Card className="bg-chart-1 text-white">
                <CardContent className="p-6 text-center">
                  <h3 className="font-heading font-bold uppercase mb-2">
                    {language === "vi" ? "Bạn Có Dự Án Tương Tự?" : "Have a Similar Project?"}
                  </h3>
                  <p className="text-sm text-white/80 mb-4">
                    {language === "vi"
                      ? "Liên hệ với chúng tôi để được tư vấn giải pháp phù hợp."
                      : "Contact us for a customized solution."}
                  </p>
                  <Link href="/contact">
                    <Button variant="secondary" className="w-full">
                      {language === "vi" ? "Liên Hệ Ngay" : "Contact Us"}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* More Case Studies */}
      <section className="bg-secondary/50 py-16">
        <div className="container text-center">
          <h2 className="text-2xl font-heading font-bold uppercase mb-8">
            {language === "vi" ? "Xem Thêm Dự Án Khác" : "Explore More Projects"}
          </h2>
          <Link href="/case-studies">
            <Button size="lg">
              {language === "vi" ? "Xem Tất Cả Dự Án" : "View All Case Studies"}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
