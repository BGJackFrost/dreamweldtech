import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, X, Phone, Mail, MapPin, Facebook, Linkedin, Youtube, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { SearchDialog } from "./SearchDialog";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { LiveChat } from "./LiveChat";
import { Chatbot } from "./Chatbot";
import { useLanguage } from "@/contexts/LanguageContext";
import NewsletterForm from "./NewsletterForm";
import { trpc } from "@/lib/trpc";

interface MenuConfig {
  home: boolean;
  about: boolean;
  products: boolean;
  solutions: boolean;
  portfolio: boolean;
  partners: boolean;
  news: boolean;
  careers: boolean;
  contact: boolean;
  faq: boolean;
}

const defaultMenuConfig: MenuConfig = {
  home: true,
  about: true,
  products: true,
  solutions: true,
  portfolio: true,
  partners: true,
  news: true,
  careers: true,
  contact: true,
  faq: true,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useLanguage();

  // Fetch menu config from database
  const { data: menuConfigStr } = trpc.settings.get.useQuery({ key: "menu_config" });
  
  const menuConfig = useMemo(() => {
    if (menuConfigStr) {
      try {
        return { ...defaultMenuConfig, ...JSON.parse(menuConfigStr) };
      } catch (e) {
        return defaultMenuConfig;
      }
    }
    return defaultMenuConfig;
  }, [menuConfigStr]);

  // All possible nav items
  const allNavItems = [
    { key: "home", label: t.nav.home, href: "/" },
    { key: "about", label: t.nav.about, href: "/about" },
    { key: "products", label: t.nav.products, href: "/products" },
    { key: "solutions", label: t.nav.solutions, href: "/solutions" },
    { key: "portfolio", label: t.nav.portfolio, href: "/portfolio" },
    { key: "partners", label: t.nav.partners, href: "/partners" },
    { key: "news", label: t.nav.news, href: "/news" },
    { key: "careers", label: t.nav.careers, href: "/careers" },
    { key: "contact", label: t.nav.contact, href: "/contact" },
  ];

  // Filter nav items based on menu config
  const navItems = allNavItems.filter(item => menuConfig[item.key as keyof MenuConfig]);

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
            
            {menuConfig.contact && (
              <Link href="/contact">
                <Button className="bg-chart-1 hover:bg-chart-1/90 text-primary-foreground font-bold uppercase tracking-wider rounded-none skew-x-[-10deg]">
                  <span className="skew-x-[10deg]">{t.nav.getQuote}</span>
                </Button>
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <nav className="container py-4 flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "py-2 px-4 text-sm font-medium transition-colors hover:bg-accent rounded-md uppercase tracking-wide",
                    location === item.href ? "text-primary bg-accent" : "text-muted-foreground"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              {menuConfig.contact && (
                <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full mt-2 bg-chart-1 hover:bg-chart-1/90 text-primary-foreground font-bold uppercase tracking-wider">
                    {t.nav.getQuote}
                  </Button>
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-16">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Company Info */}
            <div className="space-y-4">
              <Link href="/" className="flex items-center gap-2 font-heading font-bold text-2xl uppercase tracking-wider">
                <div className="h-10 w-10 bg-chart-1 text-primary flex items-center justify-center rounded-sm">
                  D
                </div>
                Dreamweldtech
              </Link>
              <p className="text-primary-foreground/80 text-sm leading-relaxed">
                {t.footer.description}
              </p>
              <div className="flex gap-4 pt-2">
                <a href="#" className="h-10 w-10 bg-primary-foreground/10 hover:bg-chart-1 flex items-center justify-center rounded-sm transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="h-10 w-10 bg-primary-foreground/10 hover:bg-chart-1 flex items-center justify-center rounded-sm transition-colors">
                  <Linkedin className="h-5 w-5" />
                </a>
                <a href="#" className="h-10 w-10 bg-primary-foreground/10 hover:bg-chart-1 flex items-center justify-center rounded-sm transition-colors">
                  <Youtube className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-heading font-bold text-lg mb-6 uppercase tracking-wider">{t.footer.quickLinks}</h3>
              <ul className="space-y-3">
                {menuConfig.about && (
                  <li><Link href="/about" className="text-primary-foreground/80 hover:text-chart-1 transition-colors text-sm">{t.nav.about}</Link></li>
                )}
                {menuConfig.products && (
                  <li><Link href="/products" className="text-primary-foreground/80 hover:text-chart-1 transition-colors text-sm">{t.nav.products}</Link></li>
                )}
                {menuConfig.solutions && (
                  <li><Link href="/solutions" className="text-primary-foreground/80 hover:text-chart-1 transition-colors text-sm">{t.nav.solutions}</Link></li>
                )}
                {menuConfig.news && (
                  <li><Link href="/news" className="text-primary-foreground/80 hover:text-chart-1 transition-colors text-sm">{t.nav.news}</Link></li>
                )}
                {menuConfig.careers && (
                  <li><Link href="/careers" className="text-primary-foreground/80 hover:text-chart-1 transition-colors text-sm">{t.nav.careers}</Link></li>
                )}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="font-heading font-bold text-lg mb-6 uppercase tracking-wider">{t.footer.contactInfo}</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-chart-1 flex-shrink-0 mt-0.5" />
                  <span className="text-primary-foreground/80 text-sm">123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-chart-1 flex-shrink-0" />
                  <span className="text-primary-foreground/80 text-sm">+84 123 456 789</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-chart-1 flex-shrink-0" />
                  <span className="text-primary-foreground/80 text-sm">contact@dreamweldtech.com</span>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h3 className="font-heading font-bold text-lg mb-6 uppercase tracking-wider">Newsletter</h3>
              <p className="text-primary-foreground/80 text-sm mb-4">Đăng ký nhận tin tức và khuyến mãi mới nhất</p>
              <NewsletterForm />
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-primary-foreground/20 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-primary-foreground/60 text-sm">
              © 2024 Dreamweldtech. {t.footer.allRights}
            </p>
            <div className="flex gap-6">
              <Link href="/privacy-policy" className="text-primary-foreground/60 hover:text-chart-1 transition-colors text-sm">
                {t.footer.privacyPolicy}
              </Link>
              <Link href="/terms-of-service" className="text-primary-foreground/60 hover:text-chart-1 transition-colors text-sm">
                {t.footer.termsOfService}
              </Link>
              {menuConfig.faq && (
                <Link href="/faq" className="text-primary-foreground/60 hover:text-chart-1 transition-colors text-sm">
                  FAQ
                </Link>
              )}
            </div>
          </div>
        </div>
      </footer>

      {/* Live Chat Widget */}
      <LiveChat />
      
      {/* AI Chatbot */}
      <Chatbot />
    </div>
  );
}
