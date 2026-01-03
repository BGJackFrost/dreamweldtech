import { useLanguage } from "@/contexts/LanguageContext";
import { adminTranslations, type AdminTranslationKeys } from "@/lib/i18n/admin-translations";

export function useAdminTranslation() {
  const { language, setLanguage } = useLanguage();
  
  // Get admin translations for current language
  const adminT = adminTranslations[language as keyof typeof adminTranslations] || adminTranslations.vi;
  
  return {
    language,
    setLanguage,
    adminT,
  };
}

export type { AdminTranslationKeys };
