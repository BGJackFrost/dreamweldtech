import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
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
  AlertCircle
} from "lucide-react";
import { useAdminTranslation } from "@/hooks/useAdminTranslation";
import { adminTranslations, type AdminLanguage } from "@/lib/i18n/admin-translations";

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
  const { adminT } = useAdminTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLang, setSelectedLang] = useState<AdminLanguage>("vi");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
  
  // Handle file import
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        
        if (file.name.endsWith(".json")) {
          const data = JSON.parse(content);
          // Validate structure
          if (data.vi || data.en || data.ja || data.zh) {
            toast.success("File JSON hợp lệ! Để áp dụng, vui lòng cập nhật file admin-translations.ts");
            console.log("Imported translations:", data);
          } else {
            toast.error("File JSON không đúng định dạng");
          }
        } else if (file.name.endsWith(".csv")) {
          const lines = content.split("\n");
          const headers = lines[0].split(",");
          const translations: Record<string, Record<string, string>> = {
            vi: {}, en: {}, ja: {}, zh: {}
          };
          
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].match(/(".*?"|[^,]+)/g);
            if (!values) continue;
            
            const key = values[0]?.replace(/"/g, "");
            if (!key) continue;
            
            translations.vi[key] = values[1]?.replace(/^"|"$/g, "").replace(/""/g, '"') || "";
            translations.en[key] = values[2]?.replace(/^"|"$/g, "").replace(/""/g, '"') || "";
            translations.ja[key] = values[3]?.replace(/^"|"$/g, "").replace(/""/g, '"') || "";
            translations.zh[key] = values[4]?.replace(/^"|"$/g, "").replace(/""/g, '"') || "";
          }
          
          toast.success("File CSV đã được phân tích! Để áp dụng, vui lòng cập nhật file admin-translations.ts");
          console.log("Imported translations:", translations);
        } else {
          toast.error("Chỉ hỗ trợ file JSON hoặc CSV");
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
  
  const startEditing = (key: string, value: string) => {
    setEditingKey(key);
    setEditValue(value);
  };
  
  const cancelEditing = () => {
    setEditingKey(null);
    setEditValue("");
  };
  
  const saveEditing = () => {
    if (!editingKey) return;
    
    // In a real implementation, this would save to the database
    // For now, just show a message
    toast.info(`Để lưu thay đổi, vui lòng cập nhật file admin-translations.ts với key: ${editingKey}`);
    console.log(`Update translation: ${editingKey} = ${editValue}`);
    cancelEditing();
  };
  
  const languageNames: Record<AdminLanguage, string> = {
    vi: "Tiếng Việt",
    en: "English",
    ja: "日本語",
    zh: "中文",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản Lý Bản Dịch</h1>
          <p className="text-muted-foreground">Export/Import và quản lý translations cho Admin Panel</p>
        </div>
        <Badge variant="outline" className="gap-2">
          <Languages className="h-4 w-4" />
          {translations.length} keys
        </Badge>
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
      
      <Tabs defaultValue="export" className="space-y-4">
        <TabsList>
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
            Duyệt
          </TabsTrigger>
        </TabsList>
        
        {/* Export Tab */}
        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Tất Cả Ngôn Ngữ</CardTitle>
              <CardDescription>Xuất toàn bộ translations ra file để dịch offline</CardDescription>
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
              <CardTitle>Import Translations</CardTitle>
              <CardDescription>
                Upload file JSON hoặc CSV để xem trước và áp dụng translations mới
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
              
              <div className="flex items-start gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">Lưu ý</p>
                  <p className="text-yellow-700 dark:text-yellow-300">
                    File import sẽ được phân tích và hiển thị trong console. Để áp dụng thay đổi, 
                    bạn cần cập nhật file <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">admin-translations.ts</code> thủ công.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Browse Tab */}
        <TabsContent value="browse" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Duyệt Translations</CardTitle>
                  <CardDescription>Xem và tìm kiếm tất cả translation keys</CardDescription>
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
                      <th className="w-20 p-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTranslations.slice(0, 100).map((t, idx) => (
                      <tr key={t.key} className={idx % 2 === 0 ? "bg-muted/20" : ""}>
                        <td className="p-3 font-mono text-sm text-muted-foreground">{t.key}</td>
                        <td className="p-3">
                          {editingKey === t.key ? (
                            <Textarea
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="min-h-[60px]"
                            />
                          ) : (
                            <span className={!t[selectedLang] ? "text-red-500 italic" : ""}>
                              {t[selectedLang] || "(chưa dịch)"}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {editingKey === t.key ? (
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={saveEditing}>
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={cancelEditing}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => startEditing(t.key, t[selectedLang])}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredTranslations.length > 100 && (
                  <div className="p-4 text-center text-muted-foreground">
                    Hiển thị 100/{filteredTranslations.length} kết quả. Sử dụng tìm kiếm để lọc thêm.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
