import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, FileText, MessageSquare, Settings, Users, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { user } = useAuth();
  
  const { data: products } = trpc.products.listAll.useQuery();
  const { data: news } = trpc.news.listAll.useQuery();
  const { data: contacts } = trpc.contacts.list.useQuery({});
  const { data: categories } = trpc.categories.listAll.useQuery();

  const stats = [
    {
      title: "Sản Phẩm",
      value: products?.length || 0,
      icon: Package,
      href: "/admin/products",
      color: "bg-blue-500",
    },
    {
      title: "Danh Mục",
      value: categories?.length || 0,
      icon: Settings,
      href: "/admin/categories",
      color: "bg-purple-500",
    },
    {
      title: "Bài Viết",
      value: news?.length || 0,
      icon: FileText,
      href: "/admin/news",
      color: "bg-green-500",
    },
    {
      title: "Yêu Cầu Liên Hệ",
      value: contacts?.length || 0,
      icon: MessageSquare,
      href: "/admin/contacts",
      color: "bg-orange-500",
    },
  ];

  const newContacts = contacts?.filter(c => c.status === "new") || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold text-primary uppercase">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Xin chào, {user?.name || "Admin"}! Đây là tổng quan hệ thống.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-primary">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded ${stat.color}`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-heading">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Contacts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading uppercase">
              <MessageSquare className="h-5 w-5 text-chart-1" />
              Yêu Cầu Mới Nhất
            </CardTitle>
          </CardHeader>
          <CardContent>
            {newContacts.length > 0 ? (
              <div className="space-y-4">
                {newContacts.slice(0, 5).map((contact) => (
                  <div key={contact.id} className="flex items-start gap-4 p-3 bg-secondary/50 rounded">
                    <div className="flex-1">
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-sm text-muted-foreground">{contact.email}</p>
                      <p className="text-sm mt-1 line-clamp-2">{contact.message}</p>
                    </div>
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded uppercase font-bold">
                      {contact.requestType}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Không có yêu cầu mới</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading uppercase">
              <TrendingUp className="h-5 w-5 text-chart-1" />
              Thao Tác Nhanh
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/admin/products/new">
                <div className="p-4 bg-secondary hover:bg-primary hover:text-white transition-colors rounded cursor-pointer text-center">
                  <Package className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-medium">Thêm Sản Phẩm</p>
                </div>
              </Link>
              <Link href="/admin/news/new">
                <div className="p-4 bg-secondary hover:bg-primary hover:text-white transition-colors rounded cursor-pointer text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-medium">Thêm Bài Viết</p>
                </div>
              </Link>
              <Link href="/admin/categories">
                <div className="p-4 bg-secondary hover:bg-primary hover:text-white transition-colors rounded cursor-pointer text-center">
                  <Settings className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-medium">Quản Lý Danh Mục</p>
                </div>
              </Link>
              <Link href="/admin/settings">
                <div className="p-4 bg-secondary hover:bg-primary hover:text-white transition-colors rounded cursor-pointer text-center">
                  <Users className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-medium">Cài Đặt Website</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
