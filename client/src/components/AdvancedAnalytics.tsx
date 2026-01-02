import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ComposedChart,
} from "recharts";
import { TrendingUp, Users, MousePointerClick, Zap } from "lucide-react";
import { useState, useMemo } from "react";

interface AdvancedAnalyticsProps {
  contactsByPeriod?: Array<{ date: string; count: number }>;
  applicationsByPeriod?: Array<{ date: string; count: number }>;
  timeRange: "7d" | "30d" | "90d" | "1y";
}

// Mock data for advanced analytics
const generateMockTrafficData = (days: number) => {
  const data = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    data.push({
      date: date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
      fullDate: date.toISOString().slice(0, 10),
      pageViews: Math.floor(Math.random() * 500) + 100,
      uniqueVisitors: Math.floor(Math.random() * 300) + 50,
      bounceRate: Math.floor(Math.random() * 40) + 20,
      avgSessionDuration: Math.floor(Math.random() * 300) + 60,
    });
  }
  return data;
};

const generateMockConversionData = (days: number) => {
  const data = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    data.push({
      date: date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
      fullDate: date.toISOString().slice(0, 10),
      clicks: Math.floor(Math.random() * 200) + 50,
      conversions: Math.floor(Math.random() * 50) + 10,
      conversionRate: (Math.random() * 15 + 5).toFixed(2),
      revenue: Math.floor(Math.random() * 5000) + 1000,
    });
  }
  return data;
};

const generateMockPageData = () => {
  return [
    { page: "/products", views: 1250, avgTime: 245, bounceRate: 32 },
    { page: "/news", views: 890, avgTime: 180, bounceRate: 45 },
    { page: "/contact", views: 650, avgTime: 120, bounceRate: 28 },
    { page: "/careers", views: 520, avgTime: 340, bounceRate: 22 },
    { page: "/about", views: 450, avgTime: 210, bounceRate: 35 },
    { page: "/portfolio", views: 380, avgTime: 290, bounceRate: 38 },
  ];
};

const generateMockUserBehavior = () => {
  return [
    { hour: "00:00", users: 45, sessions: 52, bounces: 18 },
    { hour: "04:00", users: 32, sessions: 38, bounces: 12 },
    { hour: "08:00", users: 120, sessions: 145, bounces: 35 },
    { hour: "12:00", users: 280, sessions: 320, bounces: 85 },
    { hour: "16:00", users: 350, sessions: 420, bounces: 110 },
    { hour: "20:00", users: 290, sessions: 340, bounces: 95 },
    { hour: "23:00", users: 150, sessions: 180, bounces: 50 },
  ];
};

