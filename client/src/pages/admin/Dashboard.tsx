import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Package, FileText, MessageSquare, Settings, Users, TrendingUp, 
  Mail, Eye, ArrowUpRight, ArrowDownRight, Calendar, Clock,
  BarChart3, PieChart, Activity, Zap
} from "lucide-react";
import { Link } from "wouter";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data for charts - in production, this would come from API
const generateMonthlyData = () => {
  const months = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
  return months.map((month, index) => ({
    name: month,
    visitors: Math.floor(Math.random() * 5000) + 1000,
    pageViews: Math.floor(Math.random() * 15000) + 3000,
    contacts: Math.floor(Math.random() * 50) + 10,
  }));
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  
  const { data: products } = trpc.products.listAll.useQuery();
  const { data: news } = trpc.news.listAll.useQuery();
  const { data: contacts } = trpc.contacts.list.useQuery({});
  const { data: categories } = trpc.categories.listAll.useQuery();
  const { data: subscribers } = trpc.newsletter.list.useQuery({});
  const { data: faqs } = trpc.faq.list.useQuery();

  const monthlyData = useMemo(() => generateMonthlyData(), []);

  // Calculate stats
  const totalProducts = products?.length || 0;
  const activeProducts = products?.filter(p => p.isActive === "true").length || 0;
  const totalNews = news?.length || 0;
  const publishedNews = news?.filter(n => n.isPublished === "true").length || 0;
  const totalContacts = contacts?.length || 0;
  const newContacts = contacts?.filter(c => c.status === "new") || [];
  const totalSubscribers = subscribers?.length || 0;
  const activeSubscribers = subscribers?.filter(s => s.status === "active").length || 0;

  // Category distribution for pie chart
  const categoryData = useMemo(() => {
    if (!products || !categories) return [];
    return categories.map(cat => ({
      name: cat.name,
      value: products.filter(p => p.categoryId === cat.id).length,
    })).filter(item => item.value > 0);
  }, [products, categories]);

  // Contact status distribution
  const contactStatusData = useMemo(() => {
    if (!contacts) return [];
    const statusCounts: Record<string, number> = {};
    contacts.forEach(c => {
      statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([name, value]) => ({
      name: name === "new" ? "Mới" : name === "processing" ? "Đang xử lý" : "Đã xử lý",
      value,
    }));
  }, [contacts]);

  const stats = [
    {
      title: "Sản Phẩm",
      value: totalProducts,
      subValue: `${activeProducts} đang hiển thị`,
      icon: Package,
      href: "/admin/products",
      color: "bg-blue-500",
      trend: "+12%",
      trendUp: true,
    },
    {
      title: "Bài Viết",
      value: totalNews,
      subValue: `${publishedNews} đã xuất bản`,
      icon: FileText,
      href: "/admin/news",
      color: "bg-green-500",
      trend: "+8%",
      trendUp: true,
    },
    {
      title: "Yêu Cầu Liên Hệ",
      value: totalContacts,
      subValue: `${newContacts.length} chưa xử lý`,
      icon: MessageSquare,
      href: "/admin/contacts",
      color: "bg-orange-500",
      trend: "+23%",
      trendUp: true,
    },
    {
      title: "Newsletter",
      value: totalSubscribers,
      subValue: `${activeSubscribers} đang hoạt động`,
      icon: Mail,
      href: "/admin/newsletter",
      color: "bg-purple-500",
      trend: "+15%",
      trendUp: true,
    },
  ];

  const currentDate = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary uppercase flex items-center gap-3">
            <Activity className="h-8 w-8" />
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Xin chào, <span className="font-semibold text-foreground">{user?.name || "Admin"}</span>! 
            Đây là tổng quan hệ thống.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {currentDate}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
              <Clock className="h-3 w-3" />
              Cập nhật lần cuối: vừa xong
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4 border-l-primary hover:scale-[1.02]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-bold font-heading">{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">{stat.subValue}</p>
                  </div>
                  <Badge 
                    variant={stat.trendUp ? "default" : "destructive"} 
                    className="flex items-center gap-1"
                  >
                    {stat.trendUp ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {stat.trend}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traffic Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 font-heading">
                  <BarChart3 className="h-5 w-5 text-chart-1" />
                  Thống Kê Truy Cập
                </CardTitle>
                <CardDescription>Lượt truy cập và liên hệ theo tháng</CardDescription>
              </div>
              <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
                <TabsList className="grid grid-cols-3 w-[200px]">
                  <TabsTrigger value="7d">7 ngày</TabsTrigger>
                  <TabsTrigger value="30d">30 ngày</TabsTrigger>
                  <TabsTrigger value="90d">90 ngày</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0088FE" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#0088FE" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPageViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00C49F" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#00C49F" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--background))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }} 
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="visitors" 
                    name="Lượt truy cập"
                    stroke="#0088FE" 
                    fillOpacity={1} 
                    fill="url(#colorVisitors)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="pageViews" 
                    name="Lượt xem trang"
                    stroke="#00C49F" 
                    fillOpacity={1} 
                    fill="url(#colorPageViews)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <PieChart className="h-5 w-5 text-chart-1" />
              Phân Bố Sản Phẩm
            </CardTitle>
            <CardDescription>Theo danh mục</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Chưa có dữ liệu
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <MessageSquare className="h-5 w-5 text-chart-1" />
              Trạng Thái Liên Hệ
            </CardTitle>
            <CardDescription>Phân bố theo trạng thái xử lý</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {contactStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={contactStatusData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#0088FE" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Chưa có dữ liệu
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <TrendingUp className="h-5 w-5 text-chart-1" />
              Liên Hệ Theo Tháng
            </CardTitle>
            <CardDescription>Số lượng yêu cầu liên hệ mỗi tháng</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="contacts" name="Liên hệ" fill="#FF8042" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Contacts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 font-heading uppercase">
                <MessageSquare className="h-5 w-5 text-chart-1" />
                Yêu Cầu Mới Nhất
              </CardTitle>
              <CardDescription>Các yêu cầu liên hệ chưa xử lý</CardDescription>
            </div>
            <Link href="/admin/contacts">
              <Button variant="outline" size="sm">
                Xem tất cả
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {newContacts.length > 0 ? (
              <div className="space-y-4">
                {newContacts.slice(0, 5).map((contact) => (
                  <div key={contact.id} className="flex items-start gap-4 p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-semibold">
                        {contact.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{contact.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{contact.email}</p>
                      <p className="text-sm mt-1 line-clamp-1">{contact.message}</p>
                    </div>
                    <Badge variant="outline" className="flex-shrink-0">
                      {contact.requestType}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">Không có yêu cầu mới</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading uppercase">
              <Zap className="h-5 w-5 text-chart-1" />
              Thao Tác Nhanh
            </CardTitle>
            <CardDescription>Các hành động thường dùng</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/admin/products/new">
                <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 hover:from-blue-500/20 hover:to-blue-500/10 border border-blue-500/20 transition-all duration-300 rounded-lg cursor-pointer text-center group">
                  <Package className="h-8 w-8 mx-auto mb-2 text-blue-500 group-hover:scale-110 transition-transform" />
                  <p className="font-medium">Thêm Sản Phẩm</p>
                </div>
              </Link>
              <Link href="/admin/news/new">
                <div className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 hover:from-green-500/20 hover:to-green-500/10 border border-green-500/20 transition-all duration-300 rounded-lg cursor-pointer text-center group">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-green-500 group-hover:scale-110 transition-transform" />
                  <p className="font-medium">Thêm Bài Viết</p>
                </div>
              </Link>
              <Link href="/admin/homepage">
                <div className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 hover:from-purple-500/20 hover:to-purple-500/10 border border-purple-500/20 transition-all duration-300 rounded-lg cursor-pointer text-center group">
                  <Eye className="h-8 w-8 mx-auto mb-2 text-purple-500 group-hover:scale-110 transition-transform" />
                  <p className="font-medium">Chỉnh Trang Chủ</p>
                </div>
              </Link>
              <Link href="/admin/settings">
                <div className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-500/5 hover:from-orange-500/20 hover:to-orange-500/10 border border-orange-500/20 transition-all duration-300 rounded-lg cursor-pointer text-center group">
                  <Settings className="h-8 w-8 mx-auto mb-2 text-orange-500 group-hover:scale-110 transition-transform" />
                  <p className="font-medium">Cài Đặt Website</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading uppercase">
            <Activity className="h-5 w-5 text-chart-1" />
            Thông Tin Hệ Thống
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-secondary/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Danh Mục</p>
              <p className="text-2xl font-bold">{categories?.length || 0}</p>
            </div>
            <div className="p-4 bg-secondary/50 rounded-lg">
              <p className="text-sm text-muted-foreground">FAQ</p>
              <p className="text-2xl font-bold">{faqs?.length || 0}</p>
            </div>
            <div className="p-4 bg-secondary/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Subscribers</p>
              <p className="text-2xl font-bold">{totalSubscribers}</p>
            </div>
            <div className="p-4 bg-secondary/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Trạng Thái</p>
              <p className="text-2xl font-bold text-green-500">Online</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
