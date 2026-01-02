import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowRight, 
  CheckCircle,
  Factory,
  Car,
  Ship,
  Plane,
  Building2,
  Cog,
  Zap,
  Shield
} from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";

const industries = [
  {
    icon: Car,
    title: "Ô Tô & Xe Máy",
    description: "Giải pháp hàn laser cho khung xe, bộ phận động cơ, hệ thống xả và các chi tiết chính xác cao.",
    applications: ["Hàn khung gầm", "Hàn bình xăng", "Hàn ống xả", "Hàn bộ phận động cơ"],
  },
  {
    icon: Ship,
    title: "Đóng Tàu",
    description: "Công nghệ hàn và cắt laser cho ngành đóng tàu, đảm bảo độ bền và chống ăn mòn.",
    applications: ["Hàn vỏ tàu", "Cắt tấm thép dày", "Hàn đường ống", "Làm sạch bề mặt"],
  },
  {
    icon: Plane,
    title: "Hàng Không",
    description: "Giải pháp laser chính xác cao cho các bộ phận hàng không với yêu cầu nghiêm ngặt.",
    applications: ["Hàn cánh máy bay", "Cắt hợp kim titan", "Làm sạch động cơ", "Hàn thân máy bay"],
  },
  {
    icon: Building2,
    title: "Xây Dựng & Nội Thất",
    description: "Cắt và hàn laser cho ngành xây dựng, sản xuất cửa, lan can và đồ nội thất kim loại.",
    applications: ["Cắt tấm trang trí", "Hàn khung cửa", "Cắt lan can", "Hàn đồ nội thất"],
  },
  {
    icon: Cog,
    title: "Cơ Khí Chính Xác",
    description: "Gia công chính xác cao cho các chi tiết máy, khuôn mẫu và linh kiện công nghiệp.",
    applications: ["Hàn khuôn mẫu", "Cắt chi tiết nhỏ", "Sửa chữa khuôn", "Hàn vi mạch"],
  },
  {
    icon: Zap,
    title: "Điện & Điện Tử",
    description: "Giải pháp hàn laser cho pin, mạch điện và các thiết bị điện tử công nghệ cao.",
    applications: ["Hàn pin lithium", "Hàn mạch PCB", "Hàn cảm biến", "Hàn connector"],
  },
];

const solutions = [
  {
    title: "Giải Pháp Hàn Laser",
    description: "Công nghệ hàn laser tiên tiến với độ chính xác cao, vùng ảnh hưởng nhiệt nhỏ, tốc độ nhanh và chất lượng mối hàn vượt trội.",
    features: [
      "Hàn không tiếp xúc, không biến dạng",
      "Tốc độ hàn nhanh gấp 3-5 lần hàn truyền thống",
      "Mối hàn đẹp, không cần xử lý sau",
      "Phù hợp nhiều loại vật liệu",
    ],
    image: "/images/product-laser-welder.jpg",
  },
  {
    title: "Giải Pháp Cắt Laser",
    description: "Hệ thống cắt laser fiber công suất cao, cắt được nhiều loại kim loại với độ chính xác và tốc độ vượt trội.",
    features: [
      "Cắt kim loại dày đến 30mm",
      "Độ chính xác ±0.05mm",
      "Cạnh cắt mịn, không ba via",
      "Tiết kiệm vật liệu tối đa",
    ],
    image: "/images/product-laser-cutter.jpg",
  },
  {
    title: "Giải Pháp Làm Sạch Laser",
    description: "Công nghệ làm sạch bề mặt bằng laser, loại bỏ rỉ sét, sơn, dầu mỡ mà không làm hư hại bề mặt gốc.",
    features: [
      "Làm sạch không tiếp xúc",
      "Thân thiện môi trường",
      "Không cần hóa chất",
      "Bảo vệ bề mặt gốc",
    ],
    image: "/images/product-laser-cleaner.jpg",
  },
];

