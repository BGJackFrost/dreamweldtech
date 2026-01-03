import React, { createContext, useContext, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";

type Theme = "light" | "dark" | "system";

interface AdminThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isSyncing: boolean;
}

const AdminThemeContext = createContext<AdminThemeContextType | undefined>(undefined);

const THEME_KEY = "admin-theme";

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasSyncedFromDb, setHasSyncedFromDb] = useState(false);

  // Get current user
  const { data: user } = trpc.auth.me.useQuery();
  
  // Get user preferences from database
  const { data: preferences, isLoading: prefsLoading } = trpc.userPreferences.get.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user?.id && !hasSyncedFromDb }
  );
  
  // Mutation to update theme in database
  const updateThemeMutation = trpc.userPreferences.updateTheme.useMutation();

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
    if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
      setThemeState(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  // Sync theme from database on login
  useEffect(() => {
    if (preferences && !hasSyncedFromDb && !prefsLoading) {
      if (preferences.theme && ["light", "dark", "system"].includes(preferences.theme)) {
        setThemeState(preferences.theme as Theme);
        localStorage.setItem(THEME_KEY, preferences.theme);
        applyTheme(preferences.theme as Theme);
      }
      setHasSyncedFromDb(true);
    }
  }, [preferences, hasSyncedFromDb, prefsLoading]);

  const getEffectiveTheme = (t: Theme): "light" | "dark" => {
    if (t === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return t;
  };

  const applyTheme = (newTheme: Theme) => {
    const effectiveTheme = getEffectiveTheme(newTheme);
    const root = document.documentElement;
    if (effectiveTheme === "dark") {
      root.classList.add("dark");
      document.body.style.backgroundColor = "#0f172a";
      document.body.style.color = "#f1f5f9";
    } else {
      root.classList.remove("dark");
      document.body.style.backgroundColor = "#ffffff";
      document.body.style.color = "#1e293b";
    }
  };

  // Listen for system theme changes when using "system" theme
  useEffect(() => {
    if (theme !== "system") return;
    
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyTheme("system");
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    applyTheme(newTheme);
    
    // Sync to database if user is logged in
    if (user?.id) {
      setIsSyncing(true);
      try {
        await updateThemeMutation.mutateAsync({
          userId: user.id,
          theme: newTheme,
        });
      } catch (error) {
        console.error("Failed to sync theme to database:", error);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  return (
    <AdminThemeContext.Provider value={{ theme, setTheme, toggleTheme, isSyncing }}>
      {children}
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  const context = useContext(AdminThemeContext);
  if (!context) {
    throw new Error("useAdminTheme must be used within AdminThemeProvider");
  }
  return context;
}
