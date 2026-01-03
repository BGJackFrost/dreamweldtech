import { useCallback, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { translations as staticTranslations } from "@/lib/i18n/translations";
import { adminTranslations } from "@/lib/i18n/admin-translations";

type Language = "vi" | "en" | "ja" | "zh";
type TranslationScope = "public" | "admin" | "all";

interface UseCustomTranslationOptions {
  scope?: TranslationScope;
  category?: string;
}

/**
 * Hook để merge translations từ database với static translations
 * Database translations có độ ưu tiên cao hơn, cho phép override bất kỳ text nào
 * 
 * @example
 * // Sử dụng cơ bản
 * const { t, isLoading } = useCustomTranslation();
 * const title = t("nav.home"); // Lấy từ database nếu có, nếu không lấy từ static
 * 
 * @example
 * // Sử dụng với scope
 * const { t } = useCustomTranslation({ scope: "admin" });
 * const dashboardTitle = t("dashboard.title");
 */
export function useCustomTranslation(options: UseCustomTranslationOptions = {}) {
  const { scope = "all", category } = options;
  const { language } = useLanguage();
  
  // Fetch custom translations từ database
  const { data: customTranslations, isLoading } = trpc.customTranslations.getByLanguage.useQuery(
    { 
      language: language as string,
      category: category,
    },
    {
      staleTime: 5 * 60 * 1000, // Cache 5 phút
      refetchOnWindowFocus: false,
    }
  );
  
  // Flatten nested object to dot notation for lookup
  const flattenObject = useCallback((obj: Record<string, unknown>, prefix = ""): Record<string, string> => {
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
  }, []);
  
  // Merge static translations với database translations
  const mergedTranslations = useMemo(() => {
    const lang = language as Language;
    let staticFlat: Record<string, string> = {};
    
    // Lấy static translations dựa trên scope
    if (scope === "public" || scope === "all") {
      const publicStatic = staticTranslations[lang] || staticTranslations.vi;
      staticFlat = { ...staticFlat, ...flattenObject(publicStatic as Record<string, unknown>) };
    }
    
    if (scope === "admin" || scope === "all") {
      const adminStatic = adminTranslations[lang] || adminTranslations.vi;
      staticFlat = { ...staticFlat, ...flattenObject(adminStatic as Record<string, unknown>) };
    }
    
    // Merge với database translations (database có độ ưu tiên cao hơn)
    if (customTranslations) {
      return { ...staticFlat, ...customTranslations };
    }
    
    return staticFlat;
  }, [language, scope, customTranslations, flattenObject]);
  
  /**
   * Lấy translation theo key
   * @param key - Key của translation (dot notation, e.g., "nav.home")
   * @param fallback - Giá trị mặc định nếu không tìm thấy
   * @param params - Object chứa các biến để thay thế trong translation
   */
  const t = useCallback((
    key: string, 
    fallback?: string,
    params?: Record<string, string | number>
  ): string => {
    let value = mergedTranslations[key] || fallback || key;
    
    // Thay thế các biến trong translation
    // Hỗ trợ format: {{variable}} hoặc {variable}
    if (params) {
      for (const [paramKey, paramValue] of Object.entries(params)) {
        value = value.replace(new RegExp(`\\{\\{${paramKey}\\}\\}|\\{${paramKey}\\}`, "g"), String(paramValue));
      }
    }
    
    return value;
  }, [mergedTranslations]);
  
  /**
   * Kiểm tra xem translation có tồn tại không
   */
  const hasTranslation = useCallback((key: string): boolean => {
    return key in mergedTranslations;
  }, [mergedTranslations]);
  
  /**
   * Lấy tất cả translations theo prefix
   * @param prefix - Prefix của key (e.g., "nav" sẽ lấy tất cả nav.*)
   */
  const getByPrefix = useCallback((prefix: string): Record<string, string> => {
    const result: Record<string, string> = {};
    const prefixWithDot = prefix.endsWith(".") ? prefix : `${prefix}.`;
    
    for (const [key, value] of Object.entries(mergedTranslations)) {
      if (key.startsWith(prefixWithDot)) {
        const shortKey = key.slice(prefixWithDot.length);
        result[shortKey] = value;
      }
    }
    
    return result;
  }, [mergedTranslations]);
  
  /**
   * Tìm kiếm translations theo keyword
   * @param keyword - Từ khóa tìm kiếm (trong cả key và value)
   */
  const search = useCallback((keyword: string): Array<{ key: string; value: string }> => {
    const lowerKeyword = keyword.toLowerCase();
    const results: Array<{ key: string; value: string }> = [];
    
    for (const [key, value] of Object.entries(mergedTranslations)) {
      if (
        key.toLowerCase().includes(lowerKeyword) ||
        value.toLowerCase().includes(lowerKeyword)
      ) {
        results.push({ key, value });
      }
    }
    
    return results;
  }, [mergedTranslations]);
  
  return {
    t,
    hasTranslation,
    getByPrefix,
    search,
    language: language as Language,
    isLoading,
    translations: mergedTranslations,
  };
}

/**
 * Hook đơn giản hóa cho Admin pages
 */
export function useAdminCustomTranslation() {
  return useCustomTranslation({ scope: "admin" });
}

/**
 * Hook đơn giản hóa cho Public pages
 */
export function usePublicCustomTranslation() {
  return useCustomTranslation({ scope: "public" });
}

export default useCustomTranslation;
