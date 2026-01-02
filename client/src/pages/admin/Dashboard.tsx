import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Package, FileText, MessageSquare, Users, TrendingUp, 
  Mail, ArrowUpRight, ArrowDownRight, Calendar, Clock,
  BarChart3, PieChart, Activity, Zap, Briefcase, Building2
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
  LineChart,
  Line,
} from "recharts";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdvancedAnalytics } from "@/components/AdvancedAnalytics";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  
  // Fetch real analytics data
  const { data: dashboardStats } = trpc.analytics.getDashboardStats.useQuery();
  const { data: contactsByPeriod } = trpc.analytics.getContactsByPeriod.useQuery({ period: timeRange });
  const { data: applicationsByPeriod } = trpc.analytics.getApplicationsByPeriod.useQuery({ period: timeRange });
  const { data: contactStatusDist } = trpc.analytics.getContactStatusDistribution.useQuery();
  const { data: applicationStatusDist } = trpc.analytics.getApplicationStatusDistribution.useQuery();
  const { data: monthlySummary } = trpc.analytics.getMonthlySummary.useQuery();

  // Fetch additional data
  const { data: products } = trpc.products.listAll.useQuery();
  const { data: contacts } = trpc.contacts.list.useQuery({});
  const { data: categories } = trpc.categories.listAll.useQuery();

  // Calculate category distribution
  const categoryData = useMemo(() => {
    if (!products || !categories) return [];
    return categories.map(cat => ({
      name: cat.name,
      value: products.filter(p => p.categoryId === cat.id).length,
    })).filter(item => item.value > 0);
  }, [products, categories]);

  // Merge contacts and applications by date for chart
  const timeSeriesData = useMemo(() => {
    if (!contactsByPeriod && !applicationsByPeriod) return [];
    
    const dateMap = new Map<string, { date: string; contacts: number; applications: number }>();
    
    contactsByPeriod?.forEach(item => {
      const existing = dateMap.get(item.date) || { date: item.date, contacts: 0, applications: 0 };
      existing.contacts = item.count;
      dateMap.set(item.date, existing);
    });
    
    applicationsByPeriod?.forEach(item => {
      const existing = dateMap.get(item.date) || { date: item.date, contacts: 0, applications: 0 };
      existing.applications = item.count;
      dateMap.set(item.date, existing);
    });
    
    return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [contactsByPeriod, applicationsByPeriod]);

  const newContacts = contacts?.filter(c => c.status === "new") || [];

  const stats = [
    {
      title: "Sản Phẩm",
      value: dashboardStats?.products || 0,
      subValue: `${products?.filter(p => p.isActive === "true").length || 0} đang hiển thị`,
      icon: Package,
      href: "/admin/products",
      color: "bg-blue-500",
    },
    {
      title: "Bài Viết",
      value: dashboardStats?.news || 0,
      subValue: "Tin tức & Sự kiện",
      icon: FileText,
      href: "/admin/news",
      color: "bg-green-500",
    },
    {
      title: "Liên Hệ",
      value: dashboardStats?.contacts || 0,
      subValue: `${dashboardStats?.newContacts || 0} mới trong 7 ngày`,
      icon: MessageSquare,
      href: "/admin/contacts",
      color: "bg-orange-500",
      highlight: (dashboardStats?.newContacts || 0) > 0,
    },
    {
      title: "Đơn Ứng Tuyển",
      value: dashboardStats?.applications || 0,
      subValue: `${dashboardStats?.newApplications || 0} mới trong 7 ngày`,
      icon: Briefcase,
      href: "/admin/applications",
      color: "bg-purple-500",
      highlight: (dashboardStats?.newApplications || 0) > 0,
    },
    {
      title: "Newsletter",
      value: dashboardStats?.subscribers || 0,
      subValue: "Người đăng ký",
      icon: Mail,
      href: "/admin/newsletter",
      color: "bg-pink-500",
    },
    {
      title: "Đối Tác",
      value: dashboardStats?.partners || 0,
      subValue: "Khách hàng & Đối tác",
      icon: Building2,
      href: "/admin/partners",
      color: "bg-teal-500",
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
            Dashboard Analytics
          </h1>
          <p className="text-muted-foreground mt-2">
            Xin chào, <span className="font-semibold text-foreground">{user?.name || "Admin"}</span>! 
            Đây là tổng quan hệ thống với dữ liệu thực.
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
              Dữ liệu realtime từ database
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className={`hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4 border-l-primary hover:scale-[1.02] ${stat.highlight ? 'ring-2 ring-orange-500/50' : ''}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-heading">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.subValue}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Time Series Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 font-heading">
                  <TrendingUp className="h-5 w-5 text-chart-1" />
                  Liên Hệ & Ứng Tuyển Theo Thời Gian
                </CardTitle>
                <CardDescription>Dữ liệu thực từ database</CardDescription>
              </div>
              <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
                <TabsList className="grid grid-cols-4 w-[280px]">
                  <TabsTrigger value="7d">7 ngày</TabsTrigger>
                  <TabsTrigger value="30d">30 ngày</TabsTrigger>
                  <TabsTrigger value="90d">90 ngày</TabsTrigger>
                  <TabsTrigger value="1y">1 năm</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {timeSeriesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeSeriesData}>
                    <defs>
                      <linearGradient id="colorContacts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF8042" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#FF8042" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorApplications" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs"
                      tickFormatter={(value) => new Date(value).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}
                    />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--background))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                      labelFormatter={(value) => new Date(value).toLocaleDateString("vi-VN")}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="contacts" 
                      name="Liên hệ"
                      stroke="#FF8042" 
                      fillOpacity={1} 
                      fill="url(#colorContacts)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="applications" 
                      name="Ứng tuyển"
                      stroke="#8884d8" 
                      fillOpacity={1} 
                      fill="url(#colorApplications)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p>Chưa có dữ liệu trong khoảng thời gian này</p>
                  </div>
                </div>
              )}
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
                      innerRadius={50}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((_, index) => (
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <MessageSquare className="h-5 w-5 text-chart-1" />
              Trạng Thái Liên Hệ
            </CardTitle>
            <CardDescription>Phân bố theo trạng thái</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {contactStatusDist && contactStatusDist.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={contactStatusDist} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#FF8042" radius={[0, 4, 4, 0]} />
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

        {/* Application Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <Briefcase className="h-5 w-5 text-chart-1" />
              Trạng Thái Ứng Tuyển
            </CardTitle>
            <CardDescription>Phân bố theo trạng thái</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {applicationStatusDist && applicationStatusDist.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={applicationStatusDist} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]} />
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

        {/* Monthly Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <BarChart3 className="h-5 w-5 text-chart-1" />
              Tổng Hợp 12 Tháng
            </CardTitle>
            <CardDescription>Liên hệ & Ứng tuyển theo tháng</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {monthlySummary && monthlySummary.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlySummary}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="contacts" name="Liên hệ" stroke="#FF8042" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="applications" name="Ứng tuyển" stroke="#8884d8" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
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
              <Link href="/admin/jobs/new">
                <div className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-500/5 hover:from-purple-500/20 hover:to-purple-500/10 border border-purple-500/20 transition-all duration-300 rounded-lg cursor-pointer text-center group">
                  <Briefcase className="h-8 w-8 mx-auto mb-2 text-purple-500 group-hover:scale-110 transition-transform" />
                  <p className="font-medium">Thêm Việc Làm</p>
                </div>
              </Link>
              <Link href="/admin/partners/new">
                <div className="p-4 bg-gradient-to-br from-teal-500/10 to-teal-500/5 hover:from-teal-500/20 hover:to-teal-500/10 border border-teal-500/20 transition-all duration-300 rounded-lg cursor-pointer text-center group">
                  <Building2 className="h-8 w-8 mx-auto mb-2 text-teal-500 group-hover:scale-110 transition-transform" />
                  <p className="font-medium">Thêm Đối Tác</p>
                </div>
              </Link>
              <Link href="/admin/contacts">
                <div className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-500/5 hover:from-orange-500/20 hover:to-orange-500/10 border border-orange-500/20 transition-all duration-300 rounded-lg cursor-pointer text-center group">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-orange-500 group-hover:scale-110 transition-transform" />
                  <p className="font-medium">Xem Liên Hệ</p>
                </div>
              </Link>
              <Link href="/admin/users">
                <div className="p-4 bg-gradient-to-br from-pink-500/10 to-pink-500/5 hover:from-pink-500/20 hover:to-pink-500/10 border border-pink-500/20 transition-all duration-300 rounded-lg cursor-pointer text-center group">
                  <Users className="h-8 w-8 mx-auto mb-2 text-pink-500 group-hover:scale-110 transition-transform" />
                  <p className="font-medium">Quản Lý Users</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics Section */}
      <div className="mt-12 pt-8 border-t">
        <div className="mb-6">
          <h2 className="text-2xl font-heading font-bold uppercase flex items-center gap-3">
            <Zap className="h-6 w-6 text-primary" />
            Advanced Analytics
          </h2>
          <p className="text-muted-foreground mt-2">Chi tiết phân tích nâng cao về traffic, conversion, và hành vi người dùng</p>
        </div>
        <AdvancedAnalytics timeRange={timeRange} />
      </div>
    </div>
  );
}
