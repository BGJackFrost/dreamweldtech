import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, 
  Package, 
  FileText, 
  MessageSquare, 
  Settings, 
  LogOut,
  Menu,
  X,
  Home,
  FolderTree,
  Layout,
  Newspaper,
  HelpCircle,
  Award,
  Users,
  Send,
  FileBarChart,
  Mail,
  Briefcase,
  Image as ImageIcon,
  Handshake,
  Database,
  Sliders,
  Images,
  Globe,
  Moon,
  Sun,
  Upload,
  ChevronDown,
  Search,
  Plus,
  BarChart3,
  ChevronRight,
  Shield,
  Key,
  Smartphone
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect, useMemo } from "react";
import { NotificationBell } from "@/components/NotificationBell";
import { NotificationSettings } from "@/components/admin/NotificationSettings";
import { useAdminTheme } from "@/components/AdminThemeProvider";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAdminTranslation } from "@/hooks/useAdminTranslation";

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface MenuCategory {
  label: string;
  items: Array<{
    href: string;
    icon: any;
    label: string;
  }>;
}

// Menu categories will be generated inside component using translations
const getMenuCategories = (t: any): MenuCategory[] => [
  {
    label: t.dashboard?.overview || "Tổng Quan",
    items: [
      { href: "/admin", icon: LayoutDashboard, label: t.menu?.dashboard || "Dashboard" },
    ],
  },
  {
    label: t.menu?.contentManagement || "Quản Lý Nội Dung",
    items: [
      { href: "/admin/homepage", icon: Layout, label: t.menu?.homepage || "Trang Chủ" },
      { href: "/admin/products", icon: Package, label: t.menu?.products || "Sản Phẩm" },
      { href: "/admin/categories", icon: FolderTree, label: t.menu?.categories || "Danh Mục" },
      { href: "/admin/news", icon: Newspaper, label: t.menu?.news || "Tin Tức" },
      { href: "/admin/faq", icon: HelpCircle, label: t.menu?.faq || "FAQ" },
      { href: "/admin/case-studies", icon: Award, label: t.menu?.caseStudies || "Case Studies" },
      { href: "/admin/portfolio", icon: ImageIcon, label: t.menu?.portfolio || "Portfolio" },
    ],
  },
  {
    label: t.menu?.customerRelations || "Quan Hệ Khách Hàng",
    items: [
      { href: "/admin/partners", icon: Handshake, label: t.menu?.partners || "Đối Tác" },
      { href: "/admin/newsletter", icon: Send, label: t.menu?.newsletter || "Newsletter" },
      { href: "/admin/email-campaign", icon: Mail, label: t.menu?.emailMarketing || "Email Marketing" },
      { href: "/admin/contacts", icon: MessageSquare, label: t.menu?.contacts || "Liên Hệ" },
    ],
  },
  {
    label: t.menu?.humanResources || "Nhân Sự",
    items: [
      { href: "/admin/jobs", icon: Briefcase, label: t.menu?.careers || "Tuyển Dụng" },
      { href: "/admin/applications", icon: FileText, label: t.menu?.applications || "Đơn Ứng Tuyển" },
      { href: "/admin/users", icon: Users, label: t.menu?.users || "Người Dùng" },
    ],
  },
  {
    label: t.menu?.reportsConfig || "Báo Cáo & Cấu Hình",
    items: [
      { href: "/admin/reports", icon: FileBarChart, label: t.menu?.reports || "Báo Cáo" },
      { href: "/admin/backup", icon: Database, label: t.menu?.backup || "Sao Lưu" },
      { href: "/admin/site-settings", icon: Sliders, label: t.menu?.siteSettings || "Cấu Hình Website" },
      { href: "/admin/banners", icon: Images, label: t.menu?.banners || "Banner/Slider" },
      { href: "/admin/multi-language-settings", icon: Globe, label: t.menu?.multiLanguage || "Đa Ngôn Ngữ" },
      { href: "/admin/translations", icon: Globe, label: t.menu?.translations || "Quản Lý Bản Dịch" },
      { href: "/admin/bulk-import-export", icon: Database, label: t.menu?.importExport || "Import/Export" },
      { href: "/admin/activity-log", icon: FileBarChart, label: t.menu?.activityLog || "Activity Log" },
      { href: "/admin/notification-center", icon: Send, label: t.menu?.notifications || "Notification Center" },
      { href: "/admin/permission-matrix", icon: Users, label: t.menu?.permissions || "Permission Matrix" },
      { href: "/admin/settings", icon: Settings, label: t.menu?.settings || "Cài Đặt" },
    ],
  },
  {
    label: t.menu?.security || "Bảo Mật",
    items: [
      { href: "/admin/security/2fa", icon: Smartphone, label: t.menu?.twoFactor || "Xác Thực 2 Yếu Tố" },
      { href: "/admin/security/sessions", icon: Key, label: t.menu?.sessions || "Phiên Đăng Nhập" },
    ],
  },
];

