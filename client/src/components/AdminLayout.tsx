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
  Sliders
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { NotificationBell } from "@/components/NotificationBell";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/homepage", icon: Layout, label: "Trang Chủ" },
  { href: "/admin/products", icon: Package, label: "Sản Phẩm" },
  { href: "/admin/categories", icon: FolderTree, label: "Danh Mục" },
  { href: "/admin/news", icon: Newspaper, label: "Tin Tức" },
  { href: "/admin/faq", icon: HelpCircle, label: "FAQ" },
  { href: "/admin/case-studies", icon: Award, label: "Case Studies" },
  { href: "/admin/portfolio", icon: ImageIcon, label: "Portfolio" },
  { href: "/admin/partners", icon: Handshake, label: "Đối Tác" },
  { href: "/admin/newsletter", icon: Send, label: "Newsletter" },
  { href: "/admin/email-campaign", icon: Mail, label: "Email Marketing" },
  { href: "/admin/contacts", icon: MessageSquare, label: "Liên Hệ" },
  { href: "/admin/users", icon: Users, label: "Người Dùng" },
  { href: "/admin/jobs", icon: Briefcase, label: "Tuyển Dụng" },
  { href: "/admin/applications", icon: FileText, label: "Đơn Ứng Tuyển" },
  { href: "/admin/reports", icon: FileBarChart, label: "Báo Cáo" },
  { href: "/admin/backup", icon: Database, label: "Sao Lưu" },
  { href: "/admin/site-settings", icon: Sliders, label: "Cấu Hình Website" },
  { href: "/admin/settings", icon: Settings, label: "Cài Đặt" },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading, logout } = useAuth({ redirectOnUnauthenticated: true });
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-heading font-bold mb-4">Yêu Cầu Đăng Nhập</h1>
          <p className="text-muted-foreground mb-6">Bạn cần đăng nhập để truy cập trang quản trị.</p>
          <Button onClick={() => window.location.href = getLoginUrl()}>
            Đăng Nhập
          </Button>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-secondary/30">
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
        fixed top-0 left-0 h-full w-64 bg-primary text-white z-40
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-white/10">
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

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location === item.href || 
              (item.href !== "/admin" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded transition-colors
                    ${isActive 
                      ? "bg-chart-1 text-white" 
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user.name || "Admin"}</p>
              <p className="text-xs text-white/60 truncate">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="flex-1">
              <Button variant="outline" size="sm" className="w-full bg-transparent border-white/20 text-white hover:bg-white/10">
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
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        {/* Desktop Header with Notifications */}
        <div className="hidden lg:flex h-16 items-center justify-end px-8 border-b bg-background">
          <NotificationBell />
        </div>
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
