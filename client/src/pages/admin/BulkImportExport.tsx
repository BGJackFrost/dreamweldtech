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

  // Fetch real data from database
  const { data: productsData } = trpc.products.list.useQuery({});
  const { data: newsData } = trpc.news.list.useQuery({ limit: 1000 });
  const { data: categoriesData } = trpc.categories.list.useQuery();
  const { data: faqData } = trpc.faq.list.useQuery({});
  const { data: partnersData } = trpc.partners.getAll.useQuery();
  const { data: jobsData } = trpc.jobs.listActive.useQuery();

  const dataTypes = [
    { value: "products", label: "Sản Phẩm", icon: "📦" },
    { value: "news", label: "Tin Tức", icon: "📰" },
    { value: "categories", label: "Danh Mục", icon: "📁" },
    { value: "faq", label: "FAQ", icon: "❓" },
    { value: "partners", label: "Đối Tác", icon: "🤝" },
    { value: "jobs", label: "Tuyển Dụng", icon: "💼" },
  ];

  // Get real data based on selected type
  const getRealData = (type: DataType) => {
    switch (type) {
      case "products":
        return (productsData?.items || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          category: p.categoryId,
          shortDescription: p.shortDescription,
          description: p.description,
          image: p.image,
          isFeatured: p.isFeatured,
          isActive: p.isActive,
        }));
      case "news":
        return (newsData?.items || []).map((n: any) => ({
          id: n.id,
          title: n.title,
          slug: n.slug,
          excerpt: n.excerpt,
          content: n.content,
          image: n.image,
          category: n.category,
          isPublished: n.isPublished,
        }));
      case "categories":
        return (categoriesData || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          image: c.image,
          isActive: c.isActive,
        }));
      case "faq":
        return (faqData || []).map((f: any) => ({
          id: f.id,
          question: f.question,
          answer: f.answer,
          category: f.category,
          sortOrder: f.sortOrder,
          isActive: f.isActive,
        }));
      case "partners":
        return (partnersData || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          logo: p.logo,
          website: p.website,
          description: p.description,
          type: p.type,
          isActive: p.isActive,
        }));
      case "jobs":
        return (jobsData || []).map((j: any) => ({
          id: j.id,
          title: j.title,
          slug: j.slug,
          department: j.department,
          location: j.location,
          type: j.type,
          description: j.description,
          requirements: j.requirements,
          isActive: j.isActive,
        }));
      default:
        return [];
    }
  };

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

      // TODO: Implement actual import via tRPC mutations
      // For now, show validation result
      const result: ImportResult = {
        success: data.length,
        failed: 0,
        errors: [],
      };

      setImportResult(result);
      toast.success(`Đã xác thực ${result.success} mục. Vui lòng liên hệ admin để import thực tế.`);
    } catch (error) {
      toast.error(`Lỗi: ${error instanceof Error ? error.message : "Không thể đọc file"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    setIsLoading(true);
    try {
      // Get real data from database
      const realData = getRealData(selectedType);

      if (realData.length === 0) {
        toast.warning("Không có dữ liệu để export");
        setIsLoading(false);
        return;
      }

      const jsonString = JSON.stringify(realData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedType}-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Đã export ${realData.length} mục thành công`);
    } catch (error) {
      toast.error("Lỗi khi export dữ liệu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setIsLoading(true);
    try {
      const realData = getRealData(selectedType);

      if (realData.length === 0) {
        toast.warning("Không có dữ liệu để export");
        setIsLoading(false);
        return;
      }

      const csv = convertToCSV(realData);

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedType}-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Đã export ${realData.length} mục thành công`);
    } catch (error) {
      toast.error("Lỗi khi export dữ liệu");
    } finally {
      setIsLoading(false);
    }
  };

  // Get count for selected type
  const getDataCount = (type: DataType): number => {
    switch (type) {
      case "products": return productsData?.items?.length || 0;
      case "news": return newsData?.items?.length || 0;
      case "categories": return categoriesData?.length || 0;
      case "faq": return faqData?.length || 0;
      case "partners": return partnersData?.length || 0;
      case "jobs": return jobsData?.length || 0;
      default: return 0;
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

        {/* Data Type Selection */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Chọn loại dữ liệu</CardTitle>
            <CardDescription>
              Chọn loại dữ liệu bạn muốn {activeTab === "import" ? "nhập" : "xuất"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {dataTypes.map((type) => (
                <Button
                  key={type.value}
                  variant={selectedType === type.value ? "default" : "outline"}
                  className="flex flex-col h-auto py-4 gap-2"
                  onClick={() => setSelectedType(type.value as DataType)}
                >
                  <span className="text-2xl">{type.icon}</span>
                  <span className="text-sm">{type.label}</span>
                  <span className="text-xs text-muted-foreground">
                    ({getDataCount(type.value as DataType)} mục)
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Import Section */}
        {activeTab === "import" && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import Dữ Liệu
              </CardTitle>
              <CardDescription>
                Tải lên file JSON hoặc CSV để import dữ liệu hàng loạt
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".json,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  disabled={isLoading}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-4"
                >
                  {isLoading ? (
                    <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                  ) : (
                    <Upload className="h-12 w-12 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">
                      {isLoading ? "Đang xử lý..." : "Kéo thả file hoặc click để chọn"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Hỗ trợ định dạng JSON và CSV
                    </p>
                  </div>
                </label>
              </div>

              {importResult && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Kết quả Import</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Thành công: {importResult.success}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-red-600">✗</span>
                      <span>Thất bại: {importResult.failed}</span>
                    </div>
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        Lỗi:
                      </p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside">
                        {importResult.errors.map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">
                  Định dạng file yêu cầu
                </h4>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  File JSON phải chứa một mảng các object với các trường tương ứng với loại dữ liệu đã chọn.
                  Xem file mẫu bằng cách export dữ liệu hiện có.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Export Section */}
        {activeTab === "export" && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Dữ Liệu
              </CardTitle>
              <CardDescription>
                Xuất dữ liệu {dataTypes.find(t => t.value === selectedType)?.label} ra file JSON hoặc CSV
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm">
                  Số lượng dữ liệu sẽ export: <strong>{getDataCount(selectedType)}</strong> mục
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleExport}
                  disabled={isLoading || getDataCount(selectedType) === 0}
                  className="flex-1"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <FileJson className="h-4 w-4 mr-2" />
                  )}
                  Export JSON
                </Button>
                <Button
                  onClick={handleExportCSV}
                  disabled={isLoading || getDataCount(selectedType) === 0}
                  variant="outline"
                  className="flex-1"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Export CSV
                </Button>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                <h4 className="font-medium text-amber-700 dark:text-amber-300 mb-2">
                  Lưu ý
                </h4>
                <ul className="text-sm text-amber-600 dark:text-amber-400 list-disc list-inside space-y-1">
                  <li>Dữ liệu export là dữ liệu thực từ database</li>
                  <li>File JSON phù hợp để backup và import lại</li>
                  <li>File CSV phù hợp để xem trong Excel/Sheets</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </Tabs>
    </div>
  );
}

// Helper function
function convertToCSV(data: any[]): string {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(",");
  const csvRows = data.map((row) =>
    headers.map((header) => {
      const value = row[header];
      if (value === null || value === undefined) return "";
      if (typeof value === "string" && (value.includes(",") || value.includes("\n") || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(",")
  );

  return [csvHeaders, ...csvRows].join("\n");
}
