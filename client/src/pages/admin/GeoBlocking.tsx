import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Globe, Shield, ShieldOff, Plus, Trash2, BarChart3, Loader2 } from "lucide-react";

export default function GeoBlocking() {
  const [ruleType, setRuleType] = useState<"block" | "allow" | "all">("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    countryCode: "",
    countryName: "",
    ruleType: "block" as "block" | "allow",
    reason: "",
  });

  // Queries
  const { data: countries } = trpc.advancedSecurity.geoBlocking.countries.useQuery();
  const { data: rulesData, refetch: refetchRules } = trpc.advancedSecurity.geoBlocking.list.useQuery({
    ruleType: ruleType === "all" ? undefined : ruleType,
  });
  const { data: stats } = trpc.advancedSecurity.geoBlocking.stats.useQuery();

  // Mutations
  const addRule = trpc.advancedSecurity.geoBlocking.add.useMutation({
    onSuccess: () => {
      refetchRules();
      setIsAddDialogOpen(false);
      setNewRule({ countryCode: "", countryName: "", ruleType: "block", reason: "" });
    },
  });

  const removeRule = trpc.advancedSecurity.geoBlocking.remove.useMutation({
    onSuccess: () => refetchRules(),
  });

  const toggleRule = trpc.advancedSecurity.geoBlocking.toggle.useMutation({
    onSuccess: () => refetchRules(),
  });

  const handleAddRule = () => {
    if (!newRule.countryCode) return;
    addRule.mutate(newRule);
  };

  const handleCountrySelect = (code: string) => {
    const country = countries?.find(c => c.code === code);
    if (country) {
      setNewRule(prev => ({
        ...prev,
        countryCode: country.code,
        countryName: country.name,
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Geo-Blocking</h1>
          <p className="text-muted-foreground">Chặn hoặc cho phép truy cập từ các quốc gia cụ thể</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Thêm quy tắc
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm quy tắc Geo-Blocking</DialogTitle>
              <DialogDescription>
                Chọn quốc gia và loại quy tắc (chặn hoặc cho phép)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Quốc gia</Label>
                <Select value={newRule.countryCode} onValueChange={handleCountrySelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn quốc gia" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {countries?.map(country => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name} ({country.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Loại quy tắc</Label>
                <Select 
                  value={newRule.ruleType} 
                  onValueChange={(v) => setNewRule(prev => ({ ...prev, ruleType: v as "block" | "allow" }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="block">Chặn (Blacklist)</SelectItem>
                    <SelectItem value="allow">Cho phép (Whitelist)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Lý do (tùy chọn)</Label>
                <Textarea
                  value={newRule.reason}
                  onChange={(e) => setNewRule(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Nhập lý do..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleAddRule} disabled={!newRule.countryCode || addRule.isPending}>
                {addRule.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Thêm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quốc gia bị chặn</CardTitle>
            <ShieldOff className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBlocked || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quốc gia whitelist</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAllowed || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng lượt chặn</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalHits || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng quy tắc</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rulesData?.total || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Top Blocked Countries */}
      {stats?.topBlockedCountries && stats.topBlockedCountries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top quốc gia bị chặn</CardTitle>
            <CardDescription>Các quốc gia có nhiều lượt truy cập bị chặn nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.topBlockedCountries.map((country) => (
                <Badge key={country.countryCode} variant="destructive">
                  {country.countryName}: {country.hitCount} lượt
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rules Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Danh sách quy tắc</CardTitle>
              <CardDescription>Quản lý các quy tắc geo-blocking</CardDescription>
            </div>
            <Select value={ruleType} onValueChange={(v) => setRuleType(v as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="block">Chặn</SelectItem>
                <SelectItem value="allow">Cho phép</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quốc gia</TableHead>
                <TableHead>Mã</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Lý do</TableHead>
                <TableHead>Lượt hit</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rulesData?.rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.countryName}</TableCell>
                  <TableCell>{rule.countryCode}</TableCell>
                  <TableCell>
                    <Badge variant={rule.ruleType === "block" ? "destructive" : "default"}>
                      {rule.ruleType === "block" ? "Chặn" : "Cho phép"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{rule.reason || "-"}</TableCell>
                  <TableCell>{rule.hitCount}</TableCell>
                  <TableCell>
                    <Switch
                      checked={rule.isActive}
                      onCheckedChange={(checked) => toggleRule.mutate({ ruleId: rule.id, isActive: checked })}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRule.mutate({ ruleId: rule.id })}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!rulesData?.rules || rulesData.rules.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Chưa có quy tắc nào
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