const getQuickActions = (t: any) => [
  { label: t.actions?.createProduct || "Tạo Sản Phẩm", href: "/admin/products/new", icon: Plus },
  { label: t.actions?.viewReports || "Xem Báo Cáo", href: "/admin/reports", icon: BarChart3 },
  { label: t.actions?.sendNewsletter || "Gửi Newsletter", href: "/admin/newsletter", icon: Send },
];

// Get breadcrumb from current path
function getBreadcrumb(pathname: string, menuCats: MenuCategory[]) {
  const pathParts = pathname.split("/").filter(Boolean);
  const breadcrumbs = [];

  for (let i = 0; i < pathParts.length; i++) {
    const path = "/" + pathParts.slice(0, i + 1).join("/");
    let label = pathParts[i];

    // Find label from menu
    for (const category of menuCats) {
      const item = category.items.find((menuItem) => menuItem.href === path);
      if (item) {
        label = item.label;
        break;
      }
    }

    breadcrumbs.push({ label, path });
  }

  return breadcrumbs;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading, logout } = useAuth({ redirectOnUnauthenticated: true });
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useAdminTheme();
  const { adminT } = useAdminTranslation();
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");

  // Generate menu categories with translations
  const menuCategories = useMemo(() => getMenuCategories(adminT), [adminT]);
  const quickActions = useMemo(() => getQuickActions(adminT), [adminT]);

  // Initialize expanded categories based on current location
  useEffect(() => {
    const expanded: Record<string, boolean> = {};
    menuCategories.forEach((category: MenuCategory) => {
      const isActive = category.items.some(
        (item) => location === item.href || (item.href !== "/admin" && location.startsWith(item.href))
      );
      expanded[category.label] = isActive;
    });
    setExpandedCategories(expanded);
  }, [location, menuCategories]);

  const toggleCategory = (categoryLabel: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryLabel]: !prev[categoryLabel],
    }));
  };

  // Keyboard shortcut for search (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.getElementById("admin-menu-search") as HTMLInputElement;
        searchInput?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter menu items based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return menuCategories;
    return menuCategories
      .map((category) => ({
        ...category,
        items: category.items.filter((item) =>
          item.label.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      }))
      .filter((category) => category.items.length > 0);
  }, [searchQuery]);

  const breadcrumbs = getBreadcrumb(location, menuCategories);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to admin login page
    window.location.href = '/admin/login';
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Đang chuyển hướng đến trang đăng nhập...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === "dark"
        ? "bg-slate-950 text-slate-50"
        : "bg-secondary/30 text-foreground"
    }`}>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-primary text-white z-50 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-chart-1 rounded flex items-center justify-center font-heading font-bold">
            D
          </div>
          <span className="font-heading font-bold">ADMIN</span>
        </Link>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-white hover:bg-white/10"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 text-white z-40
        transform transition-all duration-300 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        ${theme === "dark" ? "bg-slate-900" : "bg-primary"}
        flex flex-col
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-white/10 flex-shrink-0">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-chart-1 rounded flex items-center justify-center font-heading font-bold text-lg">
              D
            </div>
            <div>
              <span className="font-heading font-bold text-lg block">DREAMWELDTECH</span>
              <span className="text-xs text-white/60">Admin Panel</span>
            </div>
          </Link>
        </div>

        {/* Search Box */}
        <div className="p-4 border-b border-white/10 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
            <input
              id="admin-menu-search"
              type="text"
              placeholder="Tìm menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/50 focus:outline-none focus:border-white/40 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <div className="text-xs text-white/40 mt-2">Cmd+K để tìm kiếm</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          {(searchQuery ? filteredCategories : menuCategories).map((category) => {
            const isExpanded = expandedCategories[category.label] ?? false;
            return (
              <div key={category.label}>
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.label)}
                  className="w-full flex items-center justify-between px-4 py-2 rounded text-white/70 hover:bg-white/10 hover:text-white transition-colors text-sm font-semibold uppercase tracking-wider"
                >
                  <span>{category.label}</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Category Items */}
                {isExpanded && (
                  <div className="space-y-1 pl-2 pr-2">
                    {category.items.map((item) => {
                      const isActive = location === item.href || 
                        (item.href !== "/admin" && location.startsWith(item.href));
                      return (
                        <Link key={item.href} href={item.href}>
                          <div
                            className={`
                              flex items-center gap-3 px-4 py-2 rounded transition-colors text-sm truncate
                              ${isActive 
                                ? "bg-chart-1 text-white" 
                                : "text-white/70 hover:bg-white/10 hover:text-white"
                              }
                            `}
                            onClick={() => {
                              setSidebarOpen(false);
                              setSearchQuery("");
                            }}
                          >
                            <item.icon className="h-4 w-4 flex-shrink-0" />
                            <span className="font-medium">{item.label}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate text-sm">{user.name || "Admin"}</p>
              <p className="text-xs text-white/60 truncate">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="flex-1">
              <Button variant="outline" size="sm" className="w-full bg-transparent border-white/20 text-white hover:bg-white/10 text-xs">
                <Home className="h-4 w-4 mr-2" />
                Trang chủ
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-transparent border-white/20 text-white hover:bg-white/10"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={`lg:ml-64 pt-16 lg:pt-0 min-h-screen transition-colors duration-300 ${
        theme === "dark" ? "bg-slate-950" : "bg-background"
      }`}>
        {/* Desktop Header with Breadcrumb & Quick Actions */}
        <div className={`hidden lg:block border-b transition-colors duration-300 ${
          theme === "dark"
            ? "bg-slate-900 border-slate-800"
            : "bg-background border-border"
        }`}>
          {/* Breadcrumb */}
          <div className="px-8 py-3 flex items-center gap-2 text-sm">
            <Link href="/admin">
              <span className="text-muted-foreground hover:text-foreground cursor-pointer">Admin</span>
            </Link>
            {breadcrumbs.map((crumb, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <Link href={crumb.path}>
                  <span className={`cursor-pointer ${
                    idx === breadcrumbs.length - 1
                      ? "text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}>
                    {crumb.label}
                  </span>
                </Link>
              </div>
            ))}
          </div>

          {/* Quick Actions & Notifications */}
          <div className="px-8 py-3 flex items-center justify-between border-t border-border/50">
            <div className="flex items-center gap-2">
              {quickActions.map((action) => (
                <Link key={action.href} href={action.href}>
                  <Button variant="outline" size="sm" className="text-xs">
                    <action.icon className="h-4 w-4 mr-2" />
                    {action.label}
                  </Button>
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className={`transition-colors ${
                  theme === "dark"
                    ? "hover:bg-slate-800 text-slate-400"
                    : "hover:bg-secondary text-muted-foreground"
                }`}
                title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              >
                {theme === "light" ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </Button>
              <LanguageSwitcher />
              <NotificationSettings />
              <NotificationBell />
            </div>
          </div>
        </div>

        <div className={`p-6 lg:p-8 transition-colors duration-300 ${
          theme === "dark" ? "bg-slate-950" : "bg-background"
        }`}>
          <div className={`transition-colors duration-300 ${
            theme === "dark" ? "text-slate-50" : "text-foreground"
          }`}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
