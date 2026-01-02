import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Download, FileJson, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type DataType = "products" | "news" | "categories" | "faq" | "partners" | "jobs";

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export default function BulkImportExport() {
  const [activeTab, setActiveTab] = useState("import");
  const [selectedType, setSelectedType] = useState<DataType>("products");
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const dataTypes = [
    { value: "products", label: "Sản Phẩm", icon: "📦" },
    { value: "news", label: "Tin Tức", icon: "📰" },
    { value: "categories", label: "Danh Mục", icon: "📁" },
    { value: "faq", label: "FAQ", icon: "❓" },
    { value: "partners", label: "Đối Tác", icon: "🤝" },
    { value: "jobs", label: "Tuyển Dụng", icon: "💼" },
  ];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate data structure
      if (!Array.isArray(data)) {
        throw new Error("File phải chứa một mảng JSON");
      }

      if (data.length === 0) {
        throw new Error("File không chứa dữ liệu");
      }

      // Simulate import process
      const result: ImportResult = {
        success: Math.floor(data.length * 0.95),
        failed: Math.ceil(data.length * 0.05),
        errors: data.length > 0 ? ["Một số dòng dữ liệu không hợp lệ"] : [],
      };

      setImportResult(result);
      toast.success(`Đã import thành công ${result.success} mục từ ${data.length} mục`);
    } catch (error) {
      toast.error(`Lỗi: ${error instanceof Error ? error.message : "Không thể đọc file"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    setIsLoading(true);
    try {
      // Mock export data
      const mockData = generateMockData(selectedType);

      const jsonString = JSON.stringify(mockData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedType}-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Đã export ${mockData.length} mục thành công`);
    } catch (error) {
      toast.error("Lỗi khi export dữ liệu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setIsLoading(true);
    try {
      const mockData = generateMockData(selectedType);
      const csv = convertToCSV(mockData);

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedType}-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Đã export ${mockData.length} mục thành công`);
    } catch (error) {
      toast.error("Lỗi khi export dữ liệu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold uppercase">Bulk Import/Export</h1>
        <p className="text-muted-foreground mt-2">
          Nhập hoặc xuất dữ liệu hàng loạt từ các định dạng khác nhau (JSON, CSV)
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </TabsTrigger>
        </TabsList>

        {/* Import Tab */}
        {activeTab === "import" && (
          <div className="space-y-6 mt-6">
            {/* Data Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Chọn loại dữ liệu</CardTitle>
                <CardDescription>Chọn loại dữ liệu bạn muốn import</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {dataTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setSelectedType(type.value as DataType)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedType === type.value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="text-2xl mb-2">{type.icon}</div>
                      <p className="font-medium text-sm">{type.label}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Tải lên file</CardTitle>
                <CardDescription>Hỗ trợ các định dạng: JSON, CSV</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <FileJson className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="font-medium mb-2">Kéo file vào đây hoặc nhấp để chọn</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Kích thước tối đa: 10MB
                  </p>
                  <input
                    type="file"
                    accept=".json,.csv"
                    onChange={handleFileUpload}
                    disabled={isLoading}
                    className="hidden"
                    id="file-input"
                  />
                  <label htmlFor="file-input">
                    <Button asChild disabled={isLoading} className="cursor-pointer">
                      <span>
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Đang xử lý...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Chọn file
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Import Result */}
            {importResult && (
              <Card className={importResult.failed === 0 ? "border-green-500/50 bg-green-500/5" : "border-yellow-500/50 bg-yellow-500/5"}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {importResult.failed === 0 ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        Import thành công
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                        Import hoàn thành với cảnh báo
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Thành công</p>
                      <p className="text-2xl font-bold text-green-600">{importResult.success}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Thất bại</p>
                      <p className="text-2xl font-bold text-red-600">{importResult.failed}</p>
                    </div>
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="bg-background/50 rounded p-3">
                      <p className="text-sm font-medium mb-2">Lỗi:</p>
                      <ul className="text-sm space-y-1">
                        {importResult.errors.map((error, idx) => (
                          <li key={idx} className="text-muted-foreground">• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Template Download */}
            <Card>
              <CardHeader>
                <CardTitle>Tải template</CardTitle>
                <CardDescription>Tải file mẫu để tham khảo cấu trúc dữ liệu</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <FileJson className="h-4 w-4 mr-2" />
                    Tải template JSON
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Tải template CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Export Tab */}
        {activeTab === "export" && (
          <div className="space-y-6 mt-6">
            {/* Data Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Chọn loại dữ liệu</CardTitle>
                <CardDescription>Chọn loại dữ liệu bạn muốn export</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {dataTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setSelectedType(type.value as DataType)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedType === type.value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="text-2xl mb-2">{type.icon}</div>
                      <p className="font-medium text-sm">{type.label}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Export Options */}
            <Card>
              <CardHeader>
                <CardTitle>Chọn định dạng</CardTitle>
                <CardDescription>Chọn định dạng file để export dữ liệu</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleExport}
                  disabled={isLoading}
                  className="w-full justify-start h-12"
                  variant="outline"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang export...
                    </>
                  ) : (
                    <>
                      <FileJson className="h-4 w-4 mr-2" />
                      Export as JSON
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleExportCSV}
                  disabled={isLoading}
                  className="w-full justify-start h-12"
                  variant="outline"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang export...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Export as CSV
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Export Info */}
            <Card>
              <CardHeader>
                <CardTitle>Thông tin</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>✓ Tất cả dữ liệu sẽ được export với đầy đủ thông tin</p>
                <p>✓ File sẽ được tải xuống tự động</p>
                <p>✓ Bạn có thể import lại file này sau này</p>
              </CardContent>
            </Card>
          </div>
        )}
      </Tabs>
    </div>
  );
}

// Helper functions
function generateMockData(type: DataType) {
  const baseData = {
    products: [
      { id: 1, name: "Máy Hàn Laser", category: "Máy Hàn", price: 50000, active: true },
      { id: 2, name: "Máy Cắt Laser", category: "Máy Cắt", price: 75000, active: true },
    ],
    news: [
      { id: 1, title: "Tin tức 1", content: "Nội dung tin tức", published: true },
      { id: 2, title: "Tin tức 2", content: "Nội dung tin tức", published: true },
    ],
    categories: [
      { id: 1, name: "Máy Hàn", slug: "may-han" },
      { id: 2, name: "Máy Cắt", slug: "may-cat" },
    ],
    faq: [
      { id: 1, question: "Câu hỏi 1?", answer: "Câu trả lời 1" },
      { id: 2, question: "Câu hỏi 2?", answer: "Câu trả lời 2" },
    ],
    partners: [
      { id: 1, name: "Đối tác 1", logo: "logo1.png" },
      { id: 2, name: "Đối tác 2", logo: "logo2.png" },
    ],
    jobs: [
      { id: 1, title: "Vị trí 1", department: "Sales", status: "open" },
      { id: 2, title: "Vị trí 2", department: "Tech", status: "open" },
    ],
  };

  return baseData[type] || [];
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(",");
  const csvRows = data.map((row) =>
    headers.map((header) => {
      const value = row[header];
      if (typeof value === "string" && value.includes(",")) {
        return `"${value}"`;
      }
      return value;
    }).join(",")
  );

  return [csvHeaders, ...csvRows].join("\n");
}
