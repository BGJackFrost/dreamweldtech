import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Shield, ShieldCheck, ShieldOff, Copy, CheckCircle, AlertTriangle, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function TwoFactorSetup() {
  const [code, setCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [setupData, setSetupData] = useState<{
    secret?: string;
    qrCodeUrl?: string;
    backupCodes?: string[];
  } | null>(null);

  // Get 2FA settings
  const settingsQuery = trpc.security.twoFactor.getSettings.useQuery();

  // Setup 2FA mutation
  const setupMutation = trpc.security.twoFactor.setup.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setSetupData({
          secret: data.secret,
          qrCodeUrl: data.qrCodeUrl,
          backupCodes: data.backupCodes,
        });
      } else {
        toast.error(data.message);
      }
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  // Verify setup mutation
  const verifyMutation = trpc.security.twoFactor.verifySetup.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        setBackupCodes(setupData?.backupCodes || []);
        setShowBackupCodes(true);
        setSetupData(null);
        setCode("");
        settingsQuery.refetch();
      } else {
        toast.error(data.message);
      }
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  // Disable 2FA mutation
  const disableMutation = trpc.security.twoFactor.disable.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        setDisableCode("");
        settingsQuery.refetch();
      } else {
        toast.error(data.message);
      }
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  // Regenerate backup codes mutation
  const regenerateMutation = trpc.security.twoFactor.regenerateBackupCodes.useMutation({
    onSuccess: (data) => {
      if (data.success && data.backupCodes) {
        setBackupCodes(data.backupCodes);
        setShowBackupCodes(true);
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Đã sao chép!");
  };

  const copyAllBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    toast.success("Đã sao chép tất cả mã backup!");
  };

  const isEnabled = settingsQuery.data?.isEnabled;

  if (settingsQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8">
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
          <div className="flex items-center gap-3">
            {isEnabled ? (
              <ShieldCheck className="h-8 w-8 text-green-600" />
            ) : (
              <Shield className="h-8 w-8 text-muted-foreground" />
            )}
            <div>
              <CardTitle>Xác thực hai yếu tố (2FA)</CardTitle>
              <CardDescription>
                Bảo vệ tài khoản của bạn với lớp bảo mật bổ sung
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">Trạng thái</p>
              <p className="text-sm text-muted-foreground">
                {isEnabled ? "Đã bật xác thực 2 yếu tố" : "Chưa bật xác thực 2 yếu tố"}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              isEnabled ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
            }`}>
              {isEnabled ? "Đã bật" : "Chưa bật"}
            </div>
          </div>

          {/* Setup Flow */}
          {!isEnabled && !setupData && (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Xác thực 2 yếu tố giúp bảo vệ tài khoản của bạn khỏi truy cập trái phép. 
                  Bạn sẽ cần ứng dụng xác thực như Google Authenticator hoặc Authy.
                </AlertDescription>
              </Alert>
              <Button 
                onClick={() => setupMutation.mutate()} 
                disabled={setupMutation.isPending}
                className="w-full"
              >
                {setupMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Bật xác thực 2 yếu tố
                  </>
                )}
              </Button>
            </div>
          )}

          {/* QR Code & Verification */}
          {setupData && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="font-semibold mb-2">Bước 1: Quét mã QR</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Mở ứng dụng xác thực và quét mã QR bên dưới
                </p>
                {setupData.qrCodeUrl && (
                  <img 
                    src={setupData.qrCodeUrl} 
                    alt="QR Code" 
                    className="mx-auto border rounded-lg p-2 bg-white"
                  />
                )}
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Hoặc nhập mã thủ công:
                </p>
                <div className="flex items-center justify-center gap-2">
                  <code className="bg-muted px-3 py-2 rounded font-mono text-sm">
                    {setupData.secret}
                  </code>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => copyToClipboard(setupData.secret || "")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-center">Bước 2: Xác nhận</h3>
                <p className="text-sm text-muted-foreground mb-4 text-center">
                  Nhập mã 6 chữ số từ ứng dụng xác thực
                </p>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                  <Button 
                    onClick={() => verifyMutation.mutate({ code })}
                    disabled={code.length !== 6 || verifyMutation.isPending}
                  >
                    {verifyMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Xác nhận"
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                variant="outline" 
                onClick={() => setSetupData(null)}
                className="w-full"
              >
                Hủy
              </Button>
            </div>
          )}

          {/* Enabled State */}
          {isEnabled && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-lg">
                <CheckCircle className="h-5 w-5" />
                <span>Tài khoản của bạn được bảo vệ bởi xác thực 2 yếu tố</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Mã backup còn lại</p>
                  <p className="text-sm text-muted-foreground">
                    {settingsQuery.data?.backupCodesRemaining || 0} mã
                  </p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      Tạo mã mới
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Tạo mã backup mới</DialogTitle>
                      <DialogDescription>
                        Nhập mã 2FA hiện tại để tạo mã backup mới. Mã cũ sẽ bị vô hiệu.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        type="text"
                        placeholder="Nhập mã 2FA"
                        value={disableCode}
                        onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="text-center"
                        maxLength={6}
                      />
                      <Button 
                        onClick={() => regenerateMutation.mutate({ code: disableCode })}
                        disabled={disableCode.length < 6 || regenerateMutation.isPending}
                        className="w-full"
                      >
                        {regenerateMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Tạo mã mới"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <ShieldOff className="mr-2 h-4 w-4" />
                    Tắt xác thực 2 yếu tố
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Tắt xác thực 2 yếu tố?</DialogTitle>
                    <DialogDescription>
                      Điều này sẽ giảm bảo mật tài khoản của bạn. Nhập mã 2FA để xác nhận.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      type="text"
                      placeholder="Nhập mã 2FA"
                      value={disableCode}
                      onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="text-center"
                      maxLength={6}
                    />
                    <Button 
                      variant="destructive"
                      onClick={() => disableMutation.mutate({ code: disableCode })}
                      disabled={disableCode.length < 6 || disableMutation.isPending}
                      className="w-full"
                    >
                      {disableMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Xác nhận tắt 2FA"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backup Codes Dialog */}
      <Dialog open={showBackupCodes} onOpenChange={setShowBackupCodes}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mã backup của bạn</DialogTitle>
            <DialogDescription>
              Lưu các mã này ở nơi an toàn. Mỗi mã chỉ sử dụng được một lần.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Đây là lần duy nhất bạn thấy các mã này. Hãy lưu lại ngay!
              </AlertDescription>
            </Alert>
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, index) => (
                <div 
                  key={index}
                  className="bg-muted p-2 rounded font-mono text-center text-sm"
                >
                  {code}
                </div>
              ))}
            </div>
            <Button onClick={copyAllBackupCodes} className="w-full">
              <Copy className="mr-2 h-4 w-4" />
              Sao chép tất cả
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowBackupCodes(false)}
              className="w-full"
            >
              Đã lưu, đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
