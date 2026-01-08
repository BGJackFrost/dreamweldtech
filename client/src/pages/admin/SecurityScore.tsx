import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Shield, ShieldCheck, ShieldAlert, ShieldOff,
  AlertTriangle, AlertCircle, CheckCircle2, Info,
  TrendingUp, Users, Lock, Key, Smartphone,
  RefreshCw, Loader2, ChevronRight
} from "lucide-react";
import { Link } from "wouter";

// Grade color mapping
const gradeColors: Record<string, string> = {
  A: "text-green-500 bg-green-100",
  B: "text-blue-500 bg-blue-100",
  C: "text-yellow-500 bg-yellow-100",
  D: "text-orange-500 bg-orange-100",
  F: "text-red-500 bg-red-100",
};

const gradeDescriptions: Record<string, string> = {
  A: "Xuất sắc - Bảo mật tối ưu",
  B: "Tốt - Bảo mật khá tốt",
  C: "Trung bình - Cần cải thiện",
  D: "Yếu - Cần cải thiện ngay",
  F: "Kém - Rủi ro cao",
};

const statusIcons: Record<string, React.ReactNode> = {
  good: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  critical: <AlertCircle className="h-4 w-4 text-red-500" />,
  info: <Info className="h-4 w-4 text-blue-500" />,
};

const priorityColors: Record<string, string> = {
  high: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-blue-100 text-blue-800",
};

