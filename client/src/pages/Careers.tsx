import { useState, useEffect } from "react";
import { Link } from "wouter";
// Layout is already provided by PublicRouter in App.tsx
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  DollarSign, 
  Users, 
  Target,
  Heart,
  Zap,
  ChevronRight,
  Building2,
  GraduationCap
} from "lucide-react";

export default function Careers() {
  const { language } = useLanguage();
  const { data: jobs, isLoading } = trpc.jobs.listActive.useQuery();

  useEffect(() => {
    document.title = language === "vi" 
      ? "Tuyển Dụng | Dreamweldtech" 
      : "Careers | Dreamweldtech";
  }, [language]);

  const benefits = [
    {
      icon: DollarSign,
      title: language === "vi" ? "Lương thưởng hấp dẫn" : "Competitive Salary",
      description: language === "vi" 
        ? "Mức lương cạnh tranh, thưởng theo hiệu suất và các khoản phụ cấp hấp dẫn"
        : "Competitive salary, performance bonuses and attractive allowances"
    },
    {
      icon: Heart,
      title: language === "vi" ? "Bảo hiểm sức khỏe" : "Health Insurance",
      description: language === "vi"
        ? "Bảo hiểm y tế cao cấp cho bạn và gia đình, khám sức khỏe định kỳ"
        : "Premium health insurance for you and your family, regular health checkups"
    },
    {
      icon: GraduationCap,
      title: language === "vi" ? "Đào tạo phát triển" : "Training & Development",
      description: language === "vi"
        ? "Cơ hội học hỏi công nghệ mới, tham gia các khóa đào tạo chuyên sâu"
        : "Opportunities to learn new technologies, attend specialized training courses"
    },
    {
      icon: Users,
      title: language === "vi" ? "Môi trường năng động" : "Dynamic Environment",
      description: language === "vi"
        ? "Làm việc với đội ngũ chuyên gia, môi trường sáng tạo và cởi mở"
        : "Work with expert team, creative and open environment"
    },
    {
      icon: Zap,
      title: language === "vi" ? "Công nghệ tiên tiến" : "Advanced Technology",
      description: language === "vi"
        ? "Tiếp cận công nghệ laser hàng đầu thế giới, thiết bị hiện đại"
        : "Access to world-leading laser technology, modern equipment"
    },
    {
      icon: Target,
      title: language === "vi" ? "Cơ hội thăng tiến" : "Career Growth",
      description: language === "vi"
        ? "Lộ trình thăng tiến rõ ràng, đánh giá công bằng và minh bạch"
        : "Clear career path, fair and transparent evaluation"
    },
  ];

  const getJobTypeLabel = (type: string) => {
    const labels: Record<string, { vi: string; en: string; ja: string; zh: string }> = {
      "full-time": { vi: "Toàn thời gian", en: "Full-time", ja: "フルタイム", zh: "全职" },
      "part-time": { vi: "Bán thời gian", en: "Part-time", ja: "パートタイム", zh: "兼职" },
      "contract": { vi: "Hợp đồng", en: "Contract", ja: "契約", zh: "合同" },
      "internship": { vi: "Thực tập", en: "Internship", ja: "インターンシップ", zh: "实习" },
    };
    return labels[type]?.[language] || type;
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary/90 to-chart-1 text-primary-foreground py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/hero-banner.jpg')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-transparent" />
        <div className="container relative z-10">
          <div className="max-w-3xl">
            <Badge className="mb-4 bg-chart-1 text-white">
              {language === "vi" ? "Gia nhập đội ngũ" : "Join Our Team"}
            </Badge>
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">
              {language === "vi" 
                ? "Xây Dựng Tương Lai Cùng Dreamweldtech" 
                : "Build The Future With Dreamweldtech"}
            </h1>
            <p className="text-xl text-primary-foreground/80 mb-8">
              {language === "vi"
                ? "Chúng tôi đang tìm kiếm những tài năng đam mê công nghệ laser và tự động hóa. Hãy cùng chúng tôi tạo nên những giải pháp đột phá cho ngành công nghiệp."
                : "We are looking for talents passionate about laser technology and automation. Join us in creating breakthrough solutions for the industry."}
            </p>
            <div className="flex gap-4">
              <Button size="lg" variant="secondary" asChild>
                <a href="#positions">
                  {language === "vi" ? "Xem vị trí tuyển dụng" : "View Open Positions"}
                  <ChevronRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Join Us */}
      <section className="py-20 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-12">
            <Badge className="mb-4">{language === "vi" ? "Quyền lợi" : "Benefits"}</Badge>
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              {language === "vi" ? "Tại Sao Chọn Dreamweldtech?" : "Why Choose Dreamweldtech?"}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {language === "vi"
                ? "Chúng tôi cam kết mang đến môi trường làm việc tốt nhất và cơ hội phát triển cho mỗi thành viên"
                : "We are committed to providing the best working environment and development opportunities for each member"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section id="positions" className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <Badge className="mb-4">{language === "vi" ? "Cơ hội việc làm" : "Job Opportunities"}</Badge>
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              {language === "vi" ? "Vị Trí Đang Tuyển" : "Open Positions"}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {language === "vi"
                ? "Khám phá các cơ hội việc làm phù hợp với bạn"
                : "Explore job opportunities that suit you"}
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">{language === "vi" ? "Đang tải..." : "Loading..."}</p>
            </div>
          ) : jobs && jobs.length > 0 ? (
            <div className="space-y-4">
              {jobs.map((job) => (
                <Card key={job.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold">{job.title}</h3>
                          <Badge variant="secondary">{getJobTypeLabel(job.type || "full-time")}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          {job.department && (
                            <div className="flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              {job.department}
                            </div>
                          )}
                          {job.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {job.location}
                            </div>
                          )}
                          {job.experience && (
                            <div className="flex items-center gap-1">
                              <Briefcase className="h-4 w-4" />
                              {job.experience}
                            </div>
                          )}
                          {job.salary && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              {job.salary}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button asChild>
                        <Link href={`/careers/${job.slug}`}>
                          {language === "vi" ? "Xem chi tiết" : "View Details"}
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {language === "vi" ? "Chưa có vị trí tuyển dụng" : "No Open Positions"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {language === "vi"
                    ? "Hiện tại chúng tôi chưa có vị trí nào đang tuyển. Vui lòng quay lại sau hoặc gửi CV của bạn để chúng tôi liên hệ khi có cơ hội phù hợp."
                    : "We currently don't have any open positions. Please check back later or send your CV for future opportunities."}
                </p>
                <Button variant="outline" asChild>
                  <Link href="/contact">
                    {language === "vi" ? "Gửi CV" : "Send CV"}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            {language === "vi" ? "Sẵn Sàng Gia Nhập?" : "Ready to Join?"}
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            {language === "vi"
              ? "Nếu bạn không tìm thấy vị trí phù hợp, hãy gửi CV của bạn. Chúng tôi luôn tìm kiếm những tài năng xuất sắc."
              : "If you don't find a suitable position, send us your CV. We are always looking for outstanding talents."}
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/contact">
                {language === "vi" ? "Liên hệ ngay" : "Contact Us"}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
