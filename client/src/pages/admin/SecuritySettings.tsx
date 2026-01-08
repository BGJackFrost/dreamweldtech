import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  Shield, 
  Lock, 
  Key, 
  Smartphone, 
  Bell, 
  ArrowLeft,
  Save,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function SecuritySettings() {
  const [saving, setSaving] = useState(false);

  // Get admin security settings
  const settingsQuery = trpc.security.adminSettings.getAll.useQuery();
  
  // Get user preferences
  const preferencesQuery = trpc.security.preferences.get.useQuery();

  // Update admin setting mutation
  const updateSettingMutation = trpc.security.adminSettings.set.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        settingsQuery.refetch();
      } else {
        toast.error(data.message);
      }
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  // Update preferences mutation
  const updatePreferencesMutation = trpc.security.preferences.update.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        preferencesQuery.refetch();
      } else {
        toast.error(data.message);
      }
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleSettingChange = async (key: string, value: boolean | string) => {
    setSaving(true);
    await updateSettingMutation.mutateAsync({ 
      key, 
      value: typeof value === "boolean" ? (value ? "true" : "false") : value 
    });
    setSaving(false);
  };

  const handlePreferenceChange = async (key: string, value: boolean) => {
    await updatePreferencesMutation.mutateAsync({ [key]: value });
  };

  if (settingsQuery.isLoading || preferencesQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const settings = settingsQuery.data || {};
  const preferences = preferencesQuery.data;

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại Dashboard
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Cài đặt bảo mật</h1>
          <p className="text-muted-foreground">Quản lý các tùy chọn bảo mật cho hệ thống</p>
        </div>
      </div>

      <Tabs defaultValue="system" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="system">Hệ thống</TabsTrigger>
          <TabsTrigger value="2fa">Xác thực 2FA</TabsTrigger>
          <TabsTrigger value="notifications">Thông báo</TabsTrigger>
        </TabsList>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Chính sách mật khẩu
              </CardTitle>
              <CardDescription>
                Cấu hình yêu cầu mật khẩu cho người dùng
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Độ dài tối thiểu</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    min="6"
                    max="32"
                    defaultValue={settings.passwordMinLength?.value || "8"}
                    onBlur={(e) => handleSettingChange("passwordMinLength", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Số lần đăng nhập sai tối đa</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    min="3"
                    max="10"
                    defaultValue={settings.maxLoginAttempts?.value || "5"}
                    onBlur={(e) => handleSettingChange("maxLoginAttempts", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Yêu cầu chữ hoa</Label>
                    <p className="text-sm text-muted-foreground">Mật khẩu phải có ít nhất 1 chữ hoa</p>
                  </div>
                  <Switch
                    checked={settings.passwordRequireUppercase?.value === "true"}
                    onCheckedChange={(checked) => handleSettingChange("passwordRequireUppercase", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Yêu cầu số</Label>
                    <p className="text-sm text-muted-foreground">Mật khẩu phải có ít nhất 1 số</p>
                  </div>
                  <Switch
                    checked={settings.passwordRequireNumber?.value === "true"}
                    onCheckedChange={(checked) => handleSettingChange("passwordRequireNumber", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Yêu cầu ký tự đặc biệt</Label>
                    <p className="text-sm text-muted-foreground">Mật khẩu phải có ít nhất 1 ký tự đặc biệt</p>
                  </div>
                  <Switch
                    checked={settings.passwordRequireSpecial?.value === "true"}
                    onCheckedChange={(checked) => handleSettingChange("passwordRequireSpecial", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Phiên đăng nhập
              </CardTitle>
              <CardDescription>
                Cấu hình thời gian phiên đăng nhập
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Thời gian hết hạn phiên (phút)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min="30"
                    max="10080"
                    defaultValue={settings.sessionTimeout?.value || "1440"}
                    onBlur={(e) => handleSettingChange("sessionTimeout", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Mặc định: 1440 phút (24 giờ)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lockoutDuration">Thời gian khóa tài khoản (phút)</Label>
                  <Input
                    id="lockoutDuration"
                    type="number"
                    min="5"
                    max="1440"
                    defaultValue={settings.lockoutDuration?.value || "30"}
                    onBlur={(e) => handleSettingChange("lockoutDuration", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Sau khi đăng nhập sai quá số lần cho phép</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2FA Settings */}
        <TabsContent value="2fa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Xác thực 2 yếu tố (2FA)
              </CardTitle>
              <CardDescription>
                Yêu cầu bật 2FA cho các vai trò cụ thể
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Khi bật yêu cầu 2FA, người dùng thuộc vai trò đó sẽ phải thiết lập 2FA trước khi có thể sử dụng hệ thống.
                </AlertDescription>
              </Alert>

              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base">Yêu cầu 2FA cho Admin</Label>
                    <p className="text-sm text-muted-foreground">
                      Tất cả tài khoản Admin và Super Admin phải bật 2FA
                    </p>
                  </div>
                  <Switch
                    checked={settings.require2FAForAdmin?.value === "true"}
                    onCheckedChange={(checked) => handleSettingChange("require2FAForAdmin", checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base">Yêu cầu 2FA cho Editor</Label>
                    <p className="text-sm text-muted-foreground">
                      Tất cả tài khoản Editor phải bật 2FA
                    </p>
                  </div>
                  <Switch
                    checked={settings.require2FAForEditor?.value === "true"}
                    onCheckedChange={(checked) => handleSettingChange("require2FAForEditor", checked)}
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Hỗ trợ Google Authenticator, Authy và các ứng dụng TOTP khác</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Thông báo bảo mật
              </CardTitle>
              <CardDescription>
                Cấu hình thông báo email cho các sự kiện bảo mật
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-base">Thông báo đăng nhập từ thiết bị mới</Label>
                  <p className="text-sm text-muted-foreground">
                    Gửi email khi có đăng nhập từ thiết bị hoặc IP mới
                  </p>
                </div>
                <Switch
                  checked={settings.notifyNewDeviceLogin?.value === "true"}
                  onCheckedChange={(checked) => handleSettingChange("notifyNewDeviceLogin", checked)}
                />
              </div>

              {preferences && (
                <>
                  <h3 className="font-medium pt-4 border-t">Cài đặt cá nhân của bạn</h3>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">Thông báo đăng nhập mới</Label>
                      <p className="text-sm text-muted-foreground">
                        Nhận email khi có đăng nhập mới vào tài khoản của bạn
                      </p>
                    </div>
                    <Switch
                      checked={preferences.notifyOnNewLogin === "true"}
                      onCheckedChange={(checked) => handlePreferenceChange("notifyOnNewLogin", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">Thông báo đổi mật khẩu</Label>
                      <p className="text-sm text-muted-foreground">
                        Nhận email khi mật khẩu được thay đổi
                      </p>
                    </div>
                    <Switch
                      checked={preferences.notifyOnPasswordChange === "true"}
                      onCheckedChange={(checked) => handlePreferenceChange("notifyOnPasswordChange", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label className="text-base">Thông báo thay đổi 2FA</Label>
                      <p className="text-sm text-muted-foreground">
                        Nhận email khi 2FA được bật hoặc tắt
                      </p>
                    </div>
                    <Switch
                      checked={preferences.notifyOn2FAChange === "true"}
                      onCheckedChange={(checked) => handlePreferenceChange("notifyOn2FAChange", checked)}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {saving && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang lưu...
        </div>
      )}
    </div>
  );
}
