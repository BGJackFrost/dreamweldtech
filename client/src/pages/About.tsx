import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Award, 
  Users, 
  Target, 
  Lightbulb, 
  CheckCircle, 
  ArrowRight,
  Factory,
  Globe,
  Wrench
} from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";

const milestones = [
  { year: "2015", title: "Thành Lập", description: "Dreamweldtech được thành lập với sứ mệnh mang công nghệ laser tiên tiến đến Việt Nam." },
  { year: "2017", title: "Mở Rộng", description: "Mở rộng nhà máy sản xuất và trung tâm R&D tại Khu Công Nghệ Cao." },
  { year: "2019", title: "Đối Tác Quốc Tế", description: "Hợp tác chiến lược với các nhà sản xuất nguồn laser hàng đầu thế giới." },
  { year: "2021", title: "Chứng Nhận ISO", description: "Đạt chứng nhận ISO 9001:2015 về hệ thống quản lý chất lượng." },
  { year: "2023", title: "Dẫn Đầu Thị Trường", description: "Trở thành nhà cung cấp giải pháp laser hàng đầu tại Việt Nam." },
];

const values = [
  {
    icon: Target,
    title: "Chất Lượng",
    description: "Cam kết cung cấp sản phẩm và dịch vụ chất lượng cao nhất, đáp ứng tiêu chuẩn quốc tế.",
  },
  {
    icon: Lightbulb,
    title: "Đổi Mới",
    description: "Không ngừng nghiên cứu và phát triển để mang đến những giải pháp công nghệ tiên tiến nhất.",
  },
  {
    icon: Users,
    title: "Khách Hàng",
    description: "Đặt lợi ích khách hàng làm trung tâm, xây dựng mối quan hệ đối tác lâu dài và bền vững.",
  },
  {
    icon: Award,
    title: "Uy Tín",
    description: "Xây dựng uy tín thông qua sự minh bạch, trung thực và cam kết thực hiện đúng lời hứa.",
  },
];

const stats = [
  { value: "500+", label: "Khách Hàng" },
  { value: "1000+", label: "Máy Đã Bán" },
  { value: "50+", label: "Kỹ Sư" },
  { value: "8+", label: "Năm Kinh Nghiệm" },
];

