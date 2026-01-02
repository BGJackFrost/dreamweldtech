import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "dreamweldtech_notification_settings";

interface NotificationTypes {
  contact: boolean;
  quote: boolean;
  application: boolean;
  newsletter: boolean;
  system: boolean;
}

interface NotificationSettings {
  isEnabled: boolean;
  soundEnabled: boolean;
  dndEndTime: number | null; // Unix timestamp
  notificationTypes: NotificationTypes;
}

const defaultSettings: NotificationSettings = {
  isEnabled: true,
  soundEnabled: true,
  dndEndTime: null,
  notificationTypes: {
    contact: true,
    quote: true,
    application: true,
    newsletter: true,
    system: true,
  },
};

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    if (typeof window === "undefined") return defaultSettings;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Check if DND has expired
        if (parsed.dndEndTime && parsed.dndEndTime < Date.now()) {
          parsed.dndEndTime = null;
        }
        return { ...defaultSettings, ...parsed };
      }
    } catch (e) {
      console.error("Failed to load notification settings:", e);
    }
    return defaultSettings;
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error("Failed to save notification settings:", e);
    }
  }, [settings]);

  // Check DND expiration periodically
  useEffect(() => {
    if (!settings.dndEndTime) return;

    const checkDnd = () => {
      if (settings.dndEndTime && settings.dndEndTime < Date.now()) {
        setSettings((prev) => ({ ...prev, dndEndTime: null }));
      }
    };

    const interval = setInterval(checkDnd, 1000);
    return () => clearInterval(interval);
  }, [settings.dndEndTime]);

  // Computed: Is DND currently active?
  const isDndActive = settings.dndEndTime !== null && settings.dndEndTime > Date.now();

  // Set enabled state
  const setIsEnabled = useCallback((enabled: boolean) => {
    setSettings((prev) => ({ ...prev, isEnabled: enabled }));
  }, []);

  // Set sound enabled
  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSettings((prev) => ({ ...prev, soundEnabled: enabled }));
  }, []);

  // Activate DND mode for specified minutes
  const setDndMode = useCallback((minutes: number) => {
    const endTime = Date.now() + minutes * 60 * 1000;
    setSettings((prev) => ({ ...prev, dndEndTime: endTime }));
  }, []);

  // Clear DND mode
  const clearDndMode = useCallback(() => {
    setSettings((prev) => ({ ...prev, dndEndTime: null }));
  }, []);

  // Toggle specific notification type
  const toggleNotificationType = useCallback((type: string) => {
    setSettings((prev) => ({
      ...prev,
      notificationTypes: {
        ...prev.notificationTypes,
        [type]: !prev.notificationTypes[type as keyof NotificationTypes],
      },
    }));
  }, []);

  // Get remaining DND time as formatted string
  const getRemainingDndTime = useCallback((): string => {
    if (!settings.dndEndTime) return "";
    
    const remaining = settings.dndEndTime - Date.now();
    if (remaining <= 0) return "";

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }, [settings.dndEndTime]);

  // Check if a specific notification type should be shown
  const shouldShowNotification = useCallback(
    (type: string): boolean => {
      // If notifications are disabled globally
      if (!settings.isEnabled) return false;

      // If DND is active
      if (isDndActive) return false;

      // Check specific type
      const typeKey = type as keyof NotificationTypes;
      if (typeKey in settings.notificationTypes) {
        return settings.notificationTypes[typeKey];
      }

      // Default to true for unknown types
      return true;
    },
    [settings.isEnabled, settings.notificationTypes, isDndActive]
  );

  return {
    // State
    isEnabled: settings.isEnabled,
    soundEnabled: settings.soundEnabled,
    isDndActive,
    dndEndTime: settings.dndEndTime,
    notificationTypes: settings.notificationTypes,

    // Actions
    setIsEnabled,
    setSoundEnabled,
    setDndMode,
    clearDndMode,
    toggleNotificationType,

    // Helpers
    getRemainingDndTime,
    shouldShowNotification,
  };
}

export type { NotificationSettings, NotificationTypes };
