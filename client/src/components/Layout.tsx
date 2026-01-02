import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, X, Phone, Mail, MapPin, Facebook, Linkedin, Youtube, Search } from "lucide-react";
import { useState } from "react";
import { SearchDialog } from "./SearchDialog";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { LiveChat } from "./LiveChat";
import { Chatbot } from "./Chatbot";
import { useLanguage } from "@/contexts/LanguageContext";
import NewsletterForm from "./NewsletterForm";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useLanguage();

  const navItems = [
    { label: t.nav.home, href: "/" },
    { label: t.nav.about, href: "/about" },
    { label: t.nav.products, href: "/products" },
    { label: t.nav.solutions, href: "/solutions" },
    { label: t.nav.portfolio, href: "/portfolio" },
    { label: t.nav.partners, href: "/partners" },
    { label: t.nav.news, href: "/news" },
    { label: t.nav.careers, href: "/careers" },
    { label: t.nav.contact, href: "/contact" },
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
          <Link href="/" className="flex items-center gap-2 font-heading font-bold text-2xl text-primary uppercase tracking-wider">
            <div className="h-10 w-10 bg-primary text-primary-foreground flex items-center justify-center rounded-sm">
              D
            </div>
            Dreamweldtech
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
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
              </Link>
            ))}
            
            {/* Search Button */}
            <SearchDialog 
              trigger={
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Search className="h-4 w-4" />
                </Button>
              }
            />
            
            {/* Language Switcher */}
            <LanguageSwitcher />
            
            <Link href="/contact">
              <Button className="bg-chart-1 hover:bg-chart-1/90 text-primary-foreground font-bold uppercase tracking-wider rounded-none skew-x-[-10deg]">
                <span className="skew-x-[10deg]">{t.nav.getQuote}</span>
              </Button>
            </Link>
          </nav>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center gap-2">
            <SearchDialog 
              trigger={
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Search className="h-4 w-4" />
                </Button>
              }
            />
            <LanguageSwitcher />
            <button
              className="p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-background p-4 absolute w-full shadow-lg">
            <nav className="flex flex-col gap-4">
              {navItems.map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={cn(
                    "text-base font-medium transition-colors hover:text-primary block py-2 border-b border-border/50",
                    location === item.href ? "text-primary" : "text-muted-foreground"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full bg-chart-1 hover:bg-chart-1/90 text-primary-foreground font-bold uppercase tracking-wider rounded-none mt-4">
                  {t.nav.getQuote}
                </Button>
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Live Chat */}
      <LiveChat />
      
      {/* AI Chatbot */}
      <Chatbot />

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground pt-16 pb-8">
        <div className="container grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="space-y-4">
            <h3 className="text-2xl font-heading font-bold uppercase tracking-wider text-chart-1">Dreamweldtech</h3>
            <p className="text-primary-foreground/80 text-sm leading-relaxed">
              {t.footer.description}
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="bg-white/10 p-2 hover:bg-chart-1 hover:text-primary transition-all"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="bg-white/10 p-2 hover:bg-chart-1 hover:text-primary transition-all"><Linkedin className="h-5 w-5" /></a>
              <a href="#" className="bg-white/10 p-2 hover:bg-chart-1 hover:text-primary transition-all"><Youtube className="h-5 w-5" /></a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-heading font-bold uppercase mb-6 border-l-4 border-chart-1 pl-3">{t.footer.products}</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/80">
              <li><Link href="/products" className="hover:text-chart-1 transition-colors flex items-center gap-2"><span className="w-1 h-1 bg-chart-1"></span>{t.footer.laserWelder}</Link></li>
              <li><Link href="/products" className="hover:text-chart-1 transition-colors flex items-center gap-2"><span className="w-1 h-1 bg-chart-1"></span>{t.footer.laserCutter}</Link></li>
              <li><Link href="/products" className="hover:text-chart-1 transition-colors flex items-center gap-2"><span className="w-1 h-1 bg-chart-1"></span>{t.footer.laserCleaner}</Link></li>
              <li><Link href="/products" className="hover:text-chart-1 transition-colors flex items-center gap-2"><span className="w-1 h-1 bg-chart-1"></span>{t.footer.automation}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-heading font-bold uppercase mb-6 border-l-4 border-chart-1 pl-3">{t.footer.quickLinks}</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/80">
              <li><Link href="/about" className="hover:text-chart-1 transition-colors flex items-center gap-2"><span className="w-1 h-1 bg-chart-1"></span>{t.footer.aboutUs}</Link></li>
              <li><Link href="/solutions" className="hover:text-chart-1 transition-colors flex items-center gap-2"><span className="w-1 h-1 bg-chart-1"></span>{t.footer.industrySolutions}</Link></li>
              <li><Link href="/news" className="hover:text-chart-1 transition-colors flex items-center gap-2"><span className="w-1 h-1 bg-chart-1"></span>{t.footer.newsEvents}</Link></li>
              <li><Link href="/contact" className="hover:text-chart-1 transition-colors flex items-center gap-2"><span className="w-1 h-1 bg-chart-1"></span>{t.nav.contact}</Link></li>
              <li><Link href="/faq" className="hover:text-chart-1 transition-colors flex items-center gap-2"><span className="w-1 h-1 bg-chart-1"></span>FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-heading font-bold uppercase mb-6 border-l-4 border-chart-1 pl-3">{t.footer.contactInfo}</h4>
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
            {/* Newsletter */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <h5 className="text-sm font-semibold mb-3">{t.newsletter.title}</h5>
              <NewsletterForm variant="footer" source="footer" />
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 text-sm text-primary-foreground/60">
          <div className="container flex flex-col md:flex-row justify-between items-center gap-4">
            <p>&copy; {new Date().getFullYear()} Dreamweldtech. {t.footer.allRights}</p>
            <div className="flex gap-6">
              <Link href="/privacy-policy" className="hover:text-chart-1 transition-colors">
                {t.footer.privacyPolicy || "Chính sách bảo mật"}
              </Link>
              <Link href="/terms-of-service" className="hover:text-chart-1 transition-colors">
                {t.footer.termsOfService || "Điều khoản dịch vụ"}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
