import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, X, Monitor, Smartphone, Tablet } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfigPreviewProps {
  type: "home" | "about" | "footer" | "menu";
  config: Record<string, unknown>;
  children?: React.ReactNode;
}

type DeviceType = "desktop" | "tablet" | "mobile";

export function ConfigPreview({ type, config, children }: ConfigPreviewProps) {
  const [device, setDevice] = useState<DeviceType>("desktop");
  const [isOpen, setIsOpen] = useState(false);

  const deviceWidths: Record<DeviceType, string> = {
    desktop: "100%",
    tablet: "768px",
    mobile: "375px",
  };

  const renderHomePreview = () => {
    const c = config as {
      heroTagline?: string;
      heroTitle?: string;
      heroTitleHighlight?: string;
      heroDescription?: string;
      heroButtonPrimary?: string;
      heroButtonSecondary?: string;
      statsYears?: string;
      statsProjects?: string;
      statsPartners?: string;
      statsSatisfaction?: string;
    };

    return (
      <div className="bg-primary text-primary-foreground min-h-[400px] relative overflow-hidden">
        {/* Hero Section Preview */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-transparent" />
        <div className="relative z-10 p-8 md:p-12">
          <div className="max-w-2xl space-y-4">
            {c.heroTagline && (
              <div className="inline-flex items-center gap-2 px-3 py-1 border border-chart-1/50 bg-chart-1/10 text-chart-1 text-xs font-bold uppercase tracking-widest">
                {c.heroTagline}
              </div>
            )}
            <h1 className="text-2xl md:text-4xl font-heading font-bold uppercase">
              {c.heroTitle} <span className="text-chart-1">{c.heroTitleHighlight}</span>
            </h1>
            {c.heroDescription && (
              <p className="text-sm text-primary-foreground/80 border-l-2 border-chart-1 pl-4">
                {c.heroDescription}
              </p>
            )}
            <div className="flex gap-3 pt-4">
              {c.heroButtonPrimary && (
                <Button size="sm" className="bg-chart-1 text-primary-foreground text-xs">
                  {c.heroButtonPrimary}
                </Button>
              )}
              {c.heroButtonSecondary && (
                <Button size="sm" variant="outline" className="border-primary-foreground/30 text-primary-foreground text-xs">
                  {c.heroButtonSecondary}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Preview */}
        <div className="bg-background text-foreground p-6 grid grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-xl font-bold text-chart-1">{c.statsYears || "15+"}</p>
            <p className="text-xs text-muted-foreground">Năm</p>
          </div>
          <div>
            <p className="text-xl font-bold text-chart-1">{c.statsProjects || "500+"}</p>
            <p className="text-xs text-muted-foreground">Dự án</p>
          </div>
          <div>
            <p className="text-xl font-bold text-chart-1">{c.statsPartners || "100+"}</p>
            <p className="text-xs text-muted-foreground">Đối tác</p>
          </div>
          <div>
            <p className="text-xl font-bold text-chart-1">{c.statsSatisfaction || "98%"}</p>
            <p className="text-xs text-muted-foreground">Hài lòng</p>
          </div>
        </div>
      </div>
    );
  };

  const renderAboutPreview = () => {
    const c = config as {
      heroTitle?: string;
      heroSubtitle?: string;
      companyName?: string;
      foundedYear?: string;
      mission?: string;
      vision?: string;
      coreValues?: string;
    };

    return (
      <div className="bg-background text-foreground">
        {/* Hero */}
        <div className="bg-primary text-primary-foreground p-8 text-center">
          <h1 className="text-2xl font-heading font-bold uppercase">{c.heroTitle || "Về Chúng Tôi"}</h1>
          <p className="text-sm text-primary-foreground/80 mt-2">{c.heroSubtitle}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-chart-1 text-primary flex items-center justify-center rounded-sm text-xl font-bold">
              D
            </div>
            <div>
              <h2 className="font-bold">{c.companyName || "Dreamweldtech"}</h2>
              <p className="text-xs text-muted-foreground">Thành lập năm {c.foundedYear || "2010"}</p>
            </div>
          </div>

          {c.mission && (
            <div className="border-l-2 border-chart-1 pl-4">
              <h3 className="text-sm font-bold uppercase text-chart-1 mb-1">Sứ Mệnh</h3>
              <p className="text-xs text-muted-foreground">{c.mission}</p>
            </div>
          )}

          {c.vision && (
            <div className="border-l-2 border-primary pl-4">
              <h3 className="text-sm font-bold uppercase text-primary mb-1">Tầm Nhìn</h3>
              <p className="text-xs text-muted-foreground">{c.vision}</p>
            </div>
          )}

          {c.coreValues && (
            <div className="bg-secondary p-4 rounded">
              <h3 className="text-sm font-bold mb-2">Giá Trị Cốt Lõi</h3>
              <p className="text-xs text-muted-foreground">{c.coreValues}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderFooterPreview = () => {
    const c = config as {
      companyName?: string;
      companyDescription?: string;
      address?: string;
      phone?: string;
      email?: string;
      facebookUrl?: string;
      linkedinUrl?: string;
      youtubeUrl?: string;
      copyright?: string;
    };

    return (
      <div className="bg-primary text-primary-foreground p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 bg-chart-1 text-primary flex items-center justify-center rounded-sm text-sm font-bold">
                D
              </div>
              <span className="font-bold">{c.companyName || "Dreamweldtech"}</span>
            </div>
            <p className="text-xs text-primary-foreground/80">{c.companyDescription}</p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-sm mb-3">Liên Hệ</h3>
            <div className="space-y-2 text-xs text-primary-foreground/80">
              {c.address && <p>📍 {c.address}</p>}
              {c.phone && <p>📞 {c.phone}</p>}
              {c.email && <p>✉️ {c.email}</p>}
            </div>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-bold text-sm mb-3">Mạng Xã Hội</h3>
            <div className="flex gap-2">
              {c.facebookUrl && <div className="h-8 w-8 bg-primary-foreground/10 rounded flex items-center justify-center text-xs">FB</div>}
              {c.linkedinUrl && <div className="h-8 w-8 bg-primary-foreground/10 rounded flex items-center justify-center text-xs">LI</div>}
              {c.youtubeUrl && <div className="h-8 w-8 bg-primary-foreground/10 rounded flex items-center justify-center text-xs">YT</div>}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-4 border-t border-primary-foreground/20 text-center text-xs text-primary-foreground/60">
          {c.copyright || `© ${new Date().getFullYear()} ${c.companyName || "Dreamweldtech"}. All rights reserved.`}
        </div>
      </div>
    );
  };

  const renderMenuPreview = () => {
    const c = config as Record<string, boolean>;
    const menuItems = [
      { key: "home", label: "Trang chủ" },
      { key: "about", label: "Giới thiệu" },
      { key: "products", label: "Sản phẩm" },
      { key: "solutions", label: "Giải pháp" },
      { key: "portfolio", label: "Dự án" },
      { key: "partners", label: "Đối tác" },
      { key: "news", label: "Tin tức" },
      { key: "careers", label: "Tuyển dụng" },
      { key: "contact", label: "Liên hệ" },
      { key: "faq", label: "FAQ" },
    ];

    const visibleItems = menuItems.filter(item => c[item.key] !== false);

    return (
      <div className="bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-chart-1 text-primary flex items-center justify-center rounded-sm text-sm font-bold">
              D
            </div>
            <span className="font-bold text-sm">DREAMWELDTECH</span>
          </div>
          <nav className="flex gap-4">
            {visibleItems.map(item => (
              <span key={item.key} className="text-xs text-muted-foreground hover:text-primary cursor-pointer uppercase">
                {item.label}
              </span>
            ))}
          </nav>
        </div>
      </div>
    );
  };

  const renderPreview = () => {
    switch (type) {
      case "home":
        return renderHomePreview();
      case "about":
        return renderAboutPreview();
      case "footer":
        return renderFooterPreview();
      case "menu":
        return renderMenuPreview();
      default:
        return null;
    }
  };

  const typeLabels: Record<string, string> = {
    home: "Trang Chủ",
    about: "Trang Giới Thiệu",
    footer: "Footer",
    menu: "Menu Navigation",
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-2">
            <Eye className="h-4 w-4" />
            Xem Trước
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <span>Xem Trước: {typeLabels[type]}</span>
            <div className="flex gap-2">
              <Button
                variant={device === "desktop" ? "default" : "outline"}
                size="sm"
                onClick={() => setDevice("desktop")}
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                variant={device === "tablet" ? "default" : "outline"}
                size="sm"
                onClick={() => setDevice("tablet")}
              >
                <Tablet className="h-4 w-4" />
              </Button>
              <Button
                variant={device === "mobile" ? "default" : "outline"}
                size="sm"
                onClick={() => setDevice("mobile")}
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto bg-muted p-4 rounded-lg">
          <div
            className={cn(
              "mx-auto bg-background rounded-lg shadow-lg overflow-hidden transition-all duration-300",
              device === "mobile" && "max-w-[375px]",
              device === "tablet" && "max-w-[768px]"
            )}
            style={{ maxWidth: deviceWidths[device] }}
          >
            {renderPreview()}
          </div>
        </div>

        <div className="flex-shrink-0 pt-4 text-center text-xs text-muted-foreground">
          Đây là bản xem trước. Nhấn "Lưu" để áp dụng thay đổi.
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ConfigPreview;