export default function SecurityScore() {
  const [activeTab, setActiveTab] = useState("my-score");

  // Queries
  const { data: myScore, isLoading: myScoreLoading, refetch: refetchMyScore } = 
    trpc.advancedSecurity.score.myScore.useQuery();
  const { data: systemScore, isLoading: systemScoreLoading, refetch: refetchSystemScore } = 
    trpc.advancedSecurity.score.systemScore.useQuery();
  const { data: allUsersScores, isLoading: allUsersLoading, refetch: refetchAllUsers } = 
    trpc.advancedSecurity.score.allUsersScores.useQuery();

  const handleRefresh = () => {
    refetchMyScore();
    refetchSystemScore();
    refetchAllUsers();
  };

  // Score Circle Component
  const ScoreCircle = ({ score, maxScore, grade, size = "large" }: { 
    score: number; 
    maxScore: number; 
    grade: string; 
    size?: "small" | "large" 
  }) => {
    const percentage = Math.round((score / maxScore) * 100);
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    
    return (
      <div className={`relative ${size === "large" ? "w-40 h-40" : "w-24 h-24"}`}>
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted/20"
          />
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={grade === "A" || grade === "B" ? "text-green-500" : 
                       grade === "C" ? "text-yellow-500" : "text-red-500"}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-bold ${size === "large" ? "text-4xl" : "text-xl"} ${gradeColors[grade]?.split(" ")[0]}`}>
            {grade}
          </span>
          <span className={`text-muted-foreground ${size === "large" ? "text-sm" : "text-xs"}`}>
            {percentage}%
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Điểm Bảo Mật</h1>
          <p className="text-muted-foreground">
            Đánh giá và cải thiện bảo mật tài khoản và hệ thống
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Làm mới
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-score">
            <Shield className="h-4 w-4 mr-2" />
            Điểm Của Tôi
          </TabsTrigger>
          <TabsTrigger value="system-score">
            <ShieldCheck className="h-4 w-4 mr-2" />
            Điểm Hệ Thống
          </TabsTrigger>
          <TabsTrigger value="all-users">
            <Users className="h-4 w-4 mr-2" />
            Tất Cả Users
          </TabsTrigger>
        </TabsList>

        {/* MY SCORE TAB */}
        <TabsContent value="my-score" className="space-y-6">
          {myScoreLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : myScore ? (
            <>
              {/* Score Overview */}
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-1">
                  <CardHeader className="text-center">
                    <CardTitle>Điểm Bảo Mật</CardTitle>
                    <CardDescription>{gradeDescriptions[myScore.grade]}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center">
                    <ScoreCircle 
                      score={myScore.totalScore} 
                      maxScore={myScore.maxScore} 
                      grade={myScore.grade} 
                    />
                    <p className="mt-4 text-center text-sm text-muted-foreground">
                      {myScore.totalScore} / {myScore.maxScore} điểm
                    </p>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Phân Tích Chi Tiết</CardTitle>
                    <CardDescription>Điểm theo từng danh mục</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {myScore.breakdown.map((category) => (
                      <div key={category.category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{category.categoryLabel}</span>
                          <span className="text-sm text-muted-foreground">
                            {category.score} / {category.maxScore}
                          </span>
                        </div>
                        <Progress value={category.percentage} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Recommendations */}
              {myScore.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Đề Xuất Cải Thiện
                    </CardTitle>
                    <CardDescription>
                      Thực hiện các đề xuất sau để tăng điểm bảo mật
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {myScore.recommendations.map((rec, index) => (
                      <Alert key={index} variant={rec.priority === "high" ? "destructive" : "default"}>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="flex items-center gap-2">
                          {rec.title}
                          <Badge className={priorityColors[rec.priority]}>
                            {rec.priority === "high" ? "Cao" : rec.priority === "medium" ? "Trung bình" : "Thấp"}
                          </Badge>
                          <Badge variant="outline">+{rec.impact} điểm</Badge>
                        </AlertTitle>
                        <AlertDescription className="mt-2">
                          <p>{rec.description}</p>
                          <p className="mt-1 text-sm font-medium">{rec.action}</p>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Detailed Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Chi Tiết Từng Mục</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {myScore.breakdown.map((category) => (
                      <AccordionItem key={category.category} value={category.category}>
                        <AccordionTrigger>
                          <div className="flex items-center gap-4">
                            <span>{category.categoryLabel}</span>
                            <Badge variant="outline">{category.percentage}%</Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3 pt-2">
                            {category.items.map((item, index) => (
                              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                                {statusIcons[item.status]}
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">{item.name}</span>
                                    <span className="text-sm text-muted-foreground">
                                      {item.score} / {item.maxScore}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{item.description}</p>
                                  {item.recommendation && (
                                    <p className="text-sm text-yellow-600 mt-1">{item.recommendation}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Không thể tải điểm bảo mật</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* SYSTEM SCORE TAB */}
        <TabsContent value="system-score" className="space-y-6">
          {systemScoreLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : systemScore ? (
            <>
              {/* System Score Overview */}
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-1">
                  <CardHeader className="text-center">
                    <CardTitle>Điểm Hệ Thống</CardTitle>
                    <CardDescription>{gradeDescriptions[systemScore.grade]}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center">
                    <ScoreCircle 
                      score={systemScore.totalScore} 
                      maxScore={systemScore.maxScore} 
                      grade={systemScore.grade} 
                    />
                    <p className="mt-4 text-center text-sm text-muted-foreground">
                      {systemScore.totalScore} / {systemScore.maxScore} điểm
                    </p>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Phân Tích Hệ Thống</CardTitle>
                    <CardDescription>Điểm bảo mật theo từng lĩnh vực</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {systemScore.breakdown.map((category) => (
                      <div key={category.category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{category.categoryLabel}</span>
                          <span className="text-sm text-muted-foreground">
                            {category.score} / {category.maxScore}
                          </span>
                        </div>
                        <Progress value={category.percentage} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* System Recommendations */}
              {systemScore.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Đề Xuất Cải Thiện Hệ Thống
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {systemScore.recommendations.map((rec, index) => (
                      <Alert key={index} variant={rec.priority === "high" ? "destructive" : "default"}>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="flex items-center gap-2">
                          {rec.title}
                          <Badge className={priorityColors[rec.priority]}>
                            {rec.priority === "high" ? "Cao" : rec.priority === "medium" ? "Trung bình" : "Thấp"}
                          </Badge>
                        </AlertTitle>
                        <AlertDescription className="mt-2">
                          <p>{rec.description}</p>
                          <p className="mt-1 text-sm font-medium">{rec.action}</p>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* System Detailed Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Chi Tiết Cấu Hình Bảo Mật</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {systemScore.breakdown.map((category) => (
                      <AccordionItem key={category.category} value={category.category}>
                        <AccordionTrigger>
                          <div className="flex items-center gap-4">
                            <span>{category.categoryLabel}</span>
                            <Badge variant="outline">{category.percentage}%</Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3 pt-2">
                            {category.items.map((item, index) => (
                              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                                {statusIcons[item.status]}
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">{item.name}</span>
                                    <span className="text-sm text-muted-foreground">
                                      {item.score} / {item.maxScore}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{item.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Không có quyền xem điểm hệ thống</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ALL USERS TAB */}
        <TabsContent value="all-users" className="space-y-6">
          {allUsersLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : allUsersScores ? (
            <>
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Điểm Trung Bình</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{allUsersScores.averageScore}%</div>
                  </CardContent>
                </Card>
                {allUsersScores.distribution.map((dist) => (
                  <Card key={dist.grade}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <span className={`px-2 py-1 rounded ${gradeColors[dist.grade]}`}>
                          {dist.grade}
                        </span>
                        Users
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{dist.count}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Users Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Điểm Bảo Mật Theo User</CardTitle>
                  <CardDescription>Xếp hạng theo điểm bảo mật</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Xếp hạng</TableHead>
                        <TableHead>Tên</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Điểm</TableHead>
                        <TableHead>Xếp loại</TableHead>
                        <TableHead className="text-right">Chi tiết</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allUsersScores.users.map((user, index) => (
                        <TableRow key={user.userId}>
                          <TableCell className="font-medium">#{index + 1}</TableCell>
                          <TableCell>{user.userName}</TableCell>
                          <TableCell className="text-muted-foreground">{user.userEmail}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={user.percentage} className="w-20 h-2" />
                              <span className="text-sm">{user.percentage}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={gradeColors[user.grade]}>
                              {user.grade}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/admin/users/${user.userId}`}>
                                <ChevronRight className="h-4 w-4" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {allUsersScores.users.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            Không có dữ liệu
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Không có quyền xem điểm users</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Hành Động Nhanh</CardTitle>
          <CardDescription>Các bước để cải thiện bảo mật</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button variant="outline" className="h-auto py-4" asChild>
              <Link href="/admin/security/2fa">
                <div className="flex flex-col items-center gap-2">
                  <Smartphone className="h-6 w-6" />
                  <span>Bật 2FA</span>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4" asChild>
              <Link href="/admin/security/change-password">
                <div className="flex flex-col items-center gap-2">
                  <Key className="h-6 w-6" />
                  <span>Đổi Mật Khẩu</span>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4" asChild>
              <Link href="/admin/security/sessions">
                <div className="flex flex-col items-center gap-2">
                  <Lock className="h-6 w-6" />
                  <span>Quản Lý Phiên</span>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4" asChild>
              <Link href="/admin/security/dashboard">
                <div className="flex flex-col items-center gap-2">
                  <Shield className="h-6 w-6" />
                  <span>Dashboard</span>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