export function AdvancedAnalytics({ timeRange }: AdvancedAnalyticsProps) {
  const [activeTab, setActiveTab] = useState("traffic");

  const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 365;
  const trafficData = useMemo(() => generateMockTrafficData(days), [days]);
  const conversionData = useMemo(() => generateMockConversionData(days), [days]);
  const pageData = useMemo(() => generateMockPageData(), []);
  const userBehavior = useMemo(() => generateMockUserBehavior(), []);

  // Calculate metrics
  const totalPageViews = trafficData.reduce((sum, d) => sum + d.pageViews, 0);
  const totalVisitors = trafficData.reduce((sum, d) => sum + d.uniqueVisitors, 0);
  const avgBounceRate = (trafficData.reduce((sum, d) => sum + d.bounceRate, 0) / trafficData.length).toFixed(1);
  const totalConversions = conversionData.reduce((sum, d) => sum + d.conversions, 0);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="conversion">Conversion</TabsTrigger>
          <TabsTrigger value="pages">Top Pages</TabsTrigger>
          <TabsTrigger value="behavior">User Behavior</TabsTrigger>
        </TabsList>

        {/* Traffic Analytics */}
        {activeTab === "traffic" && (
          <div className="space-y-6 mt-6">
            {/* Traffic Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Page Views
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalPageViews.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">Tổng lượt xem trang</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Unique Visitors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalVisitors.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">Khách truy cập duy nhất</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MousePointerClick className="h-4 w-4" />
                    Bounce Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{avgBounceRate}%</div>
                  <p className="text-xs text-muted-foreground mt-1">Tỷ lệ thoát trung bình</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Avg Session
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(trafficData.reduce((sum, d) => sum + d.avgSessionDuration, 0) / trafficData.length).toFixed(0)}s
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Thời gian phiên trung bình</p>
                </CardContent>
              </Card>
            </div>

            {/* Traffic Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-chart-1" />
                  Traffic Trend
                </CardTitle>
                <CardDescription>Lượt xem và khách truy cập theo thời gian</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={trafficData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis yAxisId="left" className="text-xs" />
                      <YAxis yAxisId="right" orientation="right" className="text-xs" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="pageViews" name="Page Views" fill="#8884d8" />
                      <Line yAxisId="right" type="monotone" dataKey="uniqueVisitors" name="Unique Visitors" stroke="#82ca9d" strokeWidth={2} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Conversion Analytics */}
        {activeTab === "conversion" && (
          <div className="space-y-6 mt-6">
            {/* Conversion Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Clicks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {conversionData.reduce((sum, d) => sum + d.clicks, 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Tổng số lần nhấp</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Conversions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalConversions.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">Tổng chuyển đổi</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Avg Conv. Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(conversionData.reduce((sum, d) => sum + parseFloat(d.conversionRate), 0) / conversionData.length).toFixed(2)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Tỷ lệ chuyển đổi trung bình</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${(conversionData.reduce((sum, d) => sum + d.revenue, 0) / 1000).toFixed(1)}K
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Tổng doanh thu ước tính</p>
                </CardContent>
              </Card>
            </div>

            {/* Conversion Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-chart-1" />
                  Conversion Trend
                </CardTitle>
                <CardDescription>Tỷ lệ chuyển đổi và doanh thu theo thời gian</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={conversionData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis yAxisId="left" className="text-xs" />
                      <YAxis yAxisId="right" orientation="right" className="text-xs" />
                      <Tooltip />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="conversions" name="Conversions" stroke="#FF8042" strokeWidth={2} />
                      <Line yAxisId="right" type="monotone" dataKey="conversionRate" name="Conv. Rate %" stroke="#82ca9d" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Top Pages */}
        {activeTab === "pages" && (
          <div className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-chart-1" />
                  Top Pages by Views
                </CardTitle>
                <CardDescription>Các trang được xem nhiều nhất</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pageData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis dataKey="page" type="category" width={100} className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="views" fill="#8884d8" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Page Details Table */}
            <Card>
              <CardHeader>
                <CardTitle>Chi tiết trang</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-2 px-4">Trang</th>
                        <th className="text-right py-2 px-4">Lượt xem</th>
                        <th className="text-right py-2 px-4">Thời gian trung bình</th>
                        <th className="text-right py-2 px-4">Tỷ lệ thoát</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageData.map((page, idx) => (
                        <tr key={idx} className="border-b hover:bg-secondary/50">
                          <td className="py-2 px-4">{page.page}</td>
                          <td className="text-right py-2 px-4">{page.views.toLocaleString()}</td>
                          <td className="text-right py-2 px-4">{page.avgTime}s</td>
                          <td className="text-right py-2 px-4">{page.bounceRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* User Behavior */}
        {activeTab === "behavior" && (
          <div className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-chart-1" />
                  User Activity by Hour
                </CardTitle>
                <CardDescription>Hoạt động người dùng theo giờ trong ngày</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={userBehavior}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="hour" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="users" name="Users" fill="#8884d8" />
                      <Line type="monotone" dataKey="sessions" name="Sessions" stroke="#82ca9d" strokeWidth={2} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Behavior Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Peak Hour</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">16:00</div>
                  <p className="text-xs text-muted-foreground mt-1">Giờ cao điểm với 350 người dùng</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Avg Users/Hour</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(userBehavior.reduce((sum, d) => sum + d.users, 0) / userBehavior.length).toFixed(0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Người dùng trung bình mỗi giờ</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Bounces</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {userBehavior.reduce((sum, d) => sum + d.bounces, 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Tổng số lần thoát</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </Tabs>
    </div>
  );
}
