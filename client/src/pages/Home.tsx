import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Zap, Shield, Cpu, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { BannerSlider } from "@/components/BannerSlider";
import { HomePageSchema } from "@/components/SEOSchema";

export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      {/* SEO Schema Markup */}
      <HomePageSchema />
      {/* Hero Section with Banner Slider */}
      <BannerSlider
        autoPlayInterval={6000}
        showNavigation={true}
        showDots={true}
        fallbackContent={
          <section className="relative h-[80vh] flex items-center overflow-hidden bg-primary">
            <div className="absolute inset-0 z-0">
              <img 
                src="/images/hero-banner.jpg" 
                alt="Industrial Laser Technology" 
                className="w-full h-full object-cover opacity-40"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-transparent"></div>
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-chart-1 shadow-[0_0_20px_rgba(0,255,255,0.5)]"></div>
            </div>

            <div className="container relative z-10 text-white">
              <div className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-left-10 duration-1000">
                <div className="inline-flex items-center gap-2 px-3 py-1 border border-chart-1/50 bg-chart-1/10 text-chart-1 text-sm font-bold uppercase tracking-widest mb-4">
                  <Zap className="h-4 w-4" />
                  <span>Công Nghệ Laser Tiên Tiến</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-heading font-bold leading-tight uppercase tracking-wide">
                  Đỉnh Cao <span className="text-transparent bg-clip-text bg-gradient-to-r from-chart-1 to-white">Công Nghệ</span><br />
                  Gia Công Chính Xác
                </h1>
                <p className="text-xl text-gray-300 max-w-2xl font-light leading-relaxed border-l-4 border-chart-1 pl-6">
                  Dreamweldtech cung cấp giải pháp toàn diện về máy hàn, cắt và làm sạch laser cho nền công nghiệp hiện đại. Hiệu suất vượt trội, độ bền tối đa.
                </p>
                <div className="flex flex-wrap gap-4 pt-8">
                  <Link href="/products">
                    <Button size="lg" className="bg-chart-1 hover:bg-chart-1/90 text-primary-foreground font-bold uppercase tracking-wider h-14 px-8 text-lg rounded-none skew-x-[-10deg] group">
                      <span className="skew-x-[10deg] flex items-center gap-2">
                        Khám Phá Sản Phẩm <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary font-bold uppercase tracking-wider h-14 px-8 text-lg rounded-none skew-x-[-10deg]">
                      <span className="skew-x-[10deg]">Liên Hệ Tư Vấn</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        }
      />

      {/* About Summary Section */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="container grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="absolute -top-4 -left-4 w-24 h-24 border-t-4 border-l-4 border-chart-1"></div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 border-b-4 border-r-4 border-primary"></div>
            <img 
              src="/images/about-factory.jpg" 
              alt="Dreamweldtech Factory" 
              className="w-full h-auto shadow-2xl grayscale hover:grayscale-0 transition-all duration-500"
            />
            <div className="absolute bottom-8 right-8 bg-primary p-6 text-white max-w-xs shadow-xl hidden md:block">
              <p className="text-4xl font-heading font-bold text-chart-1 mb-1">15+</p>
              <p className="text-sm uppercase tracking-wider font-medium">Năm Kinh Nghiệm Trong Ngành Công Nghiệp Laser</p>
            </div>
          </div>
          
          <div className="space-y-8">
            <div>
              <h2 className="text-chart-1 font-bold uppercase tracking-widest text-sm mb-2">Về Dreamweldtech</h2>
              <h3 className="text-4xl font-heading font-bold text-primary uppercase mb-6">Tiên Phong Đổi Mới <br/>Nâng Tầm Sản Xuất</h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Chúng tôi không chỉ cung cấp máy móc, chúng tôi cung cấp giải pháp. Với đội ngũ kỹ sư giàu kinh nghiệm và công nghệ cốt lõi, Dreamweldtech cam kết mang lại hiệu quả sản xuất tối ưu cho doanh nghiệp của bạn.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { icon: Shield, title: "Chất Lượng Đỉnh Cao", desc: "Linh kiện nhập khẩu chính hãng, quy trình kiểm tra nghiêm ngặt." },
                { icon: Cpu, title: "Công Nghệ Mới Nhất", desc: "Cập nhật liên tục các xu hướng laser tiên tiến trên thế giới." },
                { icon: Zap, title: "Hiệu Suất Vượt Trội", desc: "Tốc độ xử lý nhanh gấp 3-10 lần phương pháp truyền thống." },
                { icon: CheckCircle2, title: "Hỗ Trợ 24/7", desc: "Đội ngũ kỹ thuật sẵn sàng hỗ trợ mọi lúc, mọi nơi." }
              ].map((item, index) => (
                <div key={index} className="flex gap-4 items-start group">
                  <div className="bg-secondary p-3 group-hover:bg-chart-1 transition-colors duration-300">
                    <item.icon className="h-6 w-6 text-primary group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <h4 className="font-heading font-bold text-primary uppercase mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link href="/about">
              <Button variant="link" className="text-primary font-bold uppercase tracking-wider p-0 hover:text-chart-1 group">
                Xem Thêm Về Chúng Tôi <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-24 bg-secondary/30">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-chart-1 font-bold uppercase tracking-widest text-sm mb-2">Sản Phẩm Của Chúng Tôi</h2>
            <h3 className="text-4xl font-heading font-bold text-primary uppercase mb-6">Giải Pháp Toàn Diện Cho Mọi Nhu Cầu</h3>
            <div className="w-24 h-1 bg-chart-1 mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Máy Hàn Laser",
                image: "/images/product-laser-welder.jpg",
                desc: "Hàn chính xác, mối hàn đẹp, không biến dạng nhiệt. Phù hợp cho kim loại mỏng và chi tiết phức tạp.",
                link: "/products/welding"
              },
              {
                title: "Máy Cắt Laser",
                image: "/images/product-laser-cutter.jpg",
                desc: "Cắt tốc độ cao, đường cắt sắc nét. Xử lý đa dạng vật liệu từ thép, inox đến nhôm, đồng.",
                link: "/products/cutting"
              },
              {
                title: "Máy Làm Sạch Laser",
                image: "/images/product-laser-cleaner.jpg",
                desc: "Làm sạch rỉ sét, sơn, dầu mỡ không hóa chất, không mài mòn bề mặt vật liệu gốc.",
                link: "/products/cleaning"
              }
            ].map((product, index) => (
              <div key={index} className="group bg-background border border-border hover:border-chart-1 transition-all duration-300 hover:shadow-xl overflow-hidden relative">
                <div className="aspect-square overflow-hidden bg-secondary/50 relative">
                  <img 
                    src={product.image} 
                    alt={product.title} 
                    className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Button className="bg-chart-1 text-primary-foreground font-bold uppercase tracking-wider rounded-none">Xem Chi Tiết</Button>
                  </div>
                </div>
                <div className="p-8 relative">
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-chart-1 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                  <h4 className="text-2xl font-heading font-bold text-primary uppercase mb-3 group-hover:text-chart-1 transition-colors">{product.title}</h4>
                  <p className="text-muted-foreground mb-6 line-clamp-3">{product.desc}</p>
                  <Link href={product.link} className="inline-flex items-center text-sm font-bold uppercase tracking-wider text-primary hover:text-chart-1 transition-colors">
                      Tìm Hiểu Thêm <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries / Applications */}
      <section className="py-24 bg-primary text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
        <div className="container relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div>
              <h2 className="text-chart-1 font-bold uppercase tracking-widest text-sm mb-2">Ứng Dụng Thực Tế</h2>
              <h3 className="text-4xl font-heading font-bold text-white uppercase">Đa Dạng Ngành Công Nghiệp</h3>
            </div>
            <Button variant="outline" className="border-white/20 text-white hover:bg-chart-1 hover:border-chart-1 hover:text-primary font-bold uppercase tracking-wider rounded-none">
              Xem Tất Cả Ứng Dụng
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              "Công Nghiệp Ô Tô",
              "Điện Tử & Bán Dẫn",
              "Gia Công Kim Loại Tấm",
              "Hàng Không Vũ Trụ",
              "Y Tế & Dược Phẩm",
              "Năng Lượng Tái Tạo",
              "Khuôn Mẫu Chính Xác",
              "Đồ Gia Dụng"
            ].map((industry, index) => (
              <div key={index} className="bg-white/5 border border-white/10 p-6 hover:bg-chart-1 hover:text-primary transition-all duration-300 cursor-pointer group">
                <div className="flex justify-between items-center">
                  <h4 className="font-heading font-bold uppercase text-lg">{industry}</h4>
                  <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-background">
        <div className="container">
          <div className="bg-secondary border border-border p-12 md:p-20 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-chart-1/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
            
            <h2 className="text-3xl md:text-5xl font-heading font-bold text-primary uppercase mb-6 relative z-10">
              Sẵn Sàng Nâng Cấp Dây Chuyền Sản Xuất?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 relative z-10">
              Liên hệ ngay với đội ngũ chuyên gia của Dreamweldtech để được tư vấn giải pháp tối ưu nhất cho doanh nghiệp của bạn.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-wider h-14 px-10 rounded-none">
                Liên Hệ Ngay
              </Button>
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white font-bold uppercase tracking-wider h-14 px-10 rounded-none">
                Tải Catalogue
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
