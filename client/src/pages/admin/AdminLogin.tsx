import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Lock, User, Mail, AlertCircle, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

// Token storage key
const ADMIN_TOKEN_KEY = "dreamweldtech_admin_token";

// Export functions for use in other components
export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function removeAdminToken(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Login form state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");

  // Check if admin exists
  const { data: adminCheck, isLoading: checkingAdmin } = trpc.adminAuth.checkAdminExists.useQuery();

  // Check if already logged in
  const existingToken = getAdminToken();
  const { data: currentUser, isLoading: checkingUser } = trpc.adminAuth.me.useQuery(
    { token: existingToken || "" },
    { enabled: !!existingToken }
  );

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser?.user) {
      setLocation("/admin");
    }
  }, [currentUser, setLocation]);

  // Auto switch to register tab if no admin exists
  useEffect(() => {
    if (adminCheck && !adminCheck.exists) {
      setActiveTab("register");
    }
  }, [adminCheck]);

  // Login mutation
  const loginMutation = trpc.adminAuth.login.useMutation({
    onSuccess: (data) => {
      setAdminToken(data.token);
      setSuccess("Đăng nhập thành công! Đang chuyển hướng...");
      setTimeout(() => {
        setLocation("/admin");
        window.location.reload();
      }, 1000);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  // Register mutation
  const registerMutation = trpc.adminAuth.registerFirstAdmin.useMutation({
    onSuccess: (data) => {
      setAdminToken(data.token);
      setSuccess("Tạo tài khoản admin thành công! Đang chuyển hướng...");
      setTimeout(() => {
        setLocation("/admin");
        window.location.reload();
      }, 1000);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!loginUsername || !loginPassword) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    loginMutation.mutate({
      username: loginUsername,
      password: loginPassword,
    });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!registerUsername || !registerPassword || !registerName || !registerEmail) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    if (registerPassword.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    registerMutation.mutate({
      username: registerUsername,
      password: registerPassword,
      name: registerName,
      email: registerEmail,
    });
  };

  if (checkingAdmin || checkingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">DreamWeldTech</h1>
          <p className="text-slate-400">Hệ thống quản trị</p>
        </div>

        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
            <CardHeader>
              <TabsList className="grid w-full grid-cols-2 bg-slate-700/50">
                <TabsTrigger value="login" className="data-[state=active]:bg-primary">
                  Đăng nhập
                </TabsTrigger>
                <TabsTrigger 
                  value="register" 
                  className="data-[state=active]:bg-primary"
                  disabled={adminCheck?.exists}
                >
                  Đăng ký Admin
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              {/* Error/Success Messages */}
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="mb-4 border-green-500 bg-green-500/10 text-green-500">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {/* Login Tab */}
              <TabsContent value="login" className="mt-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-username" className="text-slate-200">
                      Tên đăng nhập
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="login-username"
                        type="text"
                        placeholder="Nhập tên đăng nhập"
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-slate-200">
                      Mật khẩu
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Nhập mật khẩu"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang đăng nhập...
                      </>
                    ) : (
                      "Đăng nhập"
                    )}
                  </Button>

                  <div className="text-center mt-4">
                    <Link href="/admin/forgot-password">
                      <span className="text-sm text-slate-400 hover:text-primary cursor-pointer">
                        Quên mật khẩu?
                      </span>
                    </Link>
                  </div>
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register" className="mt-0">
                {adminCheck?.exists ? (
                  <div className="text-center py-4">
                    <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                    <p className="text-slate-300">
                      Đã có admin trong hệ thống. Vui lòng liên hệ admin hiện tại để được cấp quyền.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-username" className="text-slate-200">
                        Tên đăng nhập
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          id="register-username"
                          type="text"
                          placeholder="Nhập tên đăng nhập"
                          value={registerUsername}
                          onChange={(e) => setRegisterUsername(e.target.value)}
                          className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-name" className="text-slate-200">
                        Họ và tên
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          id="register-name"
                          type="text"
                          placeholder="Nhập họ và tên"
                          value={registerName}
                          onChange={(e) => setRegisterName(e.target.value)}
                          className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-email" className="text-slate-200">
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="Nhập email"
                          value={registerEmail}
                          onChange={(e) => setRegisterEmail(e.target.value)}
                          className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-password" className="text-slate-200">
                        Mật khẩu
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          id="register-password"
                          type="password"
                          placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
                          value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)}
                          className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-confirm-password" className="text-slate-200">
                        Xác nhận mật khẩu
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          id="register-confirm-password"
                          type="password"
                          placeholder="Nhập lại mật khẩu"
                          value={registerConfirmPassword}
                          onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                          className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang tạo tài khoản...
                        </>
                      ) : (
                        "Tạo tài khoản Admin"
                      )}
                    </Button>
                  </form>
                )}
              </TabsContent>
            </CardContent>

            <CardFooter className="flex flex-col space-y-2 text-center text-sm text-slate-400">
              <p>© 2024 DreamWeldTech. All rights reserved.</p>
            </CardFooter>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
