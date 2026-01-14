import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Calendar as CalendarIcon,
  Users,
  Package,
  MessageSquare,
  Mail,
  TrendingUp,
  BarChart3,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { usePermissions } from "@/hooks/usePermissions";

type ReportType = "contacts" | "subscribers" | "products" | "overview";
type ExportFormat = "excel" | "pdf";

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export default function AdminReports() {
  const { hasPermission } = usePermissions();
  const [reportType, setReportType] = useState<ReportType>("overview");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("excel");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date(),
  });
  const [isExporting, setIsExporting] = useState(false);

  // Fetch data for reports
  const { data: products } = trpc.products.listAll.useQuery();
  const { data: contacts } = trpc.contacts.list.useQuery({});
  const { data: subscribers } = trpc.newsletter.list.useQuery();
  const { data: categories } = trpc.categories.listAll.useQuery();

  const reportTypes = [
    { 
      value: "overview", 
      label: "Tổng Quan Hệ Thống", 
      icon: BarChart3,
      description: "Báo cáo tổng hợp về sản phẩm, liên hệ và subscribers"
    },
    { 
      value: "contacts", 
      label: "Yêu Cầu Liên Hệ", 
      icon: MessageSquare,
      description: "Chi tiết các yêu cầu báo giá và liên hệ từ khách hàng"
    },
    { 
      value: "subscribers", 
      label: "Newsletter Subscribers", 
      icon: Mail,
      description: "Danh sách email đăng ký nhận tin"
    },
    { 
      value: "products", 
      label: "Danh Sách Sản Phẩm", 
      icon: Package,
      description: "Thông tin chi tiết về các sản phẩm"
    },
  ];

  const generateCSV = (data: Record<string, unknown>[], headers: string[], keys: string[]) => {
    const csvRows = [];
    csvRows.push(headers.join(","));
    
    for (const row of data) {
      const values = keys.map(key => {
        const value = row[key];
        if (value === null || value === undefined) return "";
        const stringValue = String(value);
        // Escape quotes and wrap in quotes if contains comma
        if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      csvRows.push(values.join(","));
    }
    
    return csvRows.join("\n");
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob(["\ufeff" + content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateHTMLReport = (title: string, tableHTML: string, summary: string) => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #0f4c81; border-bottom: 2px solid #00bcd4; padding-bottom: 10px; }
    .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .summary h3 { margin-top: 0; color: #333; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #0f4c81; color: white; padding: 12px; text-align: left; }
    td { padding: 10px; border-bottom: 1px solid #ddd; }
    tr:hover { background: #f9f9f9; }
    .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
    .badge-active { background: #e8f5e9; color: #2e7d32; }
    .badge-inactive { background: #ffebee; color: #c62828; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="summary">
    <h3>Tóm Tắt</h3>
    ${summary}
  </div>
  ${tableHTML}
  <div class="footer">
    <p>Báo cáo được tạo bởi Dreamweldtech Admin System</p>
    <p>Ngày xuất: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: vi })}</p>
  </div>
</body>
</html>`;
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const dateStr = format(new Date(), "yyyyMMdd_HHmm");
      let filename = "";
      let content = "";
      let mimeType = "";

      switch (reportType) {
        case "overview": {
          const summaryData = {
            totalProducts: products?.length || 0,
            activeProducts: products?.filter((p: { isActive: string }) => p.isActive === "true").length || 0,
            totalContacts: contacts?.length || 0,
            pendingContacts: contacts?.filter((c: { status: string }) => c.status === "pending").length || 0,
            totalSubscribers: subscribers?.length || 0,
            activeSubscribers: subscribers?.filter((s: { status: string }) => s.status === "active").length || 0,
            totalCategories: categories?.length || 0,
          };

          if (exportFormat === "excel") {
            const csvData = [
              { metric: "Tổng sản phẩm", value: summaryData.totalProducts },
              { metric: "Sản phẩm đang hiển thị", value: summaryData.activeProducts },
              { metric: "Tổng yêu cầu liên hệ", value: summaryData.totalContacts },
              { metric: "Yêu cầu chưa xử lý", value: summaryData.pendingContacts },
              { metric: "Tổng subscribers", value: summaryData.totalSubscribers },
              { metric: "Subscribers đang hoạt động", value: summaryData.activeSubscribers },
              { metric: "Tổng danh mục", value: summaryData.totalCategories },
            ];
            content = generateCSV(csvData, ["Chỉ số", "Giá trị"], ["metric", "value"]);
            filename = `dreamweldtech_overview_${dateStr}.csv`;
            mimeType = "text/csv;charset=utf-8";
          } else {
            const tableHTML = `
              <table>
                <tr><th>Chỉ số</th><th>Giá trị</th></tr>
                <tr><td>Tổng sản phẩm</td><td>${summaryData.totalProducts}</td></tr>
                <tr><td>Sản phẩm đang hiển thị</td><td>${summaryData.activeProducts}</td></tr>
                <tr><td>Tổng yêu cầu liên hệ</td><td>${summaryData.totalContacts}</td></tr>
                <tr><td>Yêu cầu chưa xử lý</td><td>${summaryData.pendingContacts}</td></tr>
                <tr><td>Tổng subscribers</td><td>${summaryData.totalSubscribers}</td></tr>
                <tr><td>Subscribers đang hoạt động</td><td>${summaryData.activeSubscribers}</td></tr>
                <tr><td>Tổng danh mục</td><td>${summaryData.totalCategories}</td></tr>
              </table>`;
            const summary = `<p>Báo cáo tổng quan hệ thống Dreamweldtech tính đến ngày ${format(new Date(), "dd/MM/yyyy", { locale: vi })}</p>`;
            content = generateHTMLReport("Báo Cáo Tổng Quan Hệ Thống", tableHTML, summary);
            filename = `dreamweldtech_overview_${dateStr}.html`;
            mimeType = "text/html;charset=utf-8";
          }
          break;
        }

        case "contacts": {
          const contactsData = contacts || [];
          if (exportFormat === "excel") {
            content = generateCSV(
              contactsData as Record<string, unknown>[],
              ["ID", "Họ tên", "Email", "Điện thoại", "Công ty", "Chủ đề", "Nội dung", "Trạng thái", "Ngày tạo"],
              ["id", "name", "email", "phone", "company", "subject", "message", "status", "createdAt"]
            );
            filename = `dreamweldtech_contacts_${dateStr}.csv`;
            mimeType = "text/csv;charset=utf-8";
          } else {
            const rows = contactsData.map((c: Record<string, unknown>) => `
              <tr>
                <td>${c.id}</td>
                <td>${c.name || ""}</td>
                <td>${c.email || ""}</td>
                <td>${c.phone || ""}</td>
                <td>${c.company || ""}</td>
                <td>${c.subject || ""}</td>
                <td><span class="badge ${c.status === "pending" ? "badge-inactive" : "badge-active"}">${c.status}</span></td>
              </tr>`).join("");
            const tableHTML = `
              <table>
                <tr><th>ID</th><th>Họ tên</th><th>Email</th><th>Điện thoại</th><th>Công ty</th><th>Chủ đề</th><th>Trạng thái</th></tr>
                ${rows}
              </table>`;
            const summary = `<p>Tổng số yêu cầu: <strong>${contactsData.length}</strong></p>`;
            content = generateHTMLReport("Báo Cáo Yêu Cầu Liên Hệ", tableHTML, summary);
            filename = `dreamweldtech_contacts_${dateStr}.html`;
            mimeType = "text/html;charset=utf-8";
          }
          break;
        }

        case "subscribers": {
          const subscribersData = subscribers || [];
          if (exportFormat === "excel") {
            content = generateCSV(
              subscribersData as Record<string, unknown>[],
              ["ID", "Email", "Nguồn", "Trạng thái", "Ngày đăng ký"],
              ["id", "email", "source", "isActive", "createdAt"]
            );
            filename = `dreamweldtech_subscribers_${dateStr}.csv`;
            mimeType = "text/csv;charset=utf-8";
          } else {
            const rows = subscribersData.map((s: Record<string, unknown>) => `
              <tr>
                <td>${s.id}</td>
                <td>${s.email}</td>
                <td>${s.source || "website"}</td>
                <td><span class="badge ${s.status === "active" ? "badge-active" : "badge-inactive"}">${s.status === "active" ? "Hoạt động" : "Ngừng"}</span></td>
                <td>${s.createdAt ? format(new Date(s.createdAt as string), "dd/MM/yyyy", { locale: vi }) : ""}</td>
              </tr>`).join("");
            const tableHTML = `
              <table>
                <tr><th>ID</th><th>Email</th><th>Nguồn</th><th>Trạng thái</th><th>Ngày đăng ký</th></tr>
                ${rows}
              </table>`;
            const activeCount = subscribersData.filter((s: Record<string, unknown>) => s.status === "active").length;
            const summary = `<p>Tổng số subscribers: <strong>${subscribersData.length}</strong> | Đang hoạt động: <strong>${activeCount}</strong></p>`;
            content = generateHTMLReport("Báo Cáo Newsletter Subscribers", tableHTML, summary);
            filename = `dreamweldtech_subscribers_${dateStr}.html`;
            mimeType = "text/html;charset=utf-8";
          }
          break;
        }

        case "products": {
          const productsData = products || [];
          if (exportFormat === "excel") {
            content = generateCSV(
              productsData as Record<string, unknown>[],
              ["ID", "Tên sản phẩm", "Slug", "Mô tả ngắn", "Trạng thái", "Nổi bật", "Ngày tạo"],
              ["id", "name", "slug", "shortDescription", "isActive", "isFeatured", "createdAt"]
            );
            filename = `dreamweldtech_products_${dateStr}.csv`;
            mimeType = "text/csv;charset=utf-8";
          } else {
            const rows = productsData.map((p: Record<string, unknown>) => `
              <tr>
                <td>${p.id}</td>
                <td>${p.name}</td>
                <td>${p.shortDescription || ""}</td>
                <td><span class="badge ${p.isActive === "true" ? "badge-active" : "badge-inactive"}">${p.isActive === "true" ? "Hiển thị" : "Ẩn"}</span></td>
                <td>${p.isFeatured === "true" ? "⭐ Có" : "Không"}</td>
              </tr>`).join("");
            const tableHTML = `
              <table>
                <tr><th>ID</th><th>Tên sản phẩm</th><th>Mô tả ngắn</th><th>Trạng thái</th><th>Nổi bật</th></tr>
                ${rows}
              </table>`;
            const activeCount = productsData.filter((p: Record<string, unknown>) => p.isActive === "true").length;
            const summary = `<p>Tổng số sản phẩm: <strong>${productsData.length}</strong> | Đang hiển thị: <strong>${activeCount}</strong></p>`;
            content = generateHTMLReport("Báo Cáo Danh Sách Sản Phẩm", tableHTML, summary);
            filename = `dreamweldtech_products_${dateStr}.html`;
            mimeType = "text/html;charset=utf-8";
          }
          break;
        }
      }

      downloadFile(content, filename, mimeType);
      toast.success(`Đã xuất báo cáo: ${filename}`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Có lỗi xảy ra khi xuất báo cáo");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Xuất Báo Cáo</h1>
        <p className="text-muted-foreground">
          Xuất báo cáo thống kê hệ thống dưới dạng Excel hoặc PDF
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{products?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Sản phẩm</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{contacts?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Yêu cầu liên hệ</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Mail className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{subscribers?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Subscribers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {contacts?.filter((c: { status: string }) => c.status === "pending").length || 0}
              </p>
              <p className="text-sm text-muted-foreground">Chưa xử lý</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Chọn Loại Báo Cáo</CardTitle>
              <CardDescription>
                Chọn loại báo cáo bạn muốn xuất
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportTypes.map((type) => (
                  <div
                    key={type.value}
                    onClick={() => setReportType(type.value as ReportType)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      reportType === type.value
                        ? "border-primary bg-primary/5 ring-2 ring-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        reportType === type.value ? "bg-primary text-primary-foreground" : "bg-secondary"
                      }`}>
                        <type.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold">{type.label}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Tùy Chọn Xuất</CardTitle>
              <CardDescription>
                Chọn định dạng file xuất
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Định dạng file</label>
                <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as ExportFormat)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excel">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-green-600" />
                        Excel (CSV)
                      </div>
                    </SelectItem>
                    <SelectItem value="pdf">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-red-600" />
                        PDF (HTML)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 border-t">
                <Button 
                  onClick={handleExport} 
                  className="w-full"
                  disabled={isExporting || !hasPermission("reports.export")}
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang xuất...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Xuất Báo Cáo
                    </>
                  )}
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                <p>• Excel (CSV): Mở được trong Excel, Google Sheets</p>
                <p>• PDF (HTML): In trực tiếp hoặc lưu PDF từ trình duyệt</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Exports Info */}
      <Card>
        <CardHeader>
          <CardTitle>Hướng Dẫn Sử Dụng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold shrink-0">
                1
              </div>
              <div>
                <p className="font-medium">Chọn loại báo cáo</p>
                <p className="text-sm text-muted-foreground">
                  Chọn loại dữ liệu bạn muốn xuất: tổng quan, liên hệ, subscribers hoặc sản phẩm
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold shrink-0">
                2
              </div>
              <div>
                <p className="font-medium">Chọn định dạng</p>
                <p className="text-sm text-muted-foreground">
                  Excel (CSV) để phân tích dữ liệu, PDF (HTML) để in hoặc chia sẻ
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold shrink-0">
                3
              </div>
              <div>
                <p className="font-medium">Tải xuống</p>
                <p className="text-sm text-muted-foreground">
                  Nhấn "Xuất Báo Cáo" để tải file về máy tính của bạn
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
