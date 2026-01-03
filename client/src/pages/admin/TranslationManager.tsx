import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { 
  Download, 
  Upload, 
  Languages, 
  FileJson, 
  FileSpreadsheet,
  Search,
  Edit,
  Save,
  X,
  Check,
  AlertCircle,
  Plus,
  Trash2,
  Database,
  RefreshCw,
  Loader2
} from "lucide-react";
import { useAdminTranslation } from "@/hooks/useAdminTranslation";
import { adminTranslations, type AdminLanguage } from "@/lib/i18n/admin-translations";
import AdminLayout from "@/components/AdminLayout";

// Type helper for accessing translations
const getTranslations = () => adminTranslations as Record<AdminLanguage, Record<string, unknown>>;

type TranslationKey = string;
type TranslationValue = string | Record<string, unknown>;

interface FlatTranslation {
  key: string;
  vi: string;
  en: string;
  ja: string;
  zh: string;
  [key: string]: string;
}

// Flatten nested object to dot notation
function flattenObject(obj: Record<string, unknown>, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value as Record<string, unknown>, newKey));
    } else if (typeof value === "string") {
      result[newKey] = value;
    }
  }
  
  return result;
}

// Get all translation keys from all languages
function getAllTranslationKeys(): string[] {
  const allKeys = new Set<string>();
  const translations = getTranslations();
  
  for (const lang of ["vi", "en", "ja", "zh"] as AdminLanguage[]) {
    const flattened = flattenObject(translations[lang] as Record<string, unknown>);
    Object.keys(flattened).forEach(key => allKeys.add(key));
  }
  
  return Array.from(allKeys).sort();
}

// Get flat translations for export
function getFlatTranslations(): FlatTranslation[] {
  const keys = getAllTranslationKeys();
  const translations = getTranslations();
  const viFlat = flattenObject(translations.vi as Record<string, unknown>);
  const enFlat = flattenObject(translations.en as Record<string, unknown>);
  const jaFlat = flattenObject(translations.ja as Record<string, unknown>);
  const zhFlat = flattenObject(translations.zh as Record<string, unknown>);
  
  return keys.map(key => ({
    key,
    vi: viFlat[key] || "",
    en: enFlat[key] || "",
    ja: jaFlat[key] || "",
    zh: zhFlat[key] || "",
  }));
}

