import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Loader2, Lock, User, Mail, AlertCircle, CheckCircle2, Shield, ArrowLeft, LogIn } from "lucide-react";
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

// Login step type
type LoginStep = "credentials" | "2fa";
type LoginMethod = "password" | "oauth";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("password");

  // Login step state
  const [loginStep, setLoginStep] = useState<LoginStep>("credentials");
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [pendingUser, setPendingUser] = useState<{
    id: number;
    username: string | null;
    name: string | null;
    email: string | null;
    role: string;
  } | null>(null);

  // Login form state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");

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

  // Get OAuth URL
  const { data: oauthData } = trpc.adminAuth.getOAuthUrl.useQuery(undefined, {
    enabled: loginMethod === "oauth",
  });

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

  // Check for OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const oauthToken = urlParams.get("admin_token");
    const oauthError = urlParams.get("error");
    
    if (oauthToken) {
      setAdminToken(oauthToken);
      setSuccess("Đăng nhập OAuth thành công! Đang chuyển hướng...");
      // Clear URL params
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => {
        setLocation("/admin");
        window.location.reload();
      }, 1000);
    } else if (oauthError) {
      setError(decodeURIComponent(oauthError));
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [setLocation]);

  // Login mutation - Step 1
  const loginMutation = trpc.adminAuth.login.useMutation({
    onSuccess: (data) => {
      if (data.requires2FA && data.tempToken) {
        // Need 2FA verification
        setTempToken(data.tempToken);
        setPendingUser(data.user);
        setLoginStep("2fa");
        setError(null);
      } else if (data.token) {
        // No 2FA required, complete login
        setAdminToken(data.token);
        setSuccess("Đăng nhập thành công! Đang chuyển hướng...");
        setTimeout(() => {
          setLocation("/admin");
          window.location.reload();
        }, 1000);
      }
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  // 2FA verification mutation - Step 2
  const verify2FAMutation = trpc.adminAuth.verify2FA.useMutation({
    onSuccess: (data) => {
      if (data.token) {
        setAdminToken(data.token);
        setSuccess(data.message || "Đăng nhập thành công! Đang chuyển hướng...");
        setTimeout(() => {
          setLocation("/admin");
          window.location.reload();
        }, 1000);
      }
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

  const handleOAuthLogin = () => {
    if (oauthData?.url) {
      // Store return URL for admin
      sessionStorage.setItem("admin_oauth_return", "/admin");
      window.location.href = oauthData.url;
    } else {
      setError("Không thể khởi tạo đăng nhập OAuth. Vui lòng thử lại.");
    }
  };

  const handle2FAVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!twoFactorCode || twoFactorCode.length < 6) {
      setError("Vui lòng nhập mã xác thực 6 chữ số");
      return;
    }

    if (!tempToken) {
      setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      resetLoginState();
      return;
    }

    verify2FAMutation.mutate({
      tempToken,
      code: twoFactorCode,
    });
  };

  const resetLoginState = () => {
    setLoginStep("credentials");
    setTempToken(null);
    setPendingUser(null);
    setTwoFactorCode("");
    setError(null);
    setSuccess(null);
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
          {/* 2FA Verification Step */}
          {loginStep === "2fa" ? (
            <>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Shield className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-white">Xác thực 2 yếu tố</CardTitle>
                    <CardDescription className="text-slate-400">
                      Nhập mã từ ứng dụng xác thực hoặc mã backup
                    </CardDescription>
                  </div>
                </div>
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

                {pendingUser && (
                  <div className="mb-4 p-3 bg-slate-700/50 rounded-lg">
                    <p className="text-sm text-slate-400">Đang đăng nhập với tài khoản:</p>
                    <p className="text-white font-medium">{pendingUser.name}</p>
                    <p className="text-sm text-slate-400">{pendingUser.email}</p>
                  </div>
                )}

                <form onSubmit={handle2FAVerify} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="2fa-code" className="text-slate-200">
                      Mã xác thực
                    </Label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="2fa-code"
                        type="text"
                        placeholder="Nhập mã 6 chữ số"
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                        className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 text-center text-lg tracking-widest"
                        maxLength={8}
                        autoFocus
                      />
                    </div>
                    <p className="text-xs text-slate-400">
                      Nhập mã 6 chữ số từ ứng dụng xác thực (Google Authenticator, Authy...) hoặc mã backup 8 ký tự
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={verify2FAMutation.isPending || twoFactorCode.length < 6}
                  >
                    {verify2FAMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang xác thực...
                      </>
                    ) : (
                      "Xác thực"
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-slate-400 hover:text-white"
                    onClick={resetLoginState}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Quay lại đăng nhập
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            /* Normal Login/Register Tabs */
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
                <TabsContent value="login" className="mt-0 space-y-4">
                  {/* OAuth Login Button */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600 hover:text-white"
                    onClick={handleOAuthLogin}
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Đăng nhập với Manus OAuth
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full bg-slate-600" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-slate-800 px-2 text-slate-400">
                        Hoặc đăng nhập với tài khoản
                      </span>
                    </div>
                  </div>

                  {/* Username/Password Form */}
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
                            placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
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
            </Tabs>
          )}
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <Link href="/">
            <span className="text-sm text-slate-400 hover:text-primary cursor-pointer">
              ← Quay lại trang chủ
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
