import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldX, ArrowLeft, Home, Mail } from "lucide-react";
import { useLocation } from "wouter";

export default function AccessDenied() {
  const [location, setLocation] = useLocation();

  const goBack = () => {
    window.history.back();
  };

  const goHome = () => {
    setLocation("/admin");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <ShieldX className="h-10 w-10 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-heading uppercase text-destructive">
            Truy Cập Bị Từ Chối
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Bạn không có quyền truy cập vào trang này
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <p className="text-muted-foreground">
              <strong>Trang yêu cầu:</strong>{" "}
              <code className="bg-background px-2 py-1 rounded text-xs">
                {location}
              </code>
            </p>
            <p className="text-muted-foreground mt-2">
              Nếu bạn cho rằng đây là lỗi, vui lòng liên hệ quản trị viên để được cấp quyền truy cập.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={goBack}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay Lại
            </Button>
            <Button
              onClick={goHome}
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              Trang Chủ Admin
            </Button>
          </div>

          <div className="border-t pt-4">
            <p className="text-xs text-center text-muted-foreground">
              Cần hỗ trợ?{" "}
              <a
                href="mailto:admin@dreamweldtech.com"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                <Mail className="h-3 w-3" />
                Liên hệ quản trị viên
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