export default function TranslationManager() {
  const { adminT, language } = useAdminTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLang, setSelectedLang] = useState<AdminLanguage>("vi");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Database translations state
  const [dbPage, setDbPage] = useState(1);
  const [dbSearch, setDbSearch] = useState("");
  const [dbLang, setDbLang] = useState<string>("vi");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTranslation, setNewTranslation] = useState({
    key: "",
    vi: "",
    en: "",
    ja: "",
    zh: "",
    category: "custom",
    description: "",
  });
  const [editingDbTranslation, setEditingDbTranslation] = useState<{
    id: number;
    key: string;
    language: string;
    value: string;
  } | null>(null);
  
  // TRPC queries and mutations
  const { data: dbTranslations, refetch: refetchDb, isLoading: isLoadingDb } = trpc.customTranslations.getAll.useQuery({
    language: dbLang || undefined,
    search: dbSearch || undefined,
    page: dbPage,
    limit: 20,
  });
  
  const { data: categories } = trpc.customTranslations.getCategories.useQuery();
  
  const upsertMutation = trpc.customTranslations.upsert.useMutation({
    onSuccess: () => {
      toast.success("Đã lưu translation thành công!");
      refetchDb();
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
  
  const bulkUpsertMutation = trpc.customTranslations.bulkUpsert.useMutation({
    onSuccess: (data) => {
      toast.success(`Import thành công! Tạo mới: ${data.created}, Cập nhật: ${data.updated}`);
      refetchDb();
    },
    onError: (error) => {
      toast.error(`Lỗi import: ${error.message}`);
    },
  });
  
  const deleteMutation = trpc.customTranslations.delete.useMutation({
    onSuccess: () => {
      toast.success("Đã xóa translation!");
      refetchDb();
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
  
  const translations = getFlatTranslations();
  
  // Filter translations by search term
  const filteredTranslations = translations.filter(t => 
    t.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.vi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.en.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Count missing translations per language
  const missingCounts: Record<AdminLanguage, number> = {
    vi: translations.filter(t => !t.vi).length,
    en: translations.filter(t => !t.en).length,
    ja: translations.filter(t => !t.ja).length,
    zh: translations.filter(t => !t.zh).length,
  };
  
  // Export as JSON
  const exportAsJson = () => {
    const data = {
      vi: adminTranslations.vi,
      en: adminTranslations.en,
      ja: adminTranslations.ja,
      zh: adminTranslations.zh,
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `translations-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Xuất file JSON thành công!");
  };
  
  // Export as CSV
  const exportAsCsv = () => {
    const headers = ["key", "vi", "en", "ja", "zh"];
    const rows = translations.map(t => [
      t.key,
      `"${t.vi.replace(/"/g, '""')}"`,
      `"${t.en.replace(/"/g, '""')}"`,
      `"${t.ja.replace(/"/g, '""')}"`,
      `"${t.zh.replace(/"/g, '""')}"`,
    ]);
    
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `translations-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Xuất file CSV thành công!");
  };
  
  // Export single language
  const exportSingleLanguage = (lang: AdminLanguage) => {
    const translations = getTranslations();
    const data = translations[lang];
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `translations-${lang}-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success(`Xuất file ${lang.toUpperCase()} thành công!`);
  };
  
  // Handle file import to database
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const translationsToImport: Array<{
          key: string;
          language: string;
          value: string;
          category?: string;
        }> = [];
        
        if (file.name.endsWith(".json")) {
          const data = JSON.parse(content);
          
          // Handle multi-language JSON
          if (data.vi || data.en || data.ja || data.zh) {
            for (const lang of ["vi", "en", "ja", "zh"]) {
              if (data[lang]) {
                const flattened = flattenObject(data[lang]);
                for (const [key, value] of Object.entries(flattened)) {
                  if (value) {
                    translationsToImport.push({
                      key,
                      language: lang,
                      value,
                      category: "imported",
                    });
                  }
                }
              }
            }
          } else {
            // Single language JSON - use selected language
            const flattened = flattenObject(data);
            for (const [key, value] of Object.entries(flattened)) {
              if (value) {
                translationsToImport.push({
                  key,
                  language: dbLang,
                  value,
                  category: "imported",
                });
              }
            }
          }
        } else if (file.name.endsWith(".csv")) {
          const lines = content.split("\n");
          const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
          
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].match(/(".*?"|[^,]+)/g);
            if (!values) continue;
            
            const key = values[0]?.replace(/"/g, "").trim();
            if (!key) continue;
            
            // Support both formats: key,value OR key,vi,en,ja,zh
            if (headers.length >= 5 && headers.includes("vi")) {
              const viIdx = headers.indexOf("vi");
              const enIdx = headers.indexOf("en");
              const jaIdx = headers.indexOf("ja");
              const zhIdx = headers.indexOf("zh");
              
              if (viIdx >= 0 && values[viIdx]) {
                translationsToImport.push({
                  key,
                  language: "vi",
                  value: values[viIdx].replace(/^"|"$/g, "").replace(/""/g, '"'),
                  category: "imported",
                });
              }
              if (enIdx >= 0 && values[enIdx]) {
                translationsToImport.push({
                  key,
                  language: "en",
                  value: values[enIdx].replace(/^"|"$/g, "").replace(/""/g, '"'),
                  category: "imported",
                });
              }
              if (jaIdx >= 0 && values[jaIdx]) {
                translationsToImport.push({
                  key,
                  language: "ja",
                  value: values[jaIdx].replace(/^"|"$/g, "").replace(/""/g, '"'),
                  category: "imported",
                });
              }
              if (zhIdx >= 0 && values[zhIdx]) {
                translationsToImport.push({
                  key,
                  language: "zh",
                  value: values[zhIdx].replace(/^"|"$/g, "").replace(/""/g, '"'),
                  category: "imported",
                });
              }
            } else if (values[1]) {
              // Simple key,value format
              translationsToImport.push({
                key,
                language: dbLang,
                value: values[1].replace(/^"|"$/g, "").replace(/""/g, '"'),
                category: "imported",
              });
            }
          }
        } else {
          toast.error("Chỉ hỗ trợ file JSON hoặc CSV");
          return;
        }
        
        if (translationsToImport.length > 0) {
          await bulkUpsertMutation.mutateAsync({ translations: translationsToImport });
        } else {
          toast.warning("Không tìm thấy translations hợp lệ trong file");
        }
      } catch (error) {
        toast.error("Lỗi khi đọc file");
        console.error(error);
      }
    };
    
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  // Save new translation to database
  const handleAddTranslation = async () => {
    if (!newTranslation.key) {
      toast.error("Vui lòng nhập key");
      return;
    }
    
    const translationsToAdd: Array<{
      key: string;
      language: string;
      value: string;
      category?: string;
      description?: string;
    }> = [];
    
    if (newTranslation.vi) {
      translationsToAdd.push({
        key: newTranslation.key,
        language: "vi",
        value: newTranslation.vi,
        category: newTranslation.category,
        description: newTranslation.description,
      });
    }
    if (newTranslation.en) {
      translationsToAdd.push({
        key: newTranslation.key,
        language: "en",
        value: newTranslation.en,
        category: newTranslation.category,
        description: newTranslation.description,
      });
    }
    if (newTranslation.ja) {
      translationsToAdd.push({
        key: newTranslation.key,
        language: "ja",
        value: newTranslation.ja,
        category: newTranslation.category,
        description: newTranslation.description,
      });
    }
    if (newTranslation.zh) {
      translationsToAdd.push({
        key: newTranslation.key,
        language: "zh",
        value: newTranslation.zh,
        category: newTranslation.category,
        description: newTranslation.description,
      });
    }
    
    if (translationsToAdd.length === 0) {
      toast.error("Vui lòng nhập ít nhất một bản dịch");
      return;
    }
    
    await bulkUpsertMutation.mutateAsync({ translations: translationsToAdd });
    setIsAddDialogOpen(false);
    setNewTranslation({
      key: "",
      vi: "",
      en: "",
      ja: "",
      zh: "",
      category: "custom",
      description: "",
    });
  };
  
  // Update database translation
  const handleUpdateDbTranslation = async () => {
    if (!editingDbTranslation) return;
    
    await upsertMutation.mutateAsync({
      key: editingDbTranslation.key,
      language: editingDbTranslation.language,
      value: editingDbTranslation.value,
    });
    
    setEditingDbTranslation(null);
  };
  
  const languageNames: Record<AdminLanguage, string> = {
    vi: "Tiếng Việt",
    en: "English",
    ja: "日本語",
    zh: "中文",
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Languages className="h-6 w-6" />
              Quản Lý Bản Dịch
            </h1>
            <p className="text-muted-foreground">Export/Import và quản lý translations cho Admin Panel</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-2">
              <Languages className="h-4 w-4" />
              {translations.length} static keys
            </Badge>
            <Badge variant="secondary" className="gap-2">
              <Database className="h-4 w-4" />
              {dbTranslations?.total || 0} database keys
            </Badge>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {(["vi", "en", "ja", "zh"] as AdminLanguage[]).map(lang => (
            <Card key={lang}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{languageNames[lang]}</p>
                    <p className="text-2xl font-bold">
                      {translations.length - missingCounts[lang]}
                      <span className="text-sm font-normal text-muted-foreground">/{translations.length}</span>
                    </p>
                  </div>
                  {missingCounts[lang] > 0 ? (
                    <Badge variant="destructive">{missingCounts[lang]} thiếu</Badge>
                  ) : (
                    <Badge variant="default" className="bg-green-500">
                      <Check className="h-3 w-3 mr-1" />
                      Đầy đủ
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Tabs defaultValue="database" className="space-y-4">
          <TabsList>
            <TabsTrigger value="database" className="gap-2">
              <Database className="h-4 w-4" />
              Database
            </TabsTrigger>
            <TabsTrigger value="export" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
            <TabsTrigger value="import" className="gap-2">
              <Upload className="h-4 w-4" />
              Import
            </TabsTrigger>
            <TabsTrigger value="browse" className="gap-2">
              <Search className="h-4 w-4" />
              Static Keys
            </TabsTrigger>
          </TabsList>
          
          {/* Database Tab */}
          <TabsContent value="database" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Custom Translations (Database)</CardTitle>
                    <CardDescription>Quản lý translations tùy chỉnh lưu trong database</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => refetchDb()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                    <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Thêm mới
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm kiếm key hoặc nội dung..."
                      value={dbSearch}
                      onChange={(e) => setDbSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={dbLang} onValueChange={setDbLang}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Ngôn ngữ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="vi">Tiếng Việt</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ja">日本語</SelectItem>
                      <SelectItem value="zh">中文</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {isLoadingDb ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-3 font-medium">Key</th>
                            <th className="text-left p-3 font-medium w-20">Ngôn ngữ</th>
                            <th className="text-left p-3 font-medium">Giá trị</th>
                            <th className="text-left p-3 font-medium w-24">Category</th>
                            <th className="w-24 p-3"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {dbTranslations?.translations.map((t, idx) => (
                            <tr key={t.id} className={idx % 2 === 0 ? "bg-muted/20" : ""}>
                              <td className="p-3 font-mono text-sm">{t.key}</td>
                              <td className="p-3">
                                <Badge variant="outline">{t.language.toUpperCase()}</Badge>
                              </td>
                              <td className="p-3">
                                {editingDbTranslation?.id === t.id ? (
                                  <Input
                                    value={editingDbTranslation.value}
                                    onChange={(e) => setEditingDbTranslation({
                                      ...editingDbTranslation,
                                      value: e.target.value,
                                    })}
                                  />
                                ) : (
                                  <span className="line-clamp-2">{t.value}</span>
                                )}
                              </td>
                              <td className="p-3">
                                <Badge variant="secondary">{t.category}</Badge>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-1">
                                  {editingDbTranslation?.id === t.id ? (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleUpdateDbTranslation}
                                        disabled={upsertMutation.isPending}
                                      >
                                        {upsertMutation.isPending ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <Check className="h-4 w-4 text-green-500" />
                                        )}
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setEditingDbTranslation(null)}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setEditingDbTranslation({
                                          id: t.id,
                                          key: t.key,
                                          language: t.language,
                                          value: t.value,
                                        })}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive"
                                        onClick={() => deleteMutation.mutate({ id: t.id })}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                          {(!dbTranslations?.translations || dbTranslations.translations.length === 0) && (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                Chưa có custom translations. Click "Thêm mới" để tạo.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Pagination */}
                    {dbTranslations && dbTranslations.totalPages > 1 && (
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Trang {dbTranslations.page} / {dbTranslations.totalPages} ({dbTranslations.total} kết quả)
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={dbPage <= 1}
                            onClick={() => setDbPage(p => p - 1)}
                          >
                            Trước
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={dbPage >= dbTranslations.totalPages}
                            onClick={() => setDbPage(p => p + 1)}
                          >
                            Sau
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Export Tất Cả Ngôn Ngữ</CardTitle>
                <CardDescription>Xuất toàn bộ static translations ra file để dịch offline</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-4">
                <Button onClick={exportAsJson} className="gap-2">
                  <FileJson className="h-4 w-4" />
                  Export JSON
                </Button>
                <Button onClick={exportAsCsv} variant="outline" className="gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Export CSV
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Export Theo Ngôn Ngữ</CardTitle>
                <CardDescription>Xuất translations của một ngôn ngữ cụ thể</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(["vi", "en", "ja", "zh"] as AdminLanguage[]).map(lang => (
                  <Button 
                    key={lang} 
                    variant="outline" 
                    onClick={() => exportSingleLanguage(lang)}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {languageNames[lang]}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Import Tab */}
          <TabsContent value="import" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Import Translations vào Database</CardTitle>
                <CardDescription>
                  Upload file JSON hoặc CSV để import translations vào database
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.csv"
                    onChange={handleFileImport}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">Kéo thả file hoặc click để chọn</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Hỗ trợ: JSON, CSV
                    </p>
                  </label>
                </div>
                
                <div className="flex items-start gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Database className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800 dark:text-blue-200">Import vào Database</p>
                    <p className="text-blue-700 dark:text-blue-300">
                      File import sẽ được lưu trực tiếp vào database. Các translations có cùng key và ngôn ngữ sẽ được cập nhật.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Browse Static Tab */}
          <TabsContent value="browse" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Static Translations</CardTitle>
                    <CardDescription>Xem translations từ file admin-translations.ts (chỉ đọc)</CardDescription>
                  </div>
                  <Select value={selectedLang} onValueChange={(v) => setSelectedLang(v as AdminLanguage)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["vi", "en", "ja", "zh"] as AdminLanguage[]).map(lang => (
                        <SelectItem key={lang} value={lang}>{languageNames[lang]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm key hoặc nội dung..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="border rounded-lg max-h-[500px] overflow-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="text-left p-3 font-medium">Key</th>
                        <th className="text-left p-3 font-medium">{languageNames[selectedLang]}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTranslations.slice(0, 100).map((t, idx) => (
                        <tr key={t.key} className={idx % 2 === 0 ? "bg-muted/20" : ""}>
                          <td className="p-3 font-mono text-sm text-muted-foreground">{t.key}</td>
                          <td className="p-3">
                            <span className={!t[selectedLang] ? "text-red-500 italic" : ""}>
                              {t[selectedLang] || "(chưa dịch)"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {filteredTranslations.length > 100 && (
                  <p className="text-sm text-muted-foreground text-center">
                    Hiển thị 100/{filteredTranslations.length} kết quả. Sử dụng tìm kiếm để lọc.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Add Translation Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Thêm Translation Mới</DialogTitle>
              <DialogDescription>
                Tạo translation mới và lưu vào database
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="key">Key *</Label>
                  <Input
                    id="key"
                    placeholder="custom.my_key"
                    value={newTranslation.key}
                    onChange={(e) => setNewTranslation({ ...newTranslation, key: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newTranslation.category}
                    onValueChange={(v) => setNewTranslation({ ...newTranslation, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="common">Common</SelectItem>
                      <SelectItem value="imported">Imported</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Mô tả (cho người dịch)</Label>
                <Input
                  id="description"
                  placeholder="Mô tả ngữ cảnh sử dụng..."
                  value={newTranslation.description}
                  onChange={(e) => setNewTranslation({ ...newTranslation, description: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vi">Tiếng Việt</Label>
                  <Textarea
                    id="vi"
                    placeholder="Bản dịch tiếng Việt..."
                    value={newTranslation.vi}
                    onChange={(e) => setNewTranslation({ ...newTranslation, vi: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="en">English</Label>
                  <Textarea
                    id="en"
                    placeholder="English translation..."
                    value={newTranslation.en}
                    onChange={(e) => setNewTranslation({ ...newTranslation, en: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ja">日本語</Label>
                  <Textarea
                    id="ja"
                    placeholder="日本語翻訳..."
                    value={newTranslation.ja}
                    onChange={(e) => setNewTranslation({ ...newTranslation, ja: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zh">中文</Label>
                  <Textarea
                    id="zh"
                    placeholder="中文翻译..."
                    value={newTranslation.zh}
                    onChange={(e) => setNewTranslation({ ...newTranslation, zh: e.target.value })}
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleAddTranslation} disabled={bulkUpsertMutation.isPending}>
                {bulkUpsertMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Lưu
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