export default function Solutions() {
  useEffect(() => {
    document.title = "Giải Pháp - Dreamweldtech | Ứng Dụng Công Nghệ Laser";
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="bg-primary text-white py-20">
        <div className="container">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-1 bg-chart-1/20 text-chart-1 text-sm font-bold uppercase tracking-wider rounded mb-4">
              Giải Pháp
            </span>
            <h1 className="text-4xl md:text-5xl font-heading font-bold uppercase mb-6">
              Giải Pháp <span className="text-chart-1">Công Nghệ Laser</span> Toàn Diện
            </h1>
            <p className="text-lg text-white/80 mb-8">
              Dreamweldtech cung cấp các giải pháp công nghệ laser tùy chỉnh cho mọi ngành công nghiệp, 
              từ ô tô, hàng không đến điện tử và cơ khí chính xác.
            </p>
            <Link href="/contact">
              <Button size="lg" className="bg-chart-1 hover:bg-chart-1/90">
                Tư Vấn Giải Pháp
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Solutions Overview */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1 bg-primary/10 text-primary text-sm font-bold uppercase tracking-wider rounded mb-4">
              Giải Pháp Chính
            </span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold uppercase">
              Ba <span className="text-chart-1">Công Nghệ</span> Cốt Lõi
            </h2>
          </div>

          <div className="space-y-16">
            {solutions.map((solution, index) => (
              <div key={index} className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? "lg:flex-row-reverse" : ""}`}>
                <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                  <h3 className="text-2xl font-heading font-bold uppercase mb-4">{solution.title}</h3>
                  <p className="text-muted-foreground mb-6">{solution.description}</p>
                  <ul className="space-y-3 mb-6">
                    {solution.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-chart-1 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/products">
                    <Button>
                      Xem Sản Phẩm
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
                <div className={index % 2 === 1 ? "lg:order-1" : ""}>
                  <img
                    src={solution.image}
                    alt={solution.title}
                    className="rounded-lg shadow-xl"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="py-20 bg-secondary/30">
        <div className="container">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1 bg-primary/10 text-primary text-sm font-bold uppercase tracking-wider rounded mb-4">
              Ngành Công Nghiệp
            </span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold uppercase">
              Ứng Dụng <span className="text-chart-1">Đa Ngành</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              Công nghệ laser của chúng tôi được ứng dụng rộng rãi trong nhiều ngành công nghiệp khác nhau.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {industries.map((industry, index) => (
              <Card key={index} className="group hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-chart-1 transition-colors">
                    <industry.icon className="h-7 w-7 text-primary group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-xl font-heading font-bold mb-3">{industry.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{industry.description}</p>
                  <div className="border-t pt-4">
                    <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Ứng dụng:</p>
                    <div className="flex flex-wrap gap-2">
                      {industry.applications.map((app, i) => (
                        <span key={i} className="text-xs bg-secondary px-2 py-1 rounded">
                          {app}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-primary text-white">
        <div className="container">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1 bg-chart-1/20 text-chart-1 text-sm font-bold uppercase tracking-wider rounded mb-4">
              Lợi Ích
            </span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold uppercase">
              Tại Sao Chọn <span className="text-chart-1">Công Nghệ Laser</span>?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-chart-1 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-heading font-bold text-lg mb-2 uppercase">Tốc Độ Cao</h3>
              <p className="text-white/70 text-sm">Nhanh gấp 3-5 lần so với phương pháp truyền thống</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-chart-1 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-heading font-bold text-lg mb-2 uppercase">Chất Lượng Cao</h3>
              <p className="text-white/70 text-sm">Độ chính xác ±0.05mm, mối hàn/cắt hoàn hảo</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-chart-1 rounded-full flex items-center justify-center mx-auto mb-4">
                <Factory className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-heading font-bold text-lg mb-2 uppercase">Tự Động Hóa</h3>
              <p className="text-white/70 text-sm">Dễ dàng tích hợp vào dây chuyền sản xuất tự động</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-chart-1 rounded-full flex items-center justify-center mx-auto mb-4">
                <Cog className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-heading font-bold text-lg mb-2 uppercase">Linh Hoạt</h3>
              <p className="text-white/70 text-sm">Xử lý được nhiều loại vật liệu và ứng dụng</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container">
          <Card className="bg-gradient-to-r from-primary to-primary/80 text-white overflow-hidden">
            <CardContent className="p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-3xl font-heading font-bold uppercase mb-4">
                    Cần Giải Pháp <span className="text-chart-1">Tùy Chỉnh</span>?
                  </h2>
                  <p className="text-white/80 mb-6">
                    Đội ngũ kỹ sư của chúng tôi sẵn sàng tư vấn và thiết kế giải pháp công nghệ laser 
                    phù hợp với yêu cầu cụ thể của doanh nghiệp bạn.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Link href="/contact">
                      <Button size="lg" className="bg-chart-1 hover:bg-chart-1/90">
                        Yêu Cầu Tư Vấn
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </Button>
                    </Link>
                    <Link href="/products">
                      <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
                        Xem Sản Phẩm
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="text-center lg:text-right">
                  <p className="text-6xl font-heading font-bold text-chart-1">500+</p>
                  <p className="text-white/80 uppercase tracking-wider">Dự án đã triển khai</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
