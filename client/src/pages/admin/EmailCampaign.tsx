import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Send, 
  Mail, 
  Users, 
  FileText, 
  Eye,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Clock,
  MailOpen,
  MousePointer
} from "lucide-react";
import { toast } from "sonner";

interface CampaignTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
}

const defaultTemplates: CampaignTemplate[] = [
  {
    id: "new-product",
    name: "Sản phẩm mới",
    subject: "🆕 Dreamweldtech ra mắt sản phẩm mới!",
    content: `Kính gửi Quý khách hàng,

Dreamweldtech vui mừng thông báo ra mắt sản phẩm mới:

[TÊN SẢN PHẨM]

Đặc điểm nổi bật:
• Công nghệ laser tiên tiến nhất
• Hiệu suất vượt trội, tiết kiệm năng lượng
• Độ chính xác cao, bền bỉ

Liên hệ ngay để nhận báo giá ưu đãi!

Trân trọng,
Đội ngũ Dreamweldtech`
  },
  {
    id: "promotion",
    name: "Khuyến mãi",
    subject: "🎉 Ưu đãi đặc biệt từ Dreamweldtech!",
    content: `Kính gửi Quý khách hàng,

Dreamweldtech gửi đến bạn chương trình ưu đãi đặc biệt:

🎁 GIẢM GIÁ LÊN ĐẾN [X]%
⏰ Thời gian: [NGÀY BẮT ĐẦU] - [NGÀY KẾT THÚC]

Áp dụng cho:
• Máy hàn laser
• Máy cắt laser
• Máy làm sạch laser

Đừng bỏ lỡ cơ hội này!

Trân trọng,
Đội ngũ Dreamweldtech`
  },
  {
    id: "newsletter",
    name: "Bản tin hàng tháng",
    subject: "📰 Bản tin Dreamweldtech tháng [THÁNG]",
    content: `Kính gửi Quý khách hàng,

Chào mừng bạn đến với bản tin hàng tháng của Dreamweldtech!

📌 TIN NỔI BẬT
[Nội dung tin tức]

🔧 MẸO SỬ DỤNG
[Mẹo bảo trì máy laser]

🏆 DỰ ÁN TIÊU BIỂU
[Giới thiệu case study]

Cảm ơn bạn đã đồng hành cùng Dreamweldtech!

Trân trọng,
Đội ngũ Dreamweldtech`
  },
  {
    id: "custom",
    name: "Tùy chỉnh",
    subject: "",
    content: ""
  }
];

export default function AdminEmailCampaign() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("custom");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const { data: subscribers } = trpc.newsletter.list.useQuery();
  const activeSubscribers = subscribers?.filter(s => s.status === "active") || [];

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = defaultTemplates.find(t => t.id === templateId);
    if (template && templateId !== "custom") {
      setSubject(template.subject);
      setContent(template.content);
    }
  };

  const handleSendCampaign = async () => {
    if (!subject.trim()) {
      toast.error("Vui lòng nhập tiêu đề email");
      return;
    }
    if (!content.trim()) {
      toast.error("Vui lòng nhập nội dung email");
      return;
    }
    if (activeSubscribers.length === 0) {
      toast.error("Không có subscriber nào để gửi email");
      return;
    }

    setIsSending(true);
    
    // Simulate sending (in production, this would call an API)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast.success(`Đã gửi email đến ${activeSubscribers.length} subscribers!`, {
      description: "Email sẽ được gửi trong vài phút tới."
    });
    
    setIsSending(false);
  };

  const generatePreviewHTML = () => {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0f4c81 0%, #00bcd4 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">DREAMWELDTECH</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0;">Công nghệ laser hàng đầu</p>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
          <h2 style="color: #0f4c81; margin-top: 0;">${subject}</h2>
          <div style="white-space: pre-line; line-height: 1.6; color: #333;">
            ${content}
          </div>
        </div>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0; border-top: none;">
          <p style="margin: 0; color: #666; font-size: 12px;">
            © 2026 Dreamweldtech. All rights reserved.<br/>
            <a href="#" style="color: #0f4c81;">Hủy đăng ký</a>
          </p>
        </div>
      </div>
    `;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Email Marketing</h1>
        <p className="text-muted-foreground">
          Gửi email newsletter đến subscribers của bạn
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{subscribers?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Tổng subscribers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeSubscribers.length}</p>
              <p className="text-sm text-muted-foreground">Đang hoạt động</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <MailOpen className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">--</p>
              <p className="text-sm text-muted-foreground">Tỷ lệ mở</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <MousePointer className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">--</p>
              <p className="text-sm text-muted-foreground">Tỷ lệ click</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email Composer */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Soạn Email
              </CardTitle>
              <CardDescription>
                Tạo và gửi email đến {activeSubscribers.length} subscribers đang hoạt động
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Mẫu email</Label>
                <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn mẫu email" />
                  </SelectTrigger>
                  <SelectContent>
                    {defaultTemplates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          {template.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="subject">Tiêu đề email *</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Nhập tiêu đề email..."
                />
              </div>

              <div>
                <Label htmlFor="content">Nội dung email *</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Nhập nội dung email..."
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPreviewMode(!previewMode)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {previewMode ? "Ẩn xem trước" : "Xem trước"}
                </Button>
                <Button
                  onClick={handleSendCampaign}
                  disabled={isSending || activeSubscribers.length === 0}
                  className="flex-1"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Gửi đến {activeSubscribers.length} subscribers
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          {previewMode && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Xem Trước Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="border rounded-lg overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: generatePreviewHTML() }}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hướng Dẫn</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold shrink-0 text-xs">
                  1
                </div>
                <p className="text-muted-foreground">
                  Chọn mẫu email có sẵn hoặc tạo nội dung tùy chỉnh
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold shrink-0 text-xs">
                  2
                </div>
                <p className="text-muted-foreground">
                  Chỉnh sửa tiêu đề và nội dung theo ý muốn
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold shrink-0 text-xs">
                  3
                </div>
                <p className="text-muted-foreground">
                  Xem trước email trước khi gửi
                </p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold shrink-0 text-xs">
                  4
                </div>
                <p className="text-muted-foreground">
                  Nhấn "Gửi" để gửi email đến tất cả subscribers
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                Lưu Ý
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Email sẽ được gửi đến tất cả subscribers đang hoạt động</p>
              <p>• Không thể thu hồi email sau khi gửi</p>
              <p>• Nên xem trước email trước khi gửi</p>
              <p>• Tránh gửi email quá thường xuyên (tối đa 2-3 lần/tuần)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tích Hợp Nâng Cao</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline">Sắp ra mắt</Badge>
                </div>
                <p className="text-sm font-medium">SendGrid Integration</p>
                <p className="text-xs text-muted-foreground">
                  Gửi email hàng loạt với tracking chi tiết
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline">Sắp ra mắt</Badge>
                </div>
                <p className="text-sm font-medium">Mailchimp Integration</p>
                <p className="text-xs text-muted-foreground">
                  Tự động hóa email marketing campaigns
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
