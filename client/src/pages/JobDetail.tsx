import { useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { FileUpload } from "@/components/FileUpload";
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  DollarSign, 
  Building2,
  ChevronLeft,
  Send,
  CheckCircle,
  FileText,
  User,
  Mail,
  Phone,
  Loader2,
  Upload
} from "lucide-react";

export default function JobDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const { data: job, isLoading } = trpc.jobs.getBySlug.useQuery({ slug: slug || "" });
  const submitApplication = trpc.jobApplications.submit.useMutation();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    coverLetter: "",
    resumeUrl: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (job) {
      document.title = `${job.title} | ${language === "vi" ? "Tuyển Dụng" : "Careers"} | Dreamweldtech`;
    }
  }, [job, language]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;

    setIsSubmitting(true);
    try {
      await submitApplication.mutateAsync({
        jobId: job.id,
        ...formData,
      });
      setSubmitted(true);
      toast.success(language === "vi" ? "Đơn ứng tuyển đã được gửi thành công!" : "Application submitted successfully!");
    } catch (error) {
      toast.error(language === "vi" ? "Có lỗi xảy ra. Vui lòng thử lại." : "An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getJobTypeLabel = (type: string) => {
    const labels: Record<string, { vi: string; en: string }> = {
      "full-time": { vi: "Toàn thời gian", en: "Full-time" },
      "part-time": { vi: "Bán thời gian", en: "Part-time" },
      "contract": { vi: "Hợp đồng", en: "Contract" },
      "internship": { vi: "Thực tập", en: "Internship" },
    };
    return labels[type]?.[language] || type;
  };

  if (isLoading) {
    return (
      <div className="container py-20 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-muted-foreground">{language === "vi" ? "Đang tải..." : "Loading..."}</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">
          {language === "vi" ? "Không tìm thấy vị trí tuyển dụng" : "Job Not Found"}
        </h1>
        <Button asChild>
          <Link href="/careers">
            <ChevronLeft className="mr-2 h-4 w-4" />
            {language === "vi" ? "Quay lại" : "Go Back"}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-br from-primary via-primary/90 to-chart-1 text-primary-foreground py-16">
        <div className="container">
          <Button variant="ghost" className="text-primary-foreground/80 hover:text-primary-foreground mb-4" asChild>
            <Link href="/careers">
              <ChevronLeft className="mr-2 h-4 w-4" />
              {language === "vi" ? "Tất cả vị trí" : "All Positions"}
            </Link>
          </Button>
          <div className="flex items-center gap-2 mb-4">
            <h1 className="text-3xl md:text-4xl font-heading font-bold">{job.title}</h1>
            <Badge className="bg-chart-1 text-white">{getJobTypeLabel(job.type || "full-time")}</Badge>
          </div>
          <div className="flex flex-wrap gap-4 text-primary-foreground/80">
            {job.department && (
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {job.department}
              </div>
            )}
            {job.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {job.location}
              </div>
            )}
            {job.experience && (
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                {job.experience}
              </div>
            )}
            {job.salary && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {job.salary}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Job Details */}
            <div className="lg:col-span-2 space-y-8">
              {job.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>{language === "vi" ? "Mô tả công việc" : "Job Description"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none whitespace-pre-line">
                      {job.description}
                    </div>
                  </CardContent>
                </Card>
              )}

              {job.requirements && (
                <Card>
                  <CardHeader>
                    <CardTitle>{language === "vi" ? "Yêu cầu" : "Requirements"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none whitespace-pre-line">
                      {job.requirements}
                    </div>
                  </CardContent>
                </Card>
              )}

              {job.benefits && (
                <Card>
                  <CardHeader>
                    <CardTitle>{language === "vi" ? "Quyền lợi" : "Benefits"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none whitespace-pre-line">
                      {job.benefits}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Application Form */}
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    {language === "vi" ? "Ứng tuyển ngay" : "Apply Now"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {submitted ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        {language === "vi" ? "Đã gửi thành công!" : "Successfully Submitted!"}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {language === "vi"
                          ? "Cảm ơn bạn đã ứng tuyển. Chúng tôi sẽ liên hệ với bạn sớm nhất."
                          : "Thank you for applying. We will contact you soon."}
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="name" className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {language === "vi" ? "Họ và tên *" : "Full Name *"}
                        </Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          placeholder={language === "vi" ? "Nhập họ và tên" : "Enter your name"}
                        />
                      </div>

                      <div>
                        <Label htmlFor="email" className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          placeholder={language === "vi" ? "Nhập email" : "Enter your email"}
                        />
                      </div>

                      <div>
                        <Label htmlFor="phone" className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {language === "vi" ? "Số điện thoại" : "Phone Number"}
                        </Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder={language === "vi" ? "Nhập số điện thoại" : "Enter your phone"}
                        />
                      </div>

                      {/* CV Upload */}
                      <div>
                        <Label className="flex items-center gap-2 mb-2">
                          <Upload className="h-4 w-4" />
                          {language === "vi" ? "CV/Hồ sơ" : "Resume/CV"}
                        </Label>
                        <FileUpload
                          accept=".pdf,.doc,.docx"
                          maxSize={5}
                          onFileSelect={() => {}}
                          onUploadComplete={(url) => setFormData({ ...formData, resumeUrl: url })}
                          label={language === "vi" ? "Tải lên CV" : "Upload Resume"}
                          hint={language === "vi" ? "PDF, DOC, DOCX (tối đa 5MB)" : "PDF, DOC, DOCX (max 5MB)"}
                        />
                      </div>

                      <div>
                        <Label htmlFor="coverLetter" className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {language === "vi" ? "Thư xin việc" : "Cover Letter"}
                        </Label>
                        <Textarea
                          id="coverLetter"
                          value={formData.coverLetter}
                          onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                          placeholder={language === "vi" 
                            ? "Giới thiệu bản thân và lý do bạn phù hợp với vị trí này..." 
                            : "Introduce yourself and why you're a good fit..."}
                          rows={5}
                        />
                      </div>

                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {language === "vi" ? "Đang gửi..." : "Submitting..."}
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            {language === "vi" ? "Gửi đơn ứng tuyển" : "Submit Application"}
                          </>
                        )}
                      </Button>

                      <p className="text-xs text-muted-foreground text-center">
                        {language === "vi"
                          ? "Bằng việc gửi đơn, bạn đồng ý với chính sách bảo mật của chúng tôi."
                          : "By submitting, you agree to our privacy policy."}
                      </p>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
