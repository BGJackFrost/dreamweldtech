import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, X, Phone, Mail, MapPin, Facebook, Linkedin, Youtube, Search, Twitter, Instagram } from "lucide-react";
import { useState, useMemo } from "react";
import { SearchDialog } from "./SearchDialog";
import { TranslationSearch } from "./TranslationSearch";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { LiveChat } from "./LiveChat";
import { Chatbot } from "./Chatbot";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePublicCustomTranslation } from "@/hooks/useCustomTranslation";
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

interface FooterConfig {
  companyName: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  facebookUrl: string;
  linkedinUrl: string;
  youtubeUrl: string;
  twitterUrl: string;
  instagramUrl: string;
  showNewsletter: boolean;
  copyrightText: string;
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

const defaultFooterConfig: FooterConfig = {
  companyName: "Dreamweldtech",
  description: "",
  address: "123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh",
  phone: "+84 123 456 789",
  email: "contact@dreamweldtech.com",
  facebookUrl: "",
  linkedinUrl: "",
  youtubeUrl: "",
  twitterUrl: "",
  instagramUrl: "",
  showNewsletter: true,
  copyrightText: "",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useLanguage();
  const { t: customT, hasTranslation } = usePublicCustomTranslation();
  
  // Helper để lấy translation với fallback từ static
  const getT = (key: string, staticValue: string) => {
    return hasTranslation(key) ? customT(key) : staticValue;
  };

  // Fetch menu config from database
  const { data: menuConfigStr } = trpc.settings.get.useQuery({ key: "menu_config" });
  const { data: footerConfigStr } = trpc.settings.get.useQuery({ key: "footer_config" });
  
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

  const footerConfig = useMemo(() => {
    if (footerConfigStr) {
      try {
        return { ...defaultFooterConfig, ...JSON.parse(footerConfigStr) };
      } catch (e) {
        return defaultFooterConfig;
      }
    }
    return defaultFooterConfig;
  }, [footerConfigStr]);

  // All possible nav items - sử dụng getT để cho phép override từ database
  const allNavItems = [
    { key: "home", label: getT("nav.home", t.nav.home), href: "/" },
    { key: "about", label: getT("nav.about", t.nav.about), href: "/about" },
    { key: "products", label: getT("nav.products", t.nav.products), href: "/products" },
    { key: "solutions", label: getT("nav.solutions", t.nav.solutions), href: "/solutions" },
    { key: "portfolio", label: getT("nav.portfolio", t.nav.portfolio), href: "/portfolio" },
    { key: "partners", label: getT("nav.partners", t.nav.partners), href: "/partners" },
    { key: "news", label: getT("nav.news", t.nav.news), href: "/news" },
    { key: "careers", label: getT("nav.careers", t.nav.careers), href: "/careers" },
    { key: "contact", label: getT("nav.contact", t.nav.contact), href: "/contact" },
  ];

  // Filter nav items based on menu config
  const navItems = allNavItems.filter(item => menuConfig[item.key as keyof MenuConfig]);

  // Social links
  const socialLinks = [
    { url: footerConfig.facebookUrl, icon: Facebook, label: "Facebook" },
    { url: footerConfig.linkedinUrl, icon: Linkedin, label: "LinkedIn" },
    { url: footerConfig.youtubeUrl, icon: Youtube, label: "YouTube" },
    { url: footerConfig.twitterUrl, icon: Twitter, label: "Twitter" },
    { url: footerConfig.instagramUrl, icon: Instagram, label: "Instagram" },
  ].filter(link => link.url);

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      {/* Top Bar */}
      <div className="bg-primary text-primary-foreground py-2 text-sm hidden md:block">
        <div className="container flex justify-between items-center">
          <div className="flex gap-6">
            <a href={`tel:${footerConfig.phone}`} className="flex items-center gap-2 hover:text-chart-1 transition-colors">
              <Phone className="h-4 w-4" />
              {footerConfig.phone}
            </a>
            <a href={`mailto:${footerConfig.email}`} className="flex items-center gap-2 hover:text-chart-1 transition-colors">
              <Mail className="h-4 w-4" />
              {footerConfig.email}
            </a>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            {socialLinks.slice(0, 3).map((link) => (
              <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" className="hover:text-chart-1 transition-colors">
                <link.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3 font-heading font-bold text-2xl uppercase tracking-wider">
            <div className="h-12 w-12 bg-chart-1 text-primary flex items-center justify-center rounded-sm text-xl">
              D
            </div>
            <span className="hidden sm:inline">{footerConfig.companyName}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors hover:text-primary uppercase tracking-wide",
                  location === item.href ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <TranslationSearch variant="inline" className="hidden lg:block w-48" />
            {menuConfig.contact && (
              <Link href="/contact" className="hidden md:block">
                <Button className="bg-chart-1 hover:bg-chart-1/90 text-primary-foreground font-bold uppercase tracking-wider">
                  {t.nav.getQuote}
                </Button>
              </Link>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
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
                {footerConfig.companyName}
              </Link>
              <p className="text-primary-foreground/80 text-sm leading-relaxed">
                {footerConfig.description || t.footer.description}
              </p>
              {socialLinks.length > 0 && (
                <div className="flex gap-4 pt-2">
                  {socialLinks.map((link) => (
                    <a 
                      key={link.label}
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="h-10 w-10 bg-primary-foreground/10 hover:bg-chart-1 flex items-center justify-center rounded-sm transition-colors"
                      title={link.label}
                    >
                      <link.icon className="h-5 w-5" />
                    </a>
                  ))}
                </div>
              )}
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
                  <span className="text-primary-foreground/80 text-sm">{footerConfig.address}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-chart-1 flex-shrink-0" />
                  <a href={`tel:${footerConfig.phone}`} className="text-primary-foreground/80 hover:text-chart-1 transition-colors text-sm">
                    {footerConfig.phone}
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-chart-1 flex-shrink-0" />
                  <a href={`mailto:${footerConfig.email}`} className="text-primary-foreground/80 hover:text-chart-1 transition-colors text-sm">
                    {footerConfig.email}
                  </a>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            {footerConfig.showNewsletter && (
              <div>
                <h3 className="font-heading font-bold text-lg mb-6 uppercase tracking-wider">Newsletter</h3>
                <p className="text-primary-foreground/80 text-sm mb-4">Đăng ký nhận tin tức và khuyến mãi mới nhất</p>
                <NewsletterForm />
              </div>
            )}
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-primary-foreground/20 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-primary-foreground/60 text-sm">
              {footerConfig.copyrightText || `© ${new Date().getFullYear()} ${footerConfig.companyName}. ${t.footer.allRights}`}
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