export default function About() {
  useEffect(() => {
    document.title = "Giới Thiệu - Dreamweldtech | Công Ty Công Nghệ Laser";
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="bg-primary text-white py-20">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-1 bg-chart-1/20 text-chart-1 text-sm font-bold uppercase tracking-wider rounded mb-4">
                Về Chúng Tôi
              </span>
              <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase mb-6">
                Dreamweldtech - <span className="text-chart-1">Đối Tác</span> Công Nghệ Laser Của Bạn
              </h1>
              <p className="text-lg text-white/80 mb-8">
                Với hơn 8 năm kinh nghiệm trong ngành công nghệ laser, Dreamweldtech tự hào là đơn vị tiên phong 
                cung cấp các giải pháp máy hàn, cắt và làm sạch laser chất lượng cao tại Việt Nam.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/products">
                  <Button size="lg" className="bg-chart-1 hover:bg-chart-1/90">
                    Xem Sản Phẩm
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
                    Liên Hệ Ngay
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <img
                src="/images/about-factory.jpg"
                alt="Dreamweldtech Factory"
                className="rounded-lg shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-chart-1 text-white p-6 rounded-lg">
                <p className="text-4xl font-heading font-bold">8+</p>
                <p className="text-sm uppercase">Năm Kinh Nghiệm</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-secondary/50">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-4xl md:text-5xl font-heading font-bold text-primary">{stat.value}</p>
                <p className="text-muted-foreground uppercase tracking-wider text-sm mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-primary/10 rounded">
                    <Target className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-heading font-bold uppercase">Sứ Mệnh</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Mang đến cho doanh nghiệp Việt Nam những giải pháp công nghệ laser tiên tiến nhất, 
                  giúp nâng cao năng suất, chất lượng sản phẩm và khả năng cạnh tranh trên thị trường quốc tế. 
                  Chúng tôi cam kết đồng hành cùng khách hàng trong hành trình chuyển đổi số và hiện đại hóa sản xuất.
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-chart-1">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-chart-1/10 rounded">
                    <Lightbulb className="h-8 w-8 text-chart-1" />
                  </div>
                  <h2 className="text-2xl font-heading font-bold uppercase">Tầm Nhìn</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Trở thành đơn vị dẫn đầu Đông Nam Á trong lĩnh vực cung cấp giải pháp công nghệ laser 
                  cho ngành công nghiệp. Xây dựng hệ sinh thái toàn diện từ tư vấn, cung cấp thiết bị, 
                  đào tạo đến hỗ trợ kỹ thuật, đáp ứng mọi nhu cầu của khách hàng.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-primary text-white">
        <div className="container">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1 bg-chart-1/20 text-chart-1 text-sm font-bold uppercase tracking-wider rounded mb-4">
              Giá Trị Cốt Lõi
            </span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold uppercase">
              Những Giá Trị <span className="text-chart-1">Định Hướng</span> Chúng Tôi
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-chart-1 rounded-full flex items-center justify-center mx-auto mb-4">
                  <value.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-heading font-bold mb-3 uppercase">{value.title}</h3>
                <p className="text-white/70">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Milestones */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1 bg-primary/10 text-primary text-sm font-bold uppercase tracking-wider rounded mb-4">
              Hành Trình
            </span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold uppercase">
              Các <span className="text-chart-1">Cột Mốc</span> Quan Trọng
            </h2>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-secondary hidden md:block"></div>
            
            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div key={index} className={`flex items-center gap-8 ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}>
                  <div className={`flex-1 ${index % 2 === 0 ? "md:text-right" : "md:text-left"}`}>
                    <Card className="inline-block">
                      <CardContent className="p-6">
                        <span className="text-chart-1 font-heading font-bold text-2xl">{milestone.year}</span>
                        <h3 className="font-heading font-bold text-lg mt-2">{milestone.title}</h3>
                        <p className="text-muted-foreground mt-2">{milestone.description}</p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="hidden md:flex w-12 h-12 bg-primary rounded-full items-center justify-center z-10">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1 bg-primary/10 text-primary text-sm font-bold uppercase tracking-wider rounded mb-4">
              Tại Sao Chọn Chúng Tôi
            </span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold uppercase">
              Lý Do <span className="text-chart-1">Hợp Tác</span> Với Dreamweldtech
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardContent className="p-8">
                <Factory className="h-12 w-12 text-chart-1 mx-auto mb-4" />
                <h3 className="font-heading font-bold text-xl mb-3 uppercase">Sản Phẩm Chính Hãng</h3>
                <p className="text-muted-foreground">
                  100% sản phẩm chính hãng từ các thương hiệu uy tín như IPG, Raytools, với đầy đủ chứng nhận và bảo hành.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-8">
                <Wrench className="h-12 w-12 text-chart-1 mx-auto mb-4" />
                <h3 className="font-heading font-bold text-xl mb-3 uppercase">Hỗ Trợ Kỹ Thuật 24/7</h3>
                <p className="text-muted-foreground">
                  Đội ngũ kỹ sư giàu kinh nghiệm sẵn sàng hỗ trợ từ xa và tại chỗ, đảm bảo máy móc hoạt động ổn định.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-8">
                <Globe className="h-12 w-12 text-chart-1 mx-auto mb-4" />
                <h3 className="font-heading font-bold text-xl mb-3 uppercase">Mạng Lưới Rộng Khắp</h3>
                <p className="text-muted-foreground">
                  Hệ thống đại lý và trung tâm bảo hành trải dài từ Bắc vào Nam, phục vụ khách hàng nhanh chóng.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white uppercase mb-6">
            Sẵn Sàng <span className="text-chart-1">Hợp Tác</span>?
          </h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            Liên hệ với chúng tôi ngay hôm nay để được tư vấn giải pháp công nghệ laser phù hợp nhất cho doanh nghiệp của bạn.
          </p>
          <Link href="/contact">
            <Button size="lg" className="bg-chart-1 hover:bg-chart-1/90">
              Liên Hệ Ngay
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
