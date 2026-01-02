import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Download, Upload, Database, RefreshCw, AlertTriangle, 
  CheckCircle, FileJson, HardDrive, Clock, Shield
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function BackupPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [overwrite, setOverwrite] = useState(false);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = trpc.backup.stats.useQuery();
  const exportMutation = trpc.backup.export.useQuery(undefined, { enabled: false });
  const exportSensitiveMutation = trpc.backup.exportSensitive.useQuery(undefined, { enabled: false });
  const importMutation = trpc.backup.import.useMutation();

  const tables = [
    { key: "categories", label: "Danh mục sản phẩm", icon: "📁" },
    { key: "products", label: "Sản phẩm", icon: "📦" },
    { key: "news", label: "Tin tức", icon: "📰" },
    { key: "jobs", label: "Việc làm", icon: "💼" },
    { key: "faqs", label: "FAQ", icon: "❓" },
    { key: "partners", label: "Đối tác", icon: "🤝" },
    { key: "portfolioItems", label: "Portfolio", icon: "🖼️" },
    { key: "caseStudies", label: "Case Studies", icon: "📊" },
  ];

  const handleExport = async (includeSensitive: boolean = false) => {
    setIsExporting(true);
    try {
      const { data } = includeSensitive 
        ? await exportSensitiveMutation.refetch()
        : await exportMutation.refetch();
      
      if (data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `dreamweldtech-backup-${new Date().toISOString().split("T")[0]}${includeSensitive ? "-sensitive" : ""}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Xuất dữ liệu thành công!");
      }
    } catch (error: any) {
      toast.error(`Lỗi xuất dữ liệu: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const result = await importMutation.mutateAsync({
        data,
        overwrite,
        tables: selectedTables.length > 0 ? selectedTables : undefined,
      });

      if (result.success) {
        toast.success("Nhập dữ liệu thành công!");
        refetchStats();
      } else {
        toast.error(`Có lỗi xảy ra: ${result.errors.join(", ")}`);
      }
    } catch (error: any) {
      toast.error(`Lỗi nhập dữ liệu: ${error.message}`);
    } finally {
      setIsImporting(false);
      event.target.value = "";
    }
  };

  const toggleTable = (tableKey: string) => {
    setSelectedTables(prev => 
      prev.includes(tableKey) 
        ? prev.filter(t => t !== tableKey)
        : [...prev, tableKey]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold">Sao lưu & Khôi phục</h1>
        <p className="text-muted-foreground mt-1">
          Quản lý sao lưu và khôi phục dữ liệu website
        </p>
      </div>

      {/* Database Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Thống kê Database
          </CardTitle>
          <CardDescription>
            Tổng quan số lượng dữ liệu trong hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(stats).map(([key, value]) => (
                <div key={key} className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-primary">{value}</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Không thể tải thống kê</p>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4"
            onClick={() => refetchStats()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-green-600" />
              Xuất dữ liệu (Export)
            </CardTitle>
            <CardDescription>
              Tải xuống bản sao lưu dữ liệu dưới dạng JSON
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button 
                className="w-full" 
                onClick={() => handleExport(false)}
                disabled={isExporting}
              >
                {isExporting ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileJson className="h-4 w-4 mr-2" />
                )}
                Xuất dữ liệu công khai
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Shield className="h-4 w-4 mr-2" />
                    Xuất dữ liệu nhạy cảm
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xuất dữ liệu nhạy cảm?</AlertDialogTitle>
                    <AlertDialogDescription>
                      File này sẽ chứa thông tin liên hệ và đơn ứng tuyển của khách hàng. 
                      Hãy đảm bảo bảo mật file này cẩn thận.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleExport(true)}>
                      Tiếp tục xuất
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <p className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                Nên backup định kỳ hàng tuần để đảm bảo an toàn dữ liệu
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Import Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-600" />
              Nhập dữ liệu (Import)
            </CardTitle>
            <CardDescription>
              Khôi phục dữ liệu từ file backup JSON
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Table Selection */}
            <div>
              <p className="text-sm font-medium mb-2">Chọn bảng để nhập (để trống = tất cả):</p>
              <div className="grid grid-cols-2 gap-2">
                {tables.map(table => (
                  <label 
                    key={table.key}
                    className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox 
                      checked={selectedTables.includes(table.key)}
                      onCheckedChange={() => toggleTable(table.key)}
                    />
                    <span className="text-sm">{table.icon} {table.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Overwrite Option */}
            <label className="flex items-center gap-2 p-3 rounded-lg border border-destructive/50 bg-destructive/5 cursor-pointer">
              <Checkbox 
                checked={overwrite}
                onCheckedChange={(checked) => setOverwrite(checked as boolean)}
              />
              <div>
                <p className="text-sm font-medium text-destructive">Ghi đè dữ liệu hiện có</p>
                <p className="text-xs text-muted-foreground">
                  Xóa dữ liệu cũ trước khi nhập (không thể hoàn tác!)
                </p>
              </div>
            </label>

            {/* Import Button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full" disabled={isImporting}>
                  {isImporting ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Chọn file để nhập
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    Xác nhận nhập dữ liệu
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {overwrite ? (
                      <span className="text-destructive font-medium">
                        CẢNH BÁO: Dữ liệu hiện có sẽ bị XÓA và thay thế bằng dữ liệu từ file backup!
                      </span>
                    ) : (
                      "Dữ liệu mới sẽ được thêm vào. Các bản ghi trùng lặp sẽ bị bỏ qua."
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <label className="cursor-pointer">
                      Tiếp tục
                      <input 
                        type="file" 
                        accept=".json"
                        className="hidden"
                        onChange={handleImport}
                      />
                    </label>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-sm">
              <p className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                <AlertTriangle className="h-4 w-4" />
                Luôn backup dữ liệu hiện tại trước khi nhập dữ liệu mới
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tips Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Hướng dẫn sử dụng
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Khi nào nên backup?</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Trước khi cập nhật hệ thống</li>
                <li>• Sau khi thêm nhiều dữ liệu mới</li>
                <li>• Định kỳ hàng tuần/tháng</li>
                <li>• Trước khi chuyển đổi hosting</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Lưu ý quan trọng</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• File backup chứa toàn bộ dữ liệu</li>
                <li>• Bảo mật file backup cẩn thận</li>
                <li>• Kiểm tra file trước khi import</li>
                <li>• Không chia sẻ file sensitive data</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
