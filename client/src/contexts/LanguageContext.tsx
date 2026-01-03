import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, Language, TranslationKeys } from "@/lib/i18n/translations";
import { trpc } from "@/lib/trpc";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
  isSyncing: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_KEY = "dreamweldtech-language";

const SUPPORTED_LANGUAGES: Language[] = ["vi", "en", "ja", "zh"];

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(LANGUAGE_KEY);
      if (saved && SUPPORTED_LANGUAGES.includes(saved as Language)) {
        return saved as Language;
      }
      // Detect browser language
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith("ja")) {
        return "ja";
      }
      if (browserLang.startsWith("zh")) {
        return "zh";
      }
      if (browserLang.startsWith("en")) {
        return "en";
      }
    }
    return "vi";
  });
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasSyncedFromDb, setHasSyncedFromDb] = useState(false);

  // Get current user
  const { data: user } = trpc.auth.me.useQuery();
  
  // Get user preferences from database
  const { data: preferences, isLoading: prefsLoading } = trpc.userPreferences.get.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id && !hasSyncedFromDb }
  );
  
  // Mutation to update language in database
  const updateLanguageMutation = trpc.userPreferences.updateLanguage.useMutation();

  // Sync language from database on login
  useEffect(() => {
    if (preferences && !hasSyncedFromDb && !prefsLoading) {
      if (preferences.language && SUPPORTED_LANGUAGES.includes(preferences.language as Language)) {
        setLanguageState(preferences.language as Language);
        localStorage.setItem(LANGUAGE_KEY, preferences.language);
      }
      setHasSyncedFromDb(true);
    }
  }, [preferences, hasSyncedFromDb, prefsLoading]);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem(LANGUAGE_KEY, lang);
    }
    
    // Sync to database if user is logged in
    if (user?.id) {
      setIsSyncing(true);
      try {
        await updateLanguageMutation.mutateAsync({
          userId: user.id,
          language: lang,
        });
      } catch (error) {
        console.error("Failed to sync language to database:", error);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  useEffect(() => {
    // Update HTML lang attribute
    document.documentElement.lang = language;
  }, [language]);

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isSyncing }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
