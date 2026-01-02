import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Send,
  Facebook,
  Linkedin,
  Youtube,
  MessageCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    subject: "",
    message: "",
  });

  const submitMutation = trpc.contacts.submit.useMutation({
    onSuccess: () => {
      toast.success("Tin nhắn đã được gửi thành công! Chúng tôi sẽ liên hệ với bạn sớm.");
      setFormData({ name: "", email: "", phone: "", company: "", subject: "", message: "" });
    },
    onError: (error) => {
      toast.error("Lỗi: " + error.message);
    },
  });

  useEffect(() => {
    document.title = "Liên Hệ - Dreamweldtech | Tư Vấn Công Nghệ Laser";
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }
    submitMutation.mutate({
      ...formData,
      requestType: "contact",
    });
  };

  return (
    <>
      {/* Hero Section */}
      <section className="bg-primary text-white py-16">
        <div className="container">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-1 bg-chart-1/20 text-chart-1 text-sm font-bold uppercase tracking-wider rounded mb-4">
              Liên Hệ
            </span>
            <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase mb-4">
              Kết Nối Với <span className="text-chart-1">Dreamweldtech</span>
            </h1>
            <p className="text-lg text-white/80">
              Đội ngũ tư vấn của chúng tôi sẵn sàng hỗ trợ bạn 24/7. Hãy liên hệ ngay để được tư vấn giải pháp công nghệ laser phù hợp nhất.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-12 -mt-8">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-t-4 border-t-chart-1">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-chart-1/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-6 w-6 text-chart-1" />
                </div>
                <h3 className="font-heading font-bold mb-2">Hotline</h3>
                <p className="text-primary font-bold">+84 123 456 789</p>
                <p className="text-sm text-muted-foreground mt-1">Gọi ngay để được tư vấn</p>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-primary">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-heading font-bold mb-2">Email</h3>
                <p className="text-primary font-bold">contact@dreamweldtech.com</p>
                <p className="text-sm text-muted-foreground mt-1">Phản hồi trong 24h</p>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-chart-1">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-chart-1/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-6 w-6 text-chart-1" />
                </div>
                <h3 className="font-heading font-bold mb-2">Địa Chỉ</h3>
                <p className="text-sm text-muted-foreground">Khu Công Nghệ Cao, Quận 9, TP. Hồ Chí Minh</p>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-t-primary">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-heading font-bold mb-2">Giờ Làm Việc</h3>
                <p className="text-sm text-muted-foreground">Thứ 2 - Thứ 7</p>
                <p className="text-sm text-muted-foreground">8:00 - 17:30</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Form & Map */}
      <section className="py-16">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-2xl font-heading font-bold uppercase mb-6">
                Gửi <span className="text-chart-1">Tin Nhắn</span>
              </h2>
              <Card>
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Họ Tên *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Nguyễn Văn A"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="email@company.com"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Số Điện Thoại</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="0912 345 678"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company">Công Ty</Label>
                        <Input
                          id="company"
                          value={formData.company}
                          onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                          placeholder="Tên công ty"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Chủ Đề</Label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="VD: Tư vấn máy hàn laser"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Nội Dung *</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="Mô tả chi tiết yêu cầu của bạn..."
                        rows={5}
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-chart-1 hover:bg-chart-1/90"
                      disabled={submitMutation.isPending}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {submitMutation.isPending ? "Đang gửi..." : "Gửi Tin Nhắn"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Map & Additional Info */}
            <div>
              <h2 className="text-2xl font-heading font-bold uppercase mb-6">
                Vị Trí <span className="text-chart-1">Của Chúng Tôi</span>
              </h2>
              
              {/* Map Placeholder */}
              <div className="bg-secondary rounded-lg h-80 mb-6 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Khu Công Nghệ Cao</p>
                  <p className="text-muted-foreground">Quận 9, TP. Hồ Chí Minh</p>
                </div>
              </div>

              {/* Social Media */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-heading font-bold mb-4 uppercase">Kết Nối Với Chúng Tôi</h3>
                  <div className="flex gap-4">
                    <a href="#" className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                      <Facebook className="h-6 w-6" />
                    </a>
                    <a href="#" className="w-12 h-12 bg-blue-700 text-white rounded-full flex items-center justify-center hover:bg-blue-800 transition-colors">
                      <Linkedin className="h-6 w-6" />
                    </a>
                    <a href="#" className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors">
                      <Youtube className="h-6 w-6" />
                    </a>
                    <a href="#" className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors">
                      <MessageCircle className="h-6 w-6" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-heading font-bold uppercase">
              Câu Hỏi <span className="text-chart-1">Thường Gặp</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-heading font-bold mb-2">Thời gian bảo hành là bao lâu?</h3>
                <p className="text-muted-foreground text-sm">
                  Tất cả sản phẩm của Dreamweldtech được bảo hành từ 12-24 tháng tùy theo dòng máy, 
                  với dịch vụ hỗ trợ kỹ thuật trọn đời.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-heading font-bold mb-2">Có hỗ trợ lắp đặt và đào tạo không?</h3>
                <p className="text-muted-foreground text-sm">
                  Chúng tôi cung cấp dịch vụ lắp đặt tại chỗ và đào tạo vận hành miễn phí 
                  cho tất cả khách hàng mua máy.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-heading font-bold mb-2">Có thể xem demo máy trước khi mua không?</h3>
                <p className="text-muted-foreground text-sm">
                  Có, quý khách có thể đến showroom của chúng tôi để xem demo trực tiếp 
                  hoặc yêu cầu demo tại nhà máy của mình.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-heading font-bold mb-2">Phương thức thanh toán như thế nào?</h3>
                <p className="text-muted-foreground text-sm">
                  Chúng tôi hỗ trợ nhiều phương thức thanh toán linh hoạt: chuyển khoản, 
                  trả góp, và thanh toán theo tiến độ.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-white">
        <div className="container text-center">
          <h2 className="text-3xl font-heading font-bold uppercase mb-4">
            Cần Hỗ Trợ <span className="text-chart-1">Ngay</span>?
          </h2>
          <p className="text-white/80 mb-6">
            Gọi ngay hotline để được tư vấn trực tiếp từ đội ngũ chuyên gia của chúng tôi.
          </p>
          <a href="tel:+84123456789">
            <Button size="lg" className="bg-chart-1 hover:bg-chart-1/90">
              <Phone className="h-5 w-5 mr-2" />
              +84 123 456 789
            </Button>
          </a>
        </div>
      </section>
    </>
  );
}
