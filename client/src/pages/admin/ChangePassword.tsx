import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Loader2, 
  Lock, 
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [logoutAllSessions, setLogoutAllSessions] = useState(true);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Check if user can change password
  const canChangeQuery = trpc.security.passwordChange.canChange.useQuery();

  // Change password mutation
  const changeMutation = trpc.security.passwordChange.change.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.message);
      }
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  // Password validation
  const passwordChecks = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    match: newPassword === confirmPassword && newPassword.length > 0,
  };

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error("Vui lòng nhập mật khẩu hiện tại");
      return;
    }

    if (!isPasswordValid) {
      toast.error("Mật khẩu mới không đáp ứng yêu cầu");
      return;
    }

    changeMutation.mutate({
      currentPassword,
      newPassword,
      logoutAllSessions,
    });
  };

  if (canChangeQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (canChangeQuery.data === false) {
    return (
      <div className="container max-w-md py-8">
        <div className="mb-6">
          <Link href="/admin">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại Dashboard
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-6 w-6" />
              Đổi mật khẩu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Tài khoản của bạn sử dụng đăng nhập OAuth (Google, Facebook, v.v.) nên không thể đổi mật khẩu tại đây.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-md py-8">
      <div className="mb-6">
        <Link href="/admin">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại Dashboard
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-6 w-6" />
            Đổi mật khẩu
          </CardTitle>
          <CardDescription>
            Thay đổi mật khẩu đăng nhập của bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">Mật khẩu mới</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Password Requirements */}
            {newPassword.length > 0 && (
              <div className="space-y-2 text-sm">
                <p className="font-medium">Yêu cầu mật khẩu:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className={`flex items-center gap-1 ${passwordChecks.length ? "text-green-600" : "text-muted-foreground"}`}>
                    {passwordChecks.length ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    Ít nhất 8 ký tự
                  </div>
                  <div className={`flex items-center gap-1 ${passwordChecks.uppercase ? "text-green-600" : "text-muted-foreground"}`}>
                    {passwordChecks.uppercase ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    Chữ hoa (A-Z)
                  </div>
                  <div className={`flex items-center gap-1 ${passwordChecks.lowercase ? "text-green-600" : "text-muted-foreground"}`}>
                    {passwordChecks.lowercase ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    Chữ thường (a-z)
                  </div>
                  <div className={`flex items-center gap-1 ${passwordChecks.number ? "text-green-600" : "text-muted-foreground"}`}>
                    {passwordChecks.number ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    Số (0-9)
                  </div>
                  <div className={`flex items-center gap-1 ${passwordChecks.special ? "text-green-600" : "text-muted-foreground"}`}>
                    {passwordChecks.special ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    Ký tự đặc biệt
                  </div>
                </div>
              </div>
            )}

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {confirmPassword.length > 0 && !passwordChecks.match && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Mật khẩu xác nhận không khớp
                </p>
              )}
            </div>

            {/* Logout all sessions */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label htmlFor="logoutAll">Đăng xuất tất cả phiên khác</Label>
                <p className="text-sm text-muted-foreground">
                  Khuyến nghị để bảo mật tài khoản
                </p>
              </div>
              <Switch
                id="logoutAll"
                checked={logoutAllSessions}
                onCheckedChange={setLogoutAllSessions}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!isPasswordValid || changeMutation.isPending}
            >
              {changeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang đổi mật khẩu...
                </>
              ) : (
                "Đổi mật khẩu"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
