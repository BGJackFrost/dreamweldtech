import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, ShieldOff, Plus, Trash2, RefreshCw, Clock, Activity, AlertCircle, CheckCircle2 } from "lucide-react";

export default function IpAccessControl() {
  const [activeTab, setActiveTab] = useState("blacklist");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newIp, setNewIp] = useState("");
  const [newReason, setNewReason] = useState("");
  const [newExpiry, setNewExpiry] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Queries
  const blacklistQuery = trpc.advancedSecurity.ipControl.list.useQuery({
    type: "blacklist",
    activeOnly: true,
    limit: 100,
  });

  const whitelistQuery = trpc.advancedSecurity.ipControl.list.useQuery({
    type: "whitelist",
    activeOnly: true,
    limit: 100,
  });

  const lockedIpsQuery = trpc.advancedSecurity.rateLimit.lockedIps.useQuery();

  // Mutations
  const addBlacklistMutation = trpc.advancedSecurity.ipControl.addBlacklist.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setMessage({ type: "success", text: data.message });
        blacklistQuery.refetch();
        setIsAddDialogOpen(false);
        resetForm();
      } else {
        setMessage({ type: "error", text: data.message });
      }
    },
  });

  const addWhitelistMutation = trpc.advancedSecurity.ipControl.addWhitelist.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setMessage({ type: "success", text: data.message });
        whitelistQuery.refetch();
        setIsAddDialogOpen(false);
        resetForm();
      } else {
        setMessage({ type: "error", text: data.message });
      }
    },
  });

  const removeRuleMutation = trpc.advancedSecurity.ipControl.remove.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setMessage({ type: "success", text: data.message });
        blacklistQuery.refetch();
        whitelistQuery.refetch();
      } else {
        setMessage({ type: "error", text: data.message });
      }
    },
  });

  const unlockIpMutation = trpc.advancedSecurity.rateLimit.unlock.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setMessage({ type: "success", text: data.message });
        lockedIpsQuery.refetch();
      } else {
        setMessage({ type: "error", text: data.message });
      }
    },
  });

  const resetForm = () => {
    setNewIp("");
    setNewReason("");
    setNewExpiry("");
  };

  const handleAddIp = () => {
    if (!newIp.trim()) {
      setMessage({ type: "error", text: "Vui lòng nhập địa chỉ IP" });
      return;
    }

    const data = {
      ipAddress: newIp.trim(),
      reason: newReason.trim() || undefined,
      expiresAt: newExpiry || undefined,
    };

    if (activeTab === "blacklist") {
      addBlacklistMutation.mutate(data);
    } else {
      addWhitelistMutation.mutate(data);
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Vĩnh viễn";
    return new Date(date).toLocaleString("vi-VN");
  };

  const renderRulesTable = (rules: any[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Địa chỉ IP</TableHead>
          <TableHead>Lý do</TableHead>
          <TableHead>Hết hạn</TableHead>
          <TableHead>Số lần</TableHead>
          <TableHead>Ngày tạo</TableHead>
          <TableHead className="text-right">Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rules.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
              Chưa có quy tắc nào
            </TableCell>
          </TableRow>
        ) : (
          rules.map((rule) => (
            <TableRow key={rule.id}>
              <TableCell className="font-mono">{rule.ipAddress}</TableCell>
              <TableCell className="max-w-[200px] truncate">{rule.reason || "-"}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {formatDate(rule.expiresAt)}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{rule.hitCount}</Badge>
              </TableCell>
              <TableCell>{formatDate(rule.createdAt)}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRuleMutation.mutate({ ruleId: rule.id })}
                  disabled={removeRuleMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          {message.type === "error" ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kiểm Soát IP</h1>
          <p className="text-muted-foreground">
            Quản lý danh sách IP được phép và bị chặn truy cập
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              blacklistQuery.refetch();
              whitelistQuery.refetch();
              lockedIpsQuery.refetch();
              setMessage(null);
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Thêm IP
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Thêm IP vào {activeTab === "blacklist" ? "Blacklist" : "Whitelist"}
                </DialogTitle>
                <DialogDescription>
                  {activeTab === "blacklist"
                    ? "IP trong blacklist sẽ bị chặn truy cập vào hệ thống"
                    : "IP trong whitelist sẽ được phép truy cập mà không bị giới hạn"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Địa chỉ IP *</Label>
                  <Input
                    placeholder="Ví dụ: 192.168.1.1"
                    value={newIp}
                    onChange={(e) => setNewIp(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lý do</Label>
                  <Textarea
                    placeholder="Nhập lý do thêm IP này..."
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Thời gian hết hạn (để trống = vĩnh viễn)</Label>
                  <Input
                    type="datetime-local"
                    value={newExpiry}
                    onChange={(e) => setNewExpiry(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Hủy
                </Button>
                <Button
                  onClick={handleAddIp}
                  disabled={addBlacklistMutation.isPending || addWhitelistMutation.isPending}
                >
                  Thêm
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShieldOff className="h-4 w-4 text-destructive" />
              Blacklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blacklistQuery.data?.total || 0}</div>
            <p className="text-xs text-muted-foreground">IP bị chặn</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              Whitelist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{whitelistQuery.data?.total || 0}</div>
            <p className="text-xs text-muted-foreground">IP được phép</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-yellow-500" />
              Đang bị khóa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lockedIpsQuery.data?.length || 0}</div>
            <p className="text-xs text-muted-foreground">IP tạm khóa do rate limit</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="blacklist" className="flex items-center gap-2">
            <ShieldOff className="h-4 w-4" />
            Blacklist
          </TabsTrigger>
          <TabsTrigger value="whitelist" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Whitelist
          </TabsTrigger>
          <TabsTrigger value="locked" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Đang bị khóa
          </TabsTrigger>
        </TabsList>

        <TabsContent value="blacklist">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách IP bị chặn</CardTitle>
              <CardDescription>
                Các IP trong danh sách này sẽ không thể truy cập vào hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent>
              {blacklistQuery.isLoading ? (
                <div className="text-center py-8">Đang tải...</div>
              ) : (
                renderRulesTable(blacklistQuery.data?.rules || [])
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whitelist">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách IP được phép</CardTitle>
              <CardDescription>
                Các IP trong danh sách này sẽ được phép truy cập mà không bị giới hạn
              </CardDescription>
            </CardHeader>
            <CardContent>
              {whitelistQuery.isLoading ? (
                <div className="text-center py-8">Đang tải...</div>
              ) : (
                renderRulesTable(whitelistQuery.data?.rules || [])
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locked">
          <Card>
            <CardHeader>
              <CardTitle>IP đang bị khóa tạm thời</CardTitle>
              <CardDescription>
                Các IP bị khóa do vượt quá số lần đăng nhập thất bại cho phép
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Địa chỉ IP</TableHead>
                    <TableHead>Số lần thất bại</TableHead>
                    <TableHead>Khóa lúc</TableHead>
                    <TableHead>Mở khóa lúc</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!lockedIpsQuery.data || lockedIpsQuery.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Không có IP nào đang bị khóa
                      </TableCell>
                    </TableRow>
                  ) : (
                    lockedIpsQuery.data.map((lockout: any) => (
                      <TableRow key={lockout.id}>
                        <TableCell className="font-mono">{lockout.ipAddress}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">{lockout.failedAttempts}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(lockout.lockedAt)}</TableCell>
                        <TableCell>{formatDate(lockout.lockedUntil)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => unlockIpMutation.mutate({ ipAddress: lockout.ipAddress })}
                            disabled={unlockIpMutation.isPending}
                          >
                            Mở khóa
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
