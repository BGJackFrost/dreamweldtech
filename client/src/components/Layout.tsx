import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, X, Phone, Mail, MapPin, Facebook, Linkedin, Youtube } from "lucide-react";
import { useState } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Trang Chủ", href: "/" },
    { label: "Giới Thiệu", href: "/about" },
    { label: "Sản Phẩm", href: "/products" },
    { label: "Giải Pháp", href: "/solutions" },
    { label: "Tin Tức", href: "/news" },
    { label: "Liên Hệ", href: "/contact" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      {/* Top Bar */}
      <div className="bg-primary text-primary-foreground py-2 text-sm hidden md:block">
        <div className="container flex justify-between items-center">
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>+84 123 456 789</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>contact@dreamweldtech.com</span>
            </div>
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-chart-1 transition-colors"><Facebook className="h-4 w-4" /></a>
            <a href="#" className="hover:text-chart-1 transition-colors"><Linkedin className="h-4 w-4" /></a>
            <a href="#" className="hover:text-chart-1 transition-colors"><Youtube className="h-4 w-4" /></a>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-20 items-center justify-between">
          <Link href="/">
            <a className="flex items-center gap-2 font-heading font-bold text-2xl text-primary uppercase tracking-wider">
              <div className="h-10 w-10 bg-primary text-primary-foreground flex items-center justify-center rounded-sm">
                D
              </div>
              Dreamweldtech
            </a>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <a
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary uppercase tracking-wide relative group",
                    location === item.href ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                  <span className={cn(
                    "absolute -bottom-1 left-0 w-0 h-0.5 bg-chart-1 transition-all duration-300 group-hover:w-full",
                    location === item.href ? "w-full" : ""
                  )} />
                </a>
              </Link>
            ))}
            <Button className="bg-chart-1 hover:bg-chart-1/90 text-primary-foreground font-bold uppercase tracking-wider rounded-none skew-x-[-10deg]">
              <span className="skew-x-[10deg]">Báo Giá Ngay</span>
            </Button>
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-background p-4 absolute w-full shadow-lg">
            <nav className="flex flex-col gap-4">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <a
                    className={cn(
                      "text-base font-medium transition-colors hover:text-primary block py-2 border-b border-border/50",
                      location === item.href ? "text-primary" : "text-muted-foreground"
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                </Link>
              ))}
              <Button className="w-full bg-chart-1 hover:bg-chart-1/90 text-primary-foreground font-bold uppercase tracking-wider rounded-none mt-4">
                Báo Giá Ngay
              </Button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground pt-16 pb-8">
        <div className="container grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="space-y-4">
            <h3 className="text-2xl font-heading font-bold uppercase tracking-wider text-chart-1">Dreamweldtech</h3>
            <p className="text-primary-foreground/80 text-sm leading-relaxed">
              Tiên phong trong công nghệ laser công nghiệp. Chúng tôi cung cấp các giải pháp hàn, cắt, làm sạch và tự động hóa hàng đầu thế giới.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="bg-white/10 p-2 hover:bg-chart-1 hover:text-primary transition-all"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="bg-white/10 p-2 hover:bg-chart-1 hover:text-primary transition-all"><Linkedin className="h-5 w-5" /></a>
              <a href="#" className="bg-white/10 p-2 hover:bg-chart-1 hover:text-primary transition-all"><Youtube className="h-5 w-5" /></a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-heading font-bold uppercase mb-6 border-l-4 border-chart-1 pl-3">Sản Phẩm</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/80">
              <li><a href="#" className="hover:text-chart-1 transition-colors flex items-center gap-2"><span className="w-1 h-1 bg-chart-1"></span>Máy Hàn Laser</a></li>
              <li><a href="#" className="hover:text-chart-1 transition-colors flex items-center gap-2"><span className="w-1 h-1 bg-chart-1"></span>Máy Cắt Laser</a></li>
              <li><a href="#" className="hover:text-chart-1 transition-colors flex items-center gap-2"><span className="w-1 h-1 bg-chart-1"></span>Máy Làm Sạch Laser</a></li>
              <li><a href="#" className="hover:text-chart-1 transition-colors flex items-center gap-2"><span className="w-1 h-1 bg-chart-1"></span>Giải Pháp Tự Động Hóa</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-heading font-bold uppercase mb-6 border-l-4 border-chart-1 pl-3">Liên Kết Nhanh</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/80">
              <li><Link href="/about"><a className="hover:text-chart-1 transition-colors flex items-center gap-2"><span className="w-1 h-1 bg-chart-1"></span>Về Chúng Tôi</a></Link></li>
              <li><Link href="/solutions"><a className="hover:text-chart-1 transition-colors flex items-center gap-2"><span className="w-1 h-1 bg-chart-1"></span>Giải Pháp Ngành</a></Link></li>
              <li><Link href="/news"><a className="hover:text-chart-1 transition-colors flex items-center gap-2"><span className="w-1 h-1 bg-chart-1"></span>Tin Tức & Sự Kiện</a></Link></li>
              <li><Link href="/contact"><a className="hover:text-chart-1 transition-colors flex items-center gap-2"><span className="w-1 h-1 bg-chart-1"></span>Liên Hệ</a></Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-heading font-bold uppercase mb-6 border-l-4 border-chart-1 pl-3">Thông Tin Liên Hệ</h4>
            <ul className="space-y-4 text-sm text-primary-foreground/80">
              <li className="flex gap-3 items-start">
                <MapPin className="h-5 w-5 text-chart-1 shrink-0" />
                <span>Khu Công Nghệ Cao, Quận 9, TP. Hồ Chí Minh, Việt Nam</span>
              </li>
              <li className="flex gap-3 items-center">
                <Phone className="h-5 w-5 text-chart-1 shrink-0" />
                <span>+84 123 456 789</span>
              </li>
              <li className="flex gap-3 items-center">
                <Mail className="h-5 w-5 text-chart-1 shrink-0" />
                <span>contact@dreamweldtech.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 text-center text-sm text-primary-foreground/60">
          <div className="container">
            <p>&copy; {new Date().getFullYear()} Dreamweldtech. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
