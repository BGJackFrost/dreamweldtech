import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Loader2, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Globe, 
  Clock, 
  MapPin, 
  LogOut, 
  ArrowLeft,
  ShieldCheck,
  AlertTriangle
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

export default function SessionManagement() {
  const [revokeAllOpen, setRevokeAllOpen] = useState(false);

  // Get sessions
  const sessionsQuery = trpc.security.sessions.list.useQuery();

  // Revoke session mutation
  const revokeMutation = trpc.security.sessions.revoke.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        sessionsQuery.refetch();
      } else {
        toast.error(data.message);
      }
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  // Revoke all sessions mutation
  const revokeAllMutation = trpc.security.sessions.revokeAll.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        setRevokeAllOpen(false);
        sessionsQuery.refetch();
      } else {
        toast.error(data.message);
      }
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType) {
      case "mobile":
        return <Smartphone className="h-5 w-5" />;
      case "tablet":
        return <Tablet className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  const formatDate = (date: Date | string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: vi });
  };

  if (sessionsQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const sessions = sessionsQuery.data || [];
  const currentSession = sessions.find(s => s.isCurrent);
  const otherSessions = sessions.filter(s => !s.isCurrent);

  return (
    <div className="container max-w-3xl py-8">
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>Quản lý phiên đăng nhập</CardTitle>
                <CardDescription>
                  Xem và quản lý các thiết bị đang đăng nhập vào tài khoản của bạn
                </CardDescription>
              </div>
            </div>
            {otherSessions.length > 0 && (
              <Dialog open={revokeAllOpen} onOpenChange={setRevokeAllOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <LogOut className="mr-2 h-4 w-4" />
                    Đăng xuất tất cả
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Đăng xuất tất cả thiết bị khác?</DialogTitle>
                    <DialogDescription>
                      Điều này sẽ đăng xuất tất cả các phiên đăng nhập khác ngoại trừ phiên hiện tại.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setRevokeAllOpen(false)}>
                      Hủy
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => revokeAllMutation.mutate({})}
                      disabled={revokeAllMutation.isPending}
                    >
                      {revokeAllMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Xác nhận"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Session */}
          {currentSession && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Phiên hiện tại
              </h3>
              <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-green-100 rounded-lg text-green-700">
                    {getDeviceIcon(currentSession.deviceType)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{currentSession.deviceName || "Thiết bị không xác định"}</span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        Phiên hiện tại
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Globe className="h-3 w-3" />
                        {currentSession.browser} • {currentSession.os}
                      </div>
                      {currentSession.ipAddress && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          {currentSession.ipAddress}
                          {currentSession.location && ` • ${currentSession.location}`}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        Hoạt động {formatDate(currentSession.lastActivityAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other Sessions */}
          {otherSessions.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Các phiên khác ({otherSessions.length})
              </h3>
              <div className="space-y-3">
                {otherSessions.map((session) => (
                  <div key={session.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-muted rounded-lg">
                        {getDeviceIcon(session.deviceType)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">
                          {session.deviceName || "Thiết bị không xác định"}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Globe className="h-3 w-3" />
                            {session.browser} • {session.os}
                          </div>
                          {session.ipAddress && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3" />
                              {session.ipAddress}
                              {session.location && ` • ${session.location}`}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            Hoạt động {formatDate(session.lastActivityAt)}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => revokeMutation.mutate({ sessionId: session.id })}
                        disabled={revokeMutation.isPending}
                      >
                        {revokeMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <LogOut className="h-4 w-4 mr-1" />
                            Đăng xuất
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No other sessions */}
          {otherSessions.length === 0 && (
            <Alert>
              <ShieldCheck className="h-4 w-4" />
              <AlertDescription>
                Không có phiên đăng nhập nào khác. Tài khoản của bạn chỉ đang đăng nhập trên thiết bị này.
              </AlertDescription>
            </Alert>
          )}

          {/* Security Tips */}
          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-medium mb-2">Mẹo bảo mật</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 text-yellow-500" />
                Nếu thấy phiên đăng nhập lạ, hãy đăng xuất ngay và đổi mật khẩu
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 mt-0.5 text-green-500" />
                Bật xác thực 2 yếu tố để tăng cường bảo mật
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
